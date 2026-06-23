import { GRID_SIZE } from '../config';
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
  gate: number;
  box: number;
}

const MIN_LEVELS: PipelineLevels = { nest: 1, conveyor: 1, gate: 1, box: 1 };
const MAX_LEVELS: PipelineLevels = { nest: 5, conveyor: 5, gate: 4, box: 5 };

/** 猫窝 → 4 节传送带（第 2 节带变异门）→ 包装箱 */
function seedPipeline(
  grid: Grid,
  simulation: Simulation,
  row: number,
  levels: PipelineLevels,
): void {
  const nestX = 0;
  const conveyorCount = 4;
  const boxX = nestX + 1 + conveyorCount;
  const gateConveyorIndex = 1;

  const nest = createBuilding(BuildingType.CatNest, levels.nest, Direction.Right);
  grid.set(nestX, row, nest);
  simulation.onBuildingPlaced(nestX, row, nest, { nestSpawnImmediate: true });

  for (let i = 0; i < conveyorCount; i++) {
    const gx = nestX + 1 + i;
    const conveyor = createBuilding(BuildingType.Conveyor, levels.conveyor, Direction.Right);
    grid.set(gx, row, conveyor);
    simulation.onBuildingPlaced(gx, row, conveyor);

    if (i === gateConveyorIndex) {
      const gate = createBuilding(
        BuildingType.MutationGate,
        levels.gate,
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
 * 五条全自动演示线：奇数行最低级，偶数行最高级，便于对比差异。
 * 行 0/2/4 → Lv.1；行 1/3 → Lv.5（变异门 Lv.4）
 */
export function seedDemoProductionLines(grid: Grid, simulation: Simulation): void {
  const rows = [0, 1, 2, 3, 4];
  const levels = [MIN_LEVELS, MAX_LEVELS, MIN_LEVELS, MAX_LEVELS, MIN_LEVELS];

  for (let i = 0; i < rows.length; i++) {
    seedPipeline(grid, simulation, rows[i], levels[i]);
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
