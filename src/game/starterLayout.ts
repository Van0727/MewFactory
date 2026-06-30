import { GRID_SIZE } from '../config';
import { BUILDING_MAX_LEVEL } from '../data/buildings';
import {
  BuildingType,
  createBuilding,
  Direction,
  type Building,
} from './Building';
import type { Grid } from './Grid';
import type { Simulation } from './Simulation';

interface PipelineLevels {
  nest: number;
  conveyor: number;
  box: number;
}

export const PIPELINE_CONVEYOR_COUNT = 6;
const GATES_PER_PIPELINE = 3;
const MAX_GATE_LEVEL = BUILDING_MAX_LEVEL.MutationGate;

const MIN_LEVELS: PipelineLevels = { nest: 1, conveyor: 1, box: 1 };

export interface PipelineRowParts {
  nest: Building;
  conveyors: Building[];
  gates: (Building | null)[];
  box: Building;
}

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

export function getPipelineBoxX(): number {
  return 1 + PIPELINE_CONVEYOR_COUNT;
}

/** 流水线行 x=0..boxX 是否为空（含商店等地标） */
export function isPipelineRowAvailable(grid: Grid, row: number): boolean {
  const boxX = getPipelineBoxX();
  for (let gx = 0; gx <= boxX; gx++) {
    if (!grid.isEmpty(gx, row)) {
      return false;
    }
  }
  return true;
}

/** 扫描所有可放置完整流水线的行 */
export function findAvailablePipelineRows(grid: Grid): number[] {
  const rows: number[] = [];
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    if (isPipelineRowAvailable(grid, gy)) {
      rows.push(gy);
    }
  }
  return rows;
}

/** 按指定部件放置一行流水线（方向固定：窝/带 Right，箱 Left） */
export function placePipelineRow(
  grid: Grid,
  simulation: Simulation,
  row: number,
  parts: PipelineRowParts,
): void {
  const nestX = 0;
  const boxX = getPipelineBoxX();

  const nest = createBuilding(
    BuildingType.CatNest,
    parts.nest.level,
    Direction.Right,
  );
  grid.set(nestX, row, nest);
  simulation.onBuildingPlaced(nestX, row, nest, { nestSpawnImmediate: true });

  for (let i = 0; i < PIPELINE_CONVEYOR_COUNT; i++) {
    const gx = nestX + 1 + i;
    const src = parts.conveyors[i];
    const conveyor = createBuilding(
      BuildingType.Conveyor,
      src.level,
      Direction.Right,
    );
    grid.set(gx, row, conveyor);
    simulation.onBuildingPlaced(gx, row, conveyor);

    const gate = parts.gates[i];
    if (gate) {
      const placedGate = createBuilding(
        BuildingType.MutationGate,
        gate.level,
        conveyor.direction,
      );
      grid.setMutationGate(gx, row, placedGate);
    }
  }

  const box = createBuilding(
    BuildingType.PackingBox,
    parts.box.level,
    Direction.Left,
  );
  grid.set(boxX, row, box);
  simulation.onBuildingPlaced(boxX, row, box);
}

/** 猫窝 → 6 节传送带（随机 3 节挂 Lv.1~4 变异门）→ 包装箱 */
function seedPipeline(
  grid: Grid,
  simulation: Simulation,
  row: number,
  levels: PipelineLevels,
): void {
  const gateIndices = new Set(
    pickRandomGateIndices(PIPELINE_CONVEYOR_COUNT, GATES_PER_PIPELINE),
  );
  const gates: (Building | null)[] = Array.from(
    { length: PIPELINE_CONVEYOR_COUNT },
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

  placePipelineRow(grid, simulation, row, {
    nest: createBuilding(BuildingType.CatNest, levels.nest, Direction.Right),
    conveyors: Array.from({ length: PIPELINE_CONVEYOR_COUNT }, () =>
      createBuilding(BuildingType.Conveyor, levels.conveyor, Direction.Right),
    ),
    gates,
    box: createBuilding(BuildingType.PackingBox, levels.box, Direction.Left),
  });
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

/** @deprecated 使用 autoBuildFromInventory；保留供 demo 测试 */
export function autoBuildBasicPipeline(grid: Grid, simulation: Simulation): void {
  const preferred = Math.floor(GRID_SIZE / 2);
  const rows = findAvailablePipelineRows(grid);
  const row = rows.includes(preferred)
    ? preferred
    : rows[0] ?? preferred;
  seedPipeline(grid, simulation, row, MIN_LEVELS);
}

/** @deprecated 使用 seedDemoProductionLines */
export function seedStarterPipeline(grid: Grid, simulation: Simulation): void {
  seedDemoProductionLines(grid, simulation);
}
