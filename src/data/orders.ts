import {
  GRID_SIZE,
  ORDER_BASE_PASSES,
  ORDER_INITIAL_QTY,
  ORDER_PASSES_PER_REBIRTH,
  ORDER_QTY_PER_REBIRTH_LEVEL,
  ORDER_RUBY_PER_CAT,
  ORDER_RUBY_PER_REBIRTH,
} from '../config';
import { BUILDING_MAX_LEVEL } from './buildings';
import type { HeldCatDisplayState, HeldCatEntry } from '../game/HeldCats';
import { getHeldCatDisplayState } from '../game/HeldCats';
import { BuildingType } from '../game/Building';
import type { Grid } from '../game/Grid';
import type { Inventory } from '../game/Inventory';

export type OrderGateLevel = 1 | 2 | 3 | 4;

export interface Order {
  nestLevel: number;
  quantity: number;
  gateLevel: OrderGateLevel;
  minPasses: number;
  rubyPerCat: number;
  delivered: number;
}

export function getOrderRubyReward(order: Order): number {
  return order.delivered * order.rubyPerCat;
}

export function getOrderMaxRubyReward(order: Order): number {
  return order.quantity * order.rubyPerCat;
}

export interface OrderUnlockContext {
  ownedCatNestLevels: ReadonlySet<number>;
  ownedGateLevels: ReadonlySet<number>;
}

const GATE_REQUIREMENT_LABELS: Record<OrderGateLevel, string> = {
  1: '变大',
  2: '跳舞',
  3: '翻跟斗',
  4: '烧烤',
};

const ORDER_PURCHASED_WEIGHT = 0.8;

/** 前 3 单固定需求；第 3 单「1 级狗」= 2 级猫窝（旺旺窝） */
const FIXED_ORDER_SPECS: ReadonlyArray<{
  nestLevel: number;
  gateLevel: OrderGateLevel;
  minPasses: number;
  quantity: number;
}> = [
  { nestLevel: 1, gateLevel: 1, minPasses: 1, quantity: 5 },
  { nestLevel: 1, gateLevel: 2, minPasses: 1, quantity: 5 },
  { nestLevel: 2, gateLevel: 2, minPasses: 1, quantity: 5 },
];

export const FIXED_ORDER_COUNT = FIXED_ORDER_SPECS.length;

export function generateFixedOrder(
  index: number,
  rebirthCount: number,
): Order | null {
  const spec = FIXED_ORDER_SPECS[index];
  if (!spec) {
    return null;
  }
  return {
    nestLevel: spec.nestLevel,
    quantity: spec.quantity,
    gateLevel: spec.gateLevel,
    minPasses: spec.minPasses,
    rubyPerCat: ORDER_RUBY_PER_CAT + rebirthCount * ORDER_RUBY_PER_REBIRTH,
    delivered: 0,
  };
}

export function getGateStacks(
  display: HeldCatDisplayState,
  gateLevel: OrderGateLevel,
): number {
  switch (gateLevel) {
    case 1:
      return display.inflateStacks;
    case 2:
      return display.danceStacks;
    case 3:
      return display.flipCount;
    case 4:
      return display.barbecueStacks;
    default:
      return 0;
  }
}

export function formatOrderRequirement(order: Order): string {
  return `${GATE_REQUIREMENT_LABELS[order.gateLevel]}${order.minPasses}次`;
}

export function orderPreviewDisplay(order: Order): HeldCatDisplayState {
  const display: HeldCatDisplayState = {
    nestLevel: order.nestLevel,
    inflateStacks: 0,
    danceStacks: 0,
    barbecueStacks: 0,
    flipCount: 0,
  };
  switch (order.gateLevel) {
    case 1:
      display.inflateStacks = order.minPasses;
      break;
    case 2:
      display.danceStacks = order.minPasses;
      break;
    case 3:
      display.flipCount = order.minPasses;
      break;
    case 4:
      display.barbecueStacks = order.minPasses;
      break;
    default:
      break;
  }
  return display;
}

export function orderPreviewEntry(order: Order): HeldCatEntry {
  const display = orderPreviewDisplay(order);
  return {
    nestLevel: order.nestLevel,
    value: 0,
    display,
  };
}

export function matchesOrder(entry: HeldCatEntry, order: Order): boolean {
  const display = getHeldCatDisplayState(entry);
  if (display.nestLevel !== order.nestLevel) {
    return false;
  }
  return getGateStacks(display, order.gateLevel) >= order.minPasses;
}

function pickOwnedOrNext(owned: ReadonlySet<number>, maxLevel: number): number {
  const ownedList = [...owned]
    .filter((level) => level >= 1 && level <= maxLevel)
    .sort((a, b) => a - b);
  if (ownedList.length === 0) {
    ownedList.push(1);
  }

  const maxOwned = Math.max(...ownedList);
  const nextLevel = maxOwned + 1;
  const canPickNext = nextLevel <= maxLevel;

  if (canPickNext && Math.random() >= ORDER_PURCHASED_WEIGHT) {
    return nextLevel;
  }
  return ownedList[Math.floor(Math.random() * ownedList.length)];
}

export function collectOrderUnlockContext(
  grid: Grid,
  inventory: Inventory,
  purchasedCatNestLevels: ReadonlySet<number>,
  purchasedGateLevels: ReadonlySet<number>,
): OrderUnlockContext {
  const ownedCatNestLevels = new Set(purchasedCatNestLevels);
  const ownedGateLevels = new Set(purchasedGateLevels);

  grid.forEachBuilding((_gx, _gy, building) => {
    if (building.type === BuildingType.CatNest) {
      ownedCatNestLevels.add(building.level);
    }
  });

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const gate = grid.getMutationGate(gx, gy);
      if (gate) {
        ownedGateLevels.add(gate.level);
      }
    }
  }

  for (const building of inventory.flattenProductionParts()) {
    if (building.type === BuildingType.CatNest) {
      ownedCatNestLevels.add(building.level);
    }
    if (building.type === BuildingType.MutationGate) {
      ownedGateLevels.add(building.level);
    }
  }

  if (ownedCatNestLevels.size === 0) {
    ownedCatNestLevels.add(1);
  }

  return { ownedCatNestLevels, ownedGateLevels };
}

export function getOrderQuantity(rebirthCount: number): number {
  if (rebirthCount <= 0) {
    return ORDER_INITIAL_QTY;
  }
  return rebirthCount * ORDER_QTY_PER_REBIRTH_LEVEL;
}

export function generateOrder(
  rebirthCount: number,
  unlock: OrderUnlockContext,
): Order {
  const quantity = getOrderQuantity(rebirthCount);
  const minPasses = ORDER_BASE_PASSES + rebirthCount * ORDER_PASSES_PER_REBIRTH;
  const rubyPerCat = ORDER_RUBY_PER_CAT + rebirthCount * ORDER_RUBY_PER_REBIRTH;

  const nestLevel = pickOwnedOrNext(
    unlock.ownedCatNestLevels,
    BUILDING_MAX_LEVEL.CatNest,
  );
  const gateLevel = pickOwnedOrNext(
    unlock.ownedGateLevels,
    BUILDING_MAX_LEVEL.MutationGate,
  ) as OrderGateLevel;

  return {
    nestLevel,
    quantity,
    gateLevel,
    minPasses,
    rubyPerCat,
    delivered: 0,
  };
}
