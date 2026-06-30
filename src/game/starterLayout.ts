import { GRID_SIZE } from '../config';
import { BUILDING_MAX_LEVEL } from '../data/buildings';
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
const GATES_PER_PIPELINE = 3;
const MAX_GATE_LEVEL = BUILDING_MAX_LEVEL.MutationGate;

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

function randomGateLevel(): number {
  return 1 + Math.floor(Math.random() * MAX_GATE_LEVEL);
}

function randomLineLevel(): number {
  return randomInt(1, 5);
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

function buildPipelineParts(conveyorCount: number, level: number): PipelineParts {
  const gateIndices = new Set(
    pickRandomGateIndices(conveyorCount, GATES_PER_PIPELINE),
  );
  const gates: (Building | null)[] = Array.from(
    { length: conveyorCount },
    (_, i) => {
      if (!gateIndices.has(i)) {
        return null;
      }
      return createBuilding(
        BuildingType.MutationGate,
        randomGateLevel(),
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
): void {
  const conveyorCount = layout.filter((cell) => cell.role === 'conveyor').length;
  placePipelineLayout(grid, simulation, layout, buildPipelineParts(conveyorCount, level));
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
  const blocked = gatherStarterBlocked(grid);

  const totalConveyors = Math.max(0, targetCells - lineCount * 2);
  const conveyorCounts = randomPartition(totalConveyors, lineCount).sort(
    (a, b) => b - a,
  );

  let usedCells = 0;

  for (const desiredConveyors of conveyorCounts) {
    const layout = tryPlaceLine(grid, blocked, desiredConveyors);
    if (!layout || layout.length < 2) {
      continue;
    }
    placeStarterLine(grid, simulation, layout, randomLineLevel());
    markLayoutBlocked(blocked, layout);
    usedCells += layout.length;
  }

  const minAcceptable = Math.floor(targetCells * 0.85);
  while (usedCells < minAcceptable) {
    const remaining = targetCells - usedCells;
    if (remaining < 2) {
      break;
    }
    const layout = tryPlaceLine(grid, blocked, remaining - 2);
    if (!layout || layout.length < 2) {
      break;
    }
    placeStarterLine(grid, simulation, layout, randomLineLevel());
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
