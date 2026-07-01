import { GRID_SIZE } from '../config';
import {
  BuildingType,
  createBuilding,
  Direction,
  type Building,
} from './Building';
import type { Grid } from './Grid';
import {
  findMaxPipelineLayout,
  findPipelineLayout,
  markLayoutBlocked,
  placePipelineLayout,
  type PipelineLayout,
  type PipelineParts,
} from './pipelineLayout';
import { getPlayerSpawnCell, userCellToGrid } from './gridCoords';
import type { Simulation } from './Simulation';

const STARTER_LEVEL = 1;
const STARTER_CONVEYOR_COUNT = 5;
const STARTER_NEST_USER_CELL = { x: 2, y: 5 };

const MAP_FILL_RATIO = 0.8;
const MIN_STARTER_LINES = 3;
const MAX_STARTER_LINES = 5;
const BARBECUE_GATE_LEVEL = 4;

interface GateSeedState {
  barbecuePlaced: boolean;
}

function gateCountForLine(conveyorCount: number): number {
  if (conveyorCount <= 0) {
    return 0;
  }
  return Math.round(conveyorCount / 2);
}

/** 充气门 70%、精舞门 20%、颠倒门 10% */
function pickNonBarbecueGateLevel(): number {
  const roll = Math.random();
  if (roll < 0.5) {
    return 1;
  }
  if (roll < 0.8) {
    return 2;
  }
  return 3;
}

function pickGateLevel(state: GateSeedState): number {
  if (!state.barbecuePlaced && Math.random() < 0.25) {
    state.barbecuePlaced = true;
    return BARBECUE_GATE_LEVEL;
  }
  return pickNonBarbecueGateLevel();
}

