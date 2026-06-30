import { GRID_SIZE } from '../config';
import {
  BuildingType,
  createBuilding,
  Direction,
  type Building,
} from './Building';
import { getOffset } from './directionUtils';
import { isForbiddenAutoBuildBoxCell } from './gridCoords';
import type { Grid } from './Grid';
import type { Simulation } from './Simulation';

export interface PipelineCell {
  gx: number;
  gy: number;
  role: 'nest' | 'conveyor' | 'box';
  direction: Direction;
}

export type PipelineLayout = PipelineCell[];

export interface PipelineParts {
  nest: Building;
  conveyors: Building[];
  gates: (Building | null)[];
  box: Building;
}

export interface PipelineLayoutResult {
  layout: PipelineLayout;
  conveyorCount: number;
}

function cellKey(gx: number, gy: number): string {
  return `${gx},${gy}`;
}

function directionBetween(
  from: { gx: number; gy: number },
  to: { gx: number; gy: number },
): Direction | null {
  const dx = to.gx - from.gx;
  const dy = to.gy - from.gy;
  if (dx === 1 && dy === 0) {
    return Direction.Right;
  }
  if (dx === -1 && dy === 0) {
    return Direction.Left;
  }
  if (dx === 0 && dy === 1) {
    return Direction.Down;
  }
  if (dx === 0 && dy === -1) {
    return Direction.Up;
  }
  return null;
}

function isAdjacent(
  a: { gx: number; gy: number },
  b: { gx: number; gy: number },
): boolean {
  return directionBetween(a, b) !== null;
}

function stepCell(
  gx: number,
  gy: number,
  dir: Direction,
): { gx: number; gy: number } | null {
  const { dx, dy } = getOffset(dir);
  const nx = gx + dx;
  const ny = gy + dy;
  if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
    return null;
  }
  return { gx: nx, gy: ny };
}

function perpendicularDirs(dir: Direction): Direction[] {
  switch (dir) {
    case Direction.Left:
    case Direction.Right:
      return [Direction.Up, Direction.Down];
    case Direction.Up:
    case Direction.Down:
      return [Direction.Left, Direction.Right];
  }
}

/**
 * 转弯格保持 incoming 方向，猫走到带末后由 Simulation.resolveConveyorEnd 转向。
 * 直行格使用 outgoing 方向。
 */
function conveyorDirectionAt(
  path: { gx: number; gy: number }[],
  index: number,
): Direction {
  const prev = path[index - 1];
  const curr = path[index];
  const next = path[index + 1];
  const inDir = directionBetween(prev, curr)!;
  const outDir = directionBetween(curr, next)!;
  return outDir !== inDir ? inDir : outDir;
}

/** 根据折线路径计算每格朝向，并校验相邻连通 */
export function layoutFromPath(
  path: { gx: number; gy: number }[],
): PipelineLayout | null {
  if (path.length < 2) {
    return null;
  }

  for (let i = 0; i < path.length - 1; i++) {
    if (!isAdjacent(path[i], path[i + 1])) {
      return null;
    }
  }

  const conveyorCount = path.length - 2;
  const layout: PipelineLayout = [];

  const nestDir = directionBetween(path[0], path[1]);
  if (!nestDir) {
    return null;
  }
  layout.push({ gx: path[0].gx, gy: path[0].gy, role: 'nest', direction: nestDir });

  if (conveyorCount === 0) {
    layout.push({
      gx: path[1].gx,
      gy: path[1].gy,
      role: 'box',
      direction: nestDir,
    });
    return layout;
  }

  for (let j = 1; j <= conveyorCount; j++) {
    layout.push({
      gx: path[j].gx,
      gy: path[j].gy,
      role: 'conveyor',
      direction: conveyorDirectionAt(path, j),
    });
  }

  const lastConv = path[conveyorCount];
  const box = path[conveyorCount + 1];
  const boxDir = directionBetween(lastConv, box) ?? Direction.Left;
  layout.push({
    gx: box.gx,
    gy: box.gy,
    role: 'box',
    direction: boxDir,
  });

  return layout;
}

function canAddToPath(
  grid: Grid,
  blocked: Set<string>,
  path: { gx: number; gy: number }[],
  cell: { gx: number; gy: number },
): boolean {
  const key = cellKey(cell.gx, cell.gy);
  if (!grid.isEmpty(cell.gx, cell.gy) || blocked.has(key)) {
    return false;
  }
  return !path.some((p) => p.gx === cell.gx && p.gy === cell.gy);
}

