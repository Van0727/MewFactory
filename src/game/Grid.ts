import { GRID_SIZE } from '../config';
import { BuildingType, type Building } from './Building';
import type { BuildingShopKind } from './buildingShopCatalog';

export class Grid {
  private cells: (Building | null)[][];
  private mutationGates: (Building | null)[][];
  private shopCells = new Set<string>();
  private buildingShopCells = new Map<string, BuildingShopKind>();

  constructor() {
    this.cells = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null),
    );
    this.mutationGates = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null),
    );
  }

  inBounds(gx: number, gy: number): boolean {
    return gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE;
  }

  get(gx: number, gy: number): Building | null {
    if (!this.inBounds(gx, gy)) {
      return null;
    }
    return this.cells[gy][gx];
  }

  getMutationGate(gx: number, gy: number): Building | null {
    if (!this.inBounds(gx, gy)) {
      return null;
    }
    return this.mutationGates[gy][gx];
  }

  set(gx: number, gy: number, building: Building): void {
    if (!this.inBounds(gx, gy)) {
      return;
    }
    this.cells[gy][gx] = building;
    if (building.type !== BuildingType.Conveyor) {
      this.mutationGates[gy][gx] = null;
    }
  }

  setMutationGate(gx: number, gy: number, gate: Building): void {
    if (!this.inBounds(gx, gy)) {
      return;
    }
    this.mutationGates[gy][gx] = gate;
  }

  remove(gx: number, gy: number): Building | null {
    if (!this.inBounds(gx, gy)) {
      return null;
    }

    const gate = this.mutationGates[gy][gx];
    if (gate) {
      this.mutationGates[gy][gx] = null;
      return gate;
    }

    const building = this.cells[gy][gx];
    this.cells[gy][gx] = null;
    return building;
  }

  isEmpty(gx: number, gy: number): boolean {
    return (
      this.get(gx, gy) === null && !this.isShop(gx, gy) && !this.isBuildingShop(gx, gy)
    );
  }

  markBuildingShop(gx: number, gy: number, kind: BuildingShopKind): void {
    if (!this.inBounds(gx, gy)) {
      return;
    }
    this.buildingShopCells.set(this.cellKey(gx, gy), kind);
  }

  getBuildingShop(gx: number, gy: number): BuildingShopKind | null {
    return this.buildingShopCells.get(this.cellKey(gx, gy)) ?? null;
  }

  isBuildingShop(gx: number, gy: number): boolean {
    return this.buildingShopCells.has(this.cellKey(gx, gy));
  }

  forEachBuildingShop(callback: (gx: number, gy: number, kind: BuildingShopKind) => void): void {
    for (const [key, kind] of this.buildingShopCells.entries()) {
      const [gx, gy] = key.split(',').map(Number);
      callback(gx, gy, kind);
    }
  }

  markShop(gx: number, gy: number): void {
    if (!this.inBounds(gx, gy)) {
      return;
    }
    this.shopCells.add(this.cellKey(gx, gy));
  }

  isShop(gx: number, gy: number): boolean {
    return this.shopCells.has(this.cellKey(gx, gy));
  }

  forEachShop(callback: (gx: number, gy: number) => void): void {
    for (const key of this.shopCells) {
      const [gx, gy] = key.split(',').map(Number);
      callback(gx, gy);
    }
  }

  private cellKey(gx: number, gy: number): string {
    return `${gx},${gy}`;
  }

  hasConveyor(gx: number, gy: number): boolean {
    const building = this.get(gx, gy);
    return building?.type === BuildingType.Conveyor;
  }

  canPlaceMutationGate(gx: number, gy: number): boolean {
    return this.hasConveyor(gx, gy) && this.getMutationGate(gx, gy) === null;
  }

  hasPickupTarget(gx: number, gy: number): boolean {
    return this.getMutationGate(gx, gy) !== null || this.get(gx, gy) !== null;
  }

  forEachBuilding(callback: (gx: number, gy: number, building: Building) => void): void {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const building = this.cells[gy][gx];
        if (building) {
          callback(gx, gy, building);
        }
      }
    }
  }
}
