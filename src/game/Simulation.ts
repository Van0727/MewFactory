import {
  CAT_ARRIVE_EPSILON,
  CAT_NEST_SPAWN_INTERVAL,
  CONVEYOR_SPEED,
  GRID_SIZE,
  PACKING_BOX_CAPACITY,
  PACK_BOX_PULSE_DURATION,
} from '../config';
import { BuildingType, Direction, type Building } from './Building';
import { createCat, getBoxCenter, getCatCell, type Cat } from './Cat';
import {
  ALL_DIRECTIONS,
  getNeighbor,
  getOffset,
  getOpposite,
  isOpposite,
  orderDirectionsForEnd,
} from './directionUtils';
import type { Grid } from './Grid';

type CrossAction =
  | { kind: 'enter' }
  | { kind: 'approachBox'; boxGx: number; boxGy: number }
  | { kind: 'redirect'; gx: number; gy: number }
  | { kind: 'remove' };

export class Simulation {
  private cats: Cat[] = [];
  private boxCounts: number[][];
  private boxPulseElapsed = new Map<string, number>();
  private nestSpawnTimers = new Map<string, number>();
  private grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
    this.boxCounts = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => 0),
    );
  }

  update(dt: number): void {
    this.updateBoxPulse(dt);
    this.updateCatNests(dt);
    this.updateCatMotion(dt);
  }

  getCats(): readonly Cat[] {
    return this.cats;
  }

  getBoxCount(gx: number, gy: number): number {
    if (!this.grid.inBounds(gx, gy)) {
      return 0;
    }
    return this.boxCounts[gy][gx];
  }

  getBoxDrawScale(gx: number, gy: number): number {
    const elapsed = this.boxPulseElapsed.get(this.cellKey(gx, gy));
    if (elapsed === undefined) {
      return 1;
    }
    const t = elapsed / PACK_BOX_PULSE_DURATION;
    if (t >= 1) {
      return 1;
    }
    return 1 + 0.1 * Math.sin(t * Math.PI);
  }

  onBuildingPlaced(gx: number, gy: number, building: Building): void {
    if (building.type === BuildingType.PackingBox) {
      this.boxCounts[gy][gx] = 0;
    }
  }

  onBuildingRemoved(gx: number, gy: number): void {
    this.removeCatsInCell(gx, gy);
    this.boxCounts[gy][gx] = 0;
    this.nestSpawnTimers.delete(this.cellKey(gx, gy));
    this.boxPulseElapsed.delete(this.cellKey(gx, gy));
  }

  private cellKey(gx: number, gy: number): string {
    return `${gx},${gy}`;
  }

  /** @returns true if cat revisited a cell and should be removed */
  private trackCatCell(cat: Cat, gx: number, gy: number): boolean {
    if (!cat.recentCells) {
      cat.recentCells = [];
    }
    const key = this.cellKey(gx, gy);
    if (cat.recentCells.at(-1) === key) {
      return false;
    }
    const loop = cat.recentCells.includes(key);
    cat.recentCells.push(key);
    if (cat.recentCells.length > 16) {
      cat.recentCells.shift();
    }
    return loop;
  }

  private wouldRedirectBacktrack(cat: Cat, gx: number, gy: number): boolean {
    if (!cat.recentCells) {
      return false;
    }
    return cat.recentCells.includes(this.cellKey(gx, gy));
  }

  private hasCatOnNestCell(gx: number, gy: number): boolean {
    return this.cats.some((cat) => {
      const cell = getCatCell(cat);
      return cell.gx === gx && cell.gy === gy;
    });
  }

  private addCat(cat: Cat): void {
    this.cats.push(cat);
  }

  private removeCat(cat: Cat): void {
    this.cats = this.cats.filter((c) => c.id !== cat.id);
  }

  private removeCatsInCell(gx: number, gy: number): void {
    for (const cat of [...this.cats]) {
      const cell = getCatCell(cat);
      if (cell.gx === gx && cell.gy === gy) {
        this.removeCat(cat);
      }
    }
  }

  private applyMutationGate(cat: Cat): void {
    const { gx, gy } = getCatCell(cat);
    if (this.grid.getMutationGate(gx, gy)) {
      cat.mutated = true;
    }
  }

  private triggerBoxPulse(boxGx: number, boxGy: number): void {
    this.boxPulseElapsed.set(this.cellKey(boxGx, boxGy), 0);
  }

  private updateBoxPulse(dt: number): void {
    for (const [key, elapsed] of [...this.boxPulseElapsed.entries()]) {
      const next = elapsed + dt;
      if (next >= PACK_BOX_PULSE_DURATION) {
        this.boxPulseElapsed.delete(key);
      } else {
        this.boxPulseElapsed.set(key, next);
      }
    }
  }

  private tryPack(boxGx: number, boxGy: number): void {
    const building = this.grid.get(boxGx, boxGy);
    if (building?.type !== BuildingType.PackingBox) {
      return;
    }

    this.triggerBoxPulse(boxGx, boxGy);

    if (this.boxCounts[boxGy][boxGx] < PACKING_BOX_CAPACITY) {
      this.boxCounts[boxGy][boxGx]++;
    }
  }

  private updateCatNests(dt: number): void {
    this.grid.forEachBuilding((gx, gy, building) => {
      if (building.type !== BuildingType.CatNest) {
        return;
      }

      const key = this.cellKey(gx, gy);
      const elapsed = (this.nestSpawnTimers.get(key) ?? 0) + dt;
      if (elapsed < CAT_NEST_SPAWN_INTERVAL) {
        this.nestSpawnTimers.set(key, elapsed);
        return;
      }
      this.nestSpawnTimers.set(key, 0);
      this.trySpawnFromNest(gx, gy, building);
    });
  }

  private trySpawnFromNest(gx: number, gy: number, nest: Building): void {
    if (this.hasCatOnNestCell(gx, gy)) {
      return;
    }

    const { dx, dy } = getOffset(nest.direction);
    const cat = createCat(gx + 0.5 + dx * 0.35, gy + 0.5 + dy * 0.35);

    const target = getNeighbor(gx, gy, nest.direction);
    const targetBuilding = target ? this.grid.get(target.gx, target.gy) : null;

    if (targetBuilding?.type === BuildingType.PackingBox && target) {
      cat.approachingBox = { gx: target.gx, gy: target.gy };
    }

    this.addCat(cat);
  }

  private resolveConveyorEnd(
    cat: Cat,
    cellGx: number,
    cellGy: number,
    conveyor: Building,
  ): CrossAction {
    const currentDir = conveyor.direction;
    const behindDir = getOpposite(currentDir);

    for (const dir of orderDirectionsForEnd(currentDir)) {
      if (dir === behindDir) {
        continue;
      }
      const neighbor = getNeighbor(cellGx, cellGy, dir);
      if (!neighbor) {
        continue;
      }
      const nb = this.grid.get(neighbor.gx, neighbor.gy);
      if (
        nb?.type === BuildingType.Conveyor &&
        !isOpposite(nb.direction, currentDir) &&
        nb.direction === dir &&
        !this.wouldRedirectBacktrack(cat, neighbor.gx, neighbor.gy)
      ) {
        return { kind: 'redirect', gx: neighbor.gx, gy: neighbor.gy };
      }
    }

    for (const dir of ALL_DIRECTIONS) {
      const neighbor = getNeighbor(cellGx, cellGy, dir);
      if (!neighbor) {
        continue;
      }
      const nb = this.grid.get(neighbor.gx, neighbor.gy);
      if (nb?.type === BuildingType.Conveyor && isOpposite(nb.direction, currentDir)) {
        return { kind: 'remove' };
      }
    }

    for (const dir of ALL_DIRECTIONS) {
      const neighbor = getNeighbor(cellGx, cellGy, dir);
      if (!neighbor) {
        continue;
      }
      const nb = this.grid.get(neighbor.gx, neighbor.gy);
      if (nb?.type === BuildingType.PackingBox) {
        return { kind: 'approachBox', boxGx: neighbor.gx, boxGy: neighbor.gy };
      }
    }

    return { kind: 'remove' };
  }

  private isCatOutOfBounds(cat: Cat): boolean {
    return cat.x < 0 || cat.x >= GRID_SIZE || cat.y < 0 || cat.y >= GRID_SIZE;
  }

  private handleBoundaryCrossing(
    cat: Cat,
    fromCell: { gx: number; gy: number },
    _direction: Direction,
    toCell: { gx: number; gy: number },
  ): CrossAction {
    if (!this.grid.inBounds(toCell.gx, toCell.gy)) {
      return { kind: 'remove' };
    }

    const fromBuilding = this.grid.get(fromCell.gx, fromCell.gy);
    const toBuilding = this.grid.get(toCell.gx, toCell.gy);

    if (toBuilding?.type === BuildingType.Conveyor) {
      if (
        fromBuilding?.type === BuildingType.Conveyor &&
        isOpposite(fromBuilding.direction, toBuilding.direction)
      ) {
        return { kind: 'remove' };
      }
      return { kind: 'enter' };
    }

    if (toBuilding?.type === BuildingType.PackingBox) {
      return { kind: 'approachBox', boxGx: toCell.gx, boxGy: toCell.gy };
    }

    if (fromBuilding?.type === BuildingType.Conveyor) {
      return this.resolveConveyorEnd(cat, fromCell.gx, fromCell.gy, fromBuilding);
    }

    return { kind: 'remove' };
  }

  private redirectCat(cat: Cat, gx: number, gy: number): void {
    cat.x = gx + 0.5;
    cat.y = gy + 0.5;
    cat.approachingBox = null;
    this.trackCatCell(cat, gx, gy);
    this.applyMutationGate(cat);
  }

  /** @returns true if cat should be removed */
  private updateApproachingBox(cat: Cat, dt: number): boolean {
    if (!cat.approachingBox) {
      return false;
    }

    const { gx, gy } = cat.approachingBox;
    const center = getBoxCenter(gx, gy);
    const dx = center.x - cat.x;
    const dy = center.y - cat.y;
    const dist = Math.hypot(dx, dy);
    const step = CONVEYOR_SPEED * dt;

    if (dist <= Math.max(step, CAT_ARRIVE_EPSILON)) {
      cat.x = center.x;
      cat.y = center.y;
      this.tryPack(gx, gy);
      return true;
    }

    cat.x += (dx / dist) * step;
    cat.y += (dy / dist) * step;
    return false;
  }

  private getMoveDirection(_cat: Cat, cell: { gx: number; gy: number }): Direction | null {
    const building = this.grid.get(cell.gx, cell.gy);
    if (building?.type === BuildingType.Conveyor || building?.type === BuildingType.CatNest) {
      return building.direction;
    }
    return null;
  }

  /** 沿传送带方向先对齐垂直轴上的格子中心，再沿该方向移动 */
  private moveCatTowardCenter(
    cat: Cat,
    cell: { gx: number; gy: number },
    direction: Direction,
    dt: number,
  ): boolean {
    const centerX = cell.gx + 0.5;
    const centerY = cell.gy + 0.5;
    const step = CONVEYOR_SPEED * dt;

    let offX = 0;
    let offY = 0;
    switch (direction) {
      case Direction.Left:
      case Direction.Right:
        offY = centerY - cat.y;
        break;
      case Direction.Up:
      case Direction.Down:
        offX = centerX - cat.x;
        break;
    }

    const dist = Math.hypot(offX, offY);
    if (dist <= CAT_ARRIVE_EPSILON) {
      if (offX !== 0) {
        cat.x = centerX;
      }
      if (offY !== 0) {
        cat.y = centerY;
      }
      return false;
    }

    if (dist <= step) {
      cat.x += offX;
      cat.y += offY;
    } else {
      cat.x += (offX / dist) * step;
      cat.y += (offY / dist) * step;
    }
    return true;
  }

  private updateCatMotion(dt: number): void {
    const toRemove: Cat[] = [];

    for (const cat of [...this.cats]) {
      if (cat.approachingBox) {
        if (this.updateApproachingBox(cat, dt)) {
          toRemove.push(cat);
        }
        continue;
      }

      if (this.isCatOutOfBounds(cat)) {
        toRemove.push(cat);
        continue;
      }

      const fromCell = getCatCell(cat);
      if (this.trackCatCell(cat, fromCell.gx, fromCell.gy)) {
        toRemove.push(cat);
        continue;
      }

      const direction = this.getMoveDirection(cat, fromCell);
      if (!direction) {
        continue;
      }

      if (this.moveCatTowardCenter(cat, fromCell, direction, dt)) {
        continue;
      }

      const { dx, dy } = getOffset(direction);
      const nextX = cat.x + dx * CONVEYOR_SPEED * dt;
      const nextY = cat.y + dy * CONVEYOR_SPEED * dt;
      const toCell = { gx: Math.floor(nextX), gy: Math.floor(nextY) };

      if (toCell.gx === fromCell.gx && toCell.gy === fromCell.gy) {
        cat.x = nextX;
        cat.y = nextY;
        if (this.isCatOutOfBounds(cat)) {
          toRemove.push(cat);
        }
        continue;
      }

      const crossing = this.handleBoundaryCrossing(cat, fromCell, direction, toCell);
      const toBuilding = this.grid.get(toCell.gx, toCell.gy);

      if (crossing.kind === 'enter') {
        cat.x = nextX;
        cat.y = nextY;
        const entered = getCatCell(cat);
        this.trackCatCell(cat, entered.gx, entered.gy);
        this.applyMutationGate(cat);
        continue;
      }

      if (crossing.kind === 'approachBox') {
        if (toBuilding?.type === BuildingType.PackingBox) {
          cat.x = nextX;
          cat.y = nextY;
        }
        cat.approachingBox = { gx: crossing.boxGx, gy: crossing.boxGy };
        continue;
      }

      if (crossing.kind === 'remove') {
        toRemove.push(cat);
        continue;
      }

      if (crossing.kind === 'redirect') {
        this.redirectCat(cat, crossing.gx, crossing.gy);
        continue;
      }

      toRemove.push(cat);
    }

    for (const cat of toRemove) {
      this.removeCat(cat);
    }
  }
}
