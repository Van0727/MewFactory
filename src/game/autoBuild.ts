import { BuildingType, type Building } from './Building';
import type { Grid } from './Grid';
import type { Inventory } from './Inventory';
import type { Simulation } from './Simulation';
import {
  findMaxPipelineLayout,
  gatherBlockedCells,
  markLayoutBlocked,
  placePipelineLayout,
  type PipelineLayout,
  type PipelineParts,
} from './pipelineLayout';

const TYPE_LABELS: Record<string, string> = {
  [BuildingType.CatNest]: '猫窝',
  [BuildingType.Conveyor]: '传送带',
  [BuildingType.PackingBox]: '包装箱',
};

export type AutoBuildPreview = {
  canProceed: boolean;
  message: string;
};

export type AutoBuildResult =
  | { ok: true; builtCount: number }
  | { ok: false; reason: 'missing_parts' | 'no_space'; message: string };

interface PartPool {
  nests: Building[];
  conveyors: Building[];
  boxes: Building[];
  gates: Building[];
}

function sortByLevelDesc(parts: Building[]): Building[] {
  return [...parts].sort((a, b) => b.level - a.level);
}

function gatherPool(inventory: Inventory): PartPool {
  const all = inventory.flattenProductionParts();
  return {
    nests: sortByLevelDesc(all.filter((b) => b.type === BuildingType.CatNest)),
    conveyors: sortByLevelDesc(all.filter((b) => b.type === BuildingType.Conveyor)),
    boxes: sortByLevelDesc(all.filter((b) => b.type === BuildingType.PackingBox)),
    gates: sortByLevelDesc(all.filter((b) => b.type === BuildingType.MutationGate)),
  };
}

function maxPipelineCountFromParts(pool: PartPool): number {
  return Math.min(pool.nests.length, pool.boxes.length);
}

function formatMissingParts(pool: PartPool): string {
  const missing: string[] = [];
  if (pool.nests.length < 1) {
    missing.push(TYPE_LABELS[BuildingType.CatNest]);
  }
  if (pool.boxes.length < 1) {
    missing.push(TYPE_LABELS[BuildingType.PackingBox]);
  }
  return `缺少${missing.join('、')}`;
}

function allocatePipelineParts(
  pool: PartPool,
  conveyorCount: number,
): PipelineParts | null {
  if (pool.nests.length < 1 || pool.boxes.length < 1) {
    return null;
  }

  const nest = pool.nests.shift()!;
  const box = pool.boxes.shift()!;
  const conveyors = pool.conveyors.splice(0, conveyorCount);

  const gates: (Building | null)[] = Array.from(
    { length: conveyorCount },
    () => null,
  );
  for (let i = 0; i < conveyorCount && pool.gates.length > 0; i++) {
    gates[i] = pool.gates.shift()!;
  }

  return { nest, conveyors, gates, box };
}

function collectUsedParts(parts: PipelineParts): Building[] {
  const used: Building[] = [parts.nest, parts.box, ...parts.conveyors];
  for (const gate of parts.gates) {
    if (gate) {
      used.push(gate);
    }
  }
  return used;
}

interface BuildPlan {
  canProceed: boolean;
  message: string;
  layouts: PipelineLayout[];
  conveyorCounts: number[];
  failReason?: 'missing_parts' | 'no_space';
}

function planLayouts(grid: Grid, pool: PartPool): BuildPlan {
  const maxLines = maxPipelineCountFromParts(pool);
  if (maxLines === 0) {
    return {
      canProceed: false,
      message: formatMissingParts(pool),
      layouts: [],
      conveyorCounts: [],
      failReason: 'missing_parts',
    };
  }

  const blocked = gatherBlockedCells(grid);
  const layouts: PipelineLayout[] = [];
  const conveyorCounts: number[] = [];
  let remainingConveyors = pool.conveyors.length;

  for (let i = 0; i < maxLines; i++) {
    const found = findMaxPipelineLayout(grid, blocked, remainingConveyors);
    if (!found) {
      break;
    }

    layouts.push(found.layout);
    conveyorCounts.push(found.conveyorCount);
    remainingConveyors -= found.conveyorCount;
    markLayoutBlocked(blocked, found.layout);
  }

  if (layouts.length === 0) {
    return {
      canProceed: false,
      message: '没有可用的搭建空间',
      layouts: [],
      conveyorCounts: [],
      failReason: 'no_space',
    };
  }

  return {
    canProceed: true,
    message: '',
    layouts,
    conveyorCounts,
  };
}

function computeBuildPlan(grid: Grid, inventory: Inventory): BuildPlan {
  const pool = gatherPool(inventory);
  return planLayouts(grid, pool);
}

export function previewAutoBuild(grid: Grid, inventory: Inventory): AutoBuildPreview {
  const plan = computeBuildPlan(grid, inventory);
  return { canProceed: plan.canProceed, message: plan.message };
}

export function autoBuildFromInventory(
  grid: Grid,
  simulation: Simulation,
  inventory: Inventory,
): AutoBuildResult {
  const preview = computeBuildPlan(grid, inventory);
  if (!preview.canProceed) {
    return {
      ok: false,
      reason: preview.failReason ?? 'missing_parts',
      message: preview.message,
    };
  }

  const pool = gatherPool(inventory);

  for (let i = 0; i < preview.layouts.length; i++) {
    const parts = allocatePipelineParts(pool, preview.conveyorCounts[i]);
    if (!parts) {
      break;
    }
    placePipelineLayout(grid, simulation, preview.layouts[i], parts);
    for (const building of collectUsedParts(parts)) {
      inventory.removeOne(building);
    }
  }

  return { ok: true, builtCount: preview.layouts.length };
}