function cellKey(gx: number, gy: number): string {
  return `${gx},${gy}`;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 将 total 随机拆成 buckets 份（每份 ≥ 0） */
function randomPartition(total: number, buckets: number): number[] {
  const counts = new Array<number>(buckets).fill(0);
  for (let i = 0; i < total; i++) {
    counts[Math.floor(Math.random() * buckets)] += 1;
  }
  return counts;
}

/** 从传送带节中随机选出若干节挂变异门 */
function pickRandomGateIndices(conveyorCount: number, gateCount: number): number[] {
  if (conveyorCount <= 0 || gateCount <= 0) {
    return [];
  }
  const pickCount = Math.min(gateCount, conveyorCount);
  const pool = Array.from({ length: conveyorCount }, (_, i) => i);
  const picked: number[] = [];
  for (let g = 0; g < pickCount; g++) {
    const pick = Math.floor(Math.random() * pool.length);
    picked.push(pool[pick]);
    pool.splice(pick, 1);
  }
  return picked.sort((a, b) => a - b);
}

function randomGateLevel(state: GateSeedState): number {
  return pickGateLevel(state);
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/** 为 N 条流水线分配互不相同的传送带等级（1~5） */
function pickDistinctConveyorLevels(lineCount: number): number[] {
  const pool = [1, 2, 3, 4, 5];
  shuffleInPlace(pool);
  const levels: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    levels.push(pool[i % pool.length]);
  }
  return levels;
}

function randomLineLevel(excluded: ReadonlySet<number> = new Set()): number {
  const pool = [1, 2, 3, 4, 5].filter((level) => !excluded.has(level));
  if (pool.length === 0) {
    return randomInt(1, 5);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function gatherStarterBlocked(grid: Grid): Set<string> {
  const blocked = new Set<string>();
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      if (!grid.isEmpty(gx, gy)) {
        blocked.add(cellKey(gx, gy));
      }
    }
  }
  const spawn = getPlayerSpawnCell();
  blocked.add(cellKey(spawn.gx, spawn.gy));
  return blocked;
}

function buildPipelineParts(
  conveyorCount: number,
  level: number,
  gateState: GateSeedState,
): PipelineParts {
  const gateCount = gateCountForLine(conveyorCount);
  const gateIndices = new Set(
    pickRandomGateIndices(conveyorCount, gateCount),
  );
  const gates: (Building | null)[] = Array.from(
    { length: conveyorCount },
    (_, i) => {
      if (!gateIndices.has(i)) {
        return null;
      }
      return createBuilding(
        BuildingType.MutationGate,
        randomGateLevel(gateState),
        Direction.Right,
      );
    },
  );

  return {
    nest: createBuilding(BuildingType.CatNest, level, Direction.Right),
    conveyors: Array.from({ length: conveyorCount }, () =>
      createBuilding(BuildingType.Conveyor, level, Direction.Right),
    ),
    gates,
    box: createBuilding(BuildingType.PackingBox, level, Direction.Left),
  };
}

function placeStarterLine(
  grid: Grid,
  simulation: Simulation,
  layout: PipelineLayout,
  level: number,
  gateState: GateSeedState,
): void {
  const conveyorCount = layout.filter((cell) => cell.role === 'conveyor').length;
  placePipelineLayout(
    grid,
    simulation,
    layout,
    buildPipelineParts(conveyorCount, level, gateState),
  );
}

function tryPlaceLine(
  grid: Grid,
  blocked: Set<string>,
  desiredConveyors: number,
): PipelineLayout | null {
  const exact = findPipelineLayout(grid, blocked, desiredConveyors);
  if (exact) {
    return exact;
  }
  const fallback = findMaxPipelineLayout(grid, blocked, desiredConveyors);
  return fallback?.layout ?? null;
}

/**
 * 随机生成 3~5 条折线流水线，约占棋盘 80% 格子；每条线长度随机。
 * 需先调用 seedFixedShops，以便避开商店与玩家出生格。
 */
export function seedRandomProductionLines(grid: Grid, simulation: Simulation): void {
  const targetCells = Math.round(GRID_SIZE * GRID_SIZE * MAP_FILL_RATIO);
  const lineCount = randomInt(MIN_STARTER_LINES, MAX_STARTER_LINES);
  const lineConveyorLevels = pickDistinctConveyorLevels(lineCount);
  const blocked = gatherStarterBlocked(grid);
  const gateState: GateSeedState = { barbecuePlaced: false };

  const totalConveyors = Math.max(0, targetCells - lineCount * 2);
  const conveyorCounts = randomPartition(totalConveyors, lineCount).sort(
    (a, b) => b - a,
  );

  let usedCells = 0;
  let placedLines = 0;

  for (const desiredConveyors of conveyorCounts) {
    const layout = tryPlaceLine(grid, blocked, desiredConveyors);
    if (!layout || layout.length < 2) {
      continue;
    }
    const conveyorLevel = lineConveyorLevels[placedLines] ?? randomLineLevel(
      new Set(lineConveyorLevels),
    );
    placeStarterLine(grid, simulation, layout, conveyorLevel, gateState);
    markLayoutBlocked(blocked, layout);
    usedCells += layout.length;
    placedLines += 1;
  }

  const minAcceptable = Math.floor(targetCells * 0.85);
  const usedStarterLevels = new Set(lineConveyorLevels.slice(0, placedLines));
  while (usedCells < minAcceptable) {
    const remaining = targetCells - usedCells;
    if (remaining < 2) {
      break;
    }
    const layout = tryPlaceLine(grid, blocked, remaining - 2);
    if (!layout || layout.length < 2) {
      break;
    }
    placeStarterLine(
      grid,
      simulation,
      layout,
      randomLineLevel(usedStarterLevels),
      gateState,
    );
    markLayoutBlocked(blocked, layout);
    usedCells += layout.length;
  }
}

/** 开局地图：用户格 (2,5) 放 Lv.1 猫窝朝右，右侧连续 5 节 Lv.1 传送带朝右 */
export function seedStarterPipeline(grid: Grid, simulation: Simulation): void {
  const { gx: nestGx, gy: nestGy } = userCellToGrid(
    STARTER_NEST_USER_CELL.x,
    STARTER_NEST_USER_CELL.y,
  );

  const nest = createBuilding(
    BuildingType.CatNest,
    STARTER_LEVEL,
    Direction.Right,
  );
  grid.set(nestGx, nestGy, nest);
  simulation.onBuildingPlaced(nestGx, nestGy, nest, { nestSpawnImmediate: true });

  for (let i = 0; i < STARTER_CONVEYOR_COUNT; i++) {
    const gx = nestGx + 1 + i;
    const gy = nestGy;
    const conveyor = createBuilding(
      BuildingType.Conveyor,
      STARTER_LEVEL,
      Direction.Right,
    );
    grid.set(gx, gy, conveyor);
    simulation.onBuildingPlaced(gx, gy, conveyor);
  }
}
