import { GRID_SIZE } from '../config';
import { BUILDING_MAX_LEVEL } from '../data/buildings';
import {
  BuildingType,
  createBuilding,
  Direction,
} from './Building';
import type { Grid } from './Grid';
import type { Simulation } from './Simulation';

interface PipelineLevels {
  nest: number;
  conveyor: number;
  box: number;
}

const MIN_LEVELS: PipelineLevels = { nest: 1, conveyor: 1, box: 1 };
const CONVEYOR_COUNT = 6;
const GATES_PER_PIPELINE = 3;
const MAX_GATE_LEVEL = BUILDING_MAX_LEVEL.MutationGate;

function levelsForDemoLine(lineLevel: number): PipelineLevels {
  const level = Math.max(1, Math.min(5, lineLevel));
  return {
    nest: level,
    conveyor: level,
    box: level,
  };
}

/** 从传送带节中随机选出若干节挂变异门 */
function pickRandomGateIndices(conveyorCount: number, gateCount: number): number[] {
  const pool = Array.from({ length: conveyorCount }, (_, i) => i);
  const picked: number[] = [];
  for (let g = 0; g < gateCount; g++) {
    const pick = Math.floor(Math.random() * pool.length);
    picked.push(pool[pick]);
    pool.splice(pick, 1);
  }
  return picked.sort((a, b) => a - b);
}

function randomGateLevel(): number {
  return 1 + Math.floor(Math.random() * MAX_GATE_LEVEL);
}

/** 猫窝 → 6 节传送带（随机 3 节挂 Lv.1~4 变异门）→ 包装箱 */
function seedPipeline(
  grid: Grid,
  simulation: Simulation,
  row: number,
  levels: PipelineLevels,
): void {
  const nestX = 0;
  const boxX = nestX + 1 + CONVEYOR_COUNT;
  const gateIndices = new Set(
    pickRandomGateIndices(CONVEYOR_COUNT, GATES_PER_PIPELINE),
  );

  const nest = createBuilding(BuildingType.CatNest, levels.nest, Direction.Right);
  grid.set(nestX, row, nest);
  simulation.onBuildingPlaced(nestX, row, nest, { nestSpawnImmediate: true });

  for (let i = 0; i < CONVEYOR_COUNT; i++) {
    const gx = nestX + 1 + i;
    const conveyor = createBuilding(BuildingType.Conveyor, levels.conveyor, Direction.Right);
    grid.set(gx, row, conveyor);
    simulation.onBuildingPlaced(gx, row, conveyor);

    if (gateIndices.has(i)) {
      const gate = createBuilding(
        BuildingType.MutationGate,
        randomGateLevel(),
        conveyor.direction,
      );
      grid.setMutationGate(gx, row, gate);
    }
  }

  const box = createBuilding(BuildingType.PackingBox, levels.box, Direction.Left);
  grid.set(boxX, row, box);
  simulation.onBuildingPlaced(boxX, row, box);
}

/**
 * 五条演示流水线：Lv.1 ~ Lv.5 猫窝/传送带/包装箱；每条 6 节传送带、3 个随机变异门。
 */
export function seedDemoProductionLines(grid: Grid, simulation: Simulation): void {
  const rows = [0, 1, 2, 3, 4];

  for (let i = 0; i < rows.length; i++) {
    seedPipeline(grid, simulation, rows[i], levelsForDemoLine(i + 1));
  }
}

/** 单条 Lv.1 基础流水线（正式开始游戏用） */
export function seedBasicPipeline(grid: Grid, simulation: Simulation): void {
  const row = Math.floor(GRID_SIZE / 2);
  seedPipeline(grid, simulation, row, MIN_LEVELS);
}

/** @deprecated 使用 seedDemoProductionLines */
export function seedStarterPipeline(grid: Grid, simulation: Simulation): void {
  seedDemoProductionLines(grid, simulation);
}