function findOrthogonalPathFrom(
  grid: Grid,
  blocked: Set<string>,
  startGx: number,
  startGy: number,
  totalLength: number,
): { gx: number; gy: number }[] | null {
  const start = { gx: startGx, gy: startGy };
  if (!canAddToPath(grid, blocked, [], start)) {
    return null;
  }

  function dfs(
    path: { gx: number; gy: number }[],
    lastDir: Direction,
  ): { gx: number; gy: number }[] | null {
    if (path.length === totalLength) {
      const box = path[path.length - 1];
      if (isForbiddenAutoBuildBoxCell(box.gx, box.gy)) {
        return null;
      }
      return layoutFromPath(path) ? path : null;
    }

    const last = path[path.length - 1];
    const dirs = [lastDir, ...perpendicularDirs(lastDir)];

    for (const dir of dirs) {
      const next = stepCell(last.gx, last.gy, dir);
      if (!next || !canAddToPath(grid, blocked, path, next)) {
        continue;
      }
      const result = dfs([...path, next], dir);
      if (result) {
        return result;
      }
    }

    return null;
  }

  const firstDirs: Direction[] = [
    Direction.Right,
    Direction.Left,
    Direction.Down,
    Direction.Up,
  ];

  for (const dir of firstDirs) {
    const next = stepCell(startGx, startGy, dir);
    if (!next || !canAddToPath(grid, blocked, [start], next)) {
      continue;
    }
    const result = dfs([start, next], dir);
    if (result) {
      return result;
    }
  }

  return null;
}

/** 在棋盘上寻找一条可放置的流水线布局（含 nest + k 节传送带 + box） */
export function findPipelineLayout(
  grid: Grid,
  blocked: Set<string>,
  conveyorCount: number,
): PipelineLayout | null {
  const totalLength = conveyorCount + 2;
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const path = findOrthogonalPathFrom(grid, blocked, gx, gy, totalLength);
      if (path) {
        return layoutFromPath(path);
      }
    }
  }
  return null;
}

/** 在可用空间内尽量使用更多传送带（含多段折线） */
export function findMaxPipelineLayout(
  grid: Grid,
  blocked: Set<string>,
  maxConveyors: number,
): PipelineLayoutResult | null {
  for (let k = maxConveyors; k >= 0; k--) {
    const layout = findPipelineLayout(grid, blocked, k);
    if (layout) {
      return { layout, conveyorCount: k };
    }
  }
  return null;
}

export function markLayoutBlocked(
  blocked: Set<string>,
  layout: PipelineLayout,
): void {
  for (const cell of layout) {
    blocked.add(cellKey(cell.gx, cell.gy));
  }
}

export function placePipelineLayout(
  grid: Grid,
  simulation: Simulation,
  layout: PipelineLayout,
  parts: PipelineParts,
): void {
  let conveyorIndex = 0;

  for (const cell of layout) {
    if (cell.role === 'nest') {
      const nest = createBuilding(
        BuildingType.CatNest,
        parts.nest.level,
        cell.direction,
      );
      grid.set(cell.gx, cell.gy, nest);
      simulation.onBuildingPlaced(cell.gx, cell.gy, nest, {
        nestSpawnImmediate: true,
      });
      continue;
    }

    if (cell.role === 'box') {
      const box = createBuilding(
        BuildingType.PackingBox,
        parts.box.level,
        cell.direction,
      );
      grid.set(cell.gx, cell.gy, box);
      simulation.onBuildingPlaced(cell.gx, cell.gy, box);
      continue;
    }

    const src = parts.conveyors[conveyorIndex];
    const conveyor = createBuilding(
      BuildingType.Conveyor,
      src.level,
      cell.direction,
    );
    grid.set(cell.gx, cell.gy, conveyor);
    simulation.onBuildingPlaced(cell.gx, cell.gy, conveyor);

    const gate = parts.gates[conveyorIndex];
    if (gate) {
      const placedGate = createBuilding(
        BuildingType.MutationGate,
        gate.level,
        cell.direction,
      );
      grid.setMutationGate(cell.gx, cell.gy, placedGate);
    }
    conveyorIndex += 1;
  }
}

/** 扫描当前棋盘上已占用的生产格 */
export function gatherBlockedCells(grid: Grid): Set<string> {
  const blocked = new Set<string>();
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      if (grid.get(gx, gy) || grid.getMutationGate(gx, gy)) {
        blocked.add(cellKey(gx, gy));
      }
    }
  }
  return blocked;
}

/** @deprecated 均分策略已改为每条线尽量用满可用传送带 */
export function distributeConveyorCounts(
  totalConveyors: number,
  lineCount: number,
): number[] {
  const base = Math.floor(totalConveyors / lineCount);
  const remainder = totalConveyors % lineCount;
  return Array.from({ length: lineCount }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}
