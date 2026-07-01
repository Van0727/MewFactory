import {
  CAT_MUTATION_PULSE_DURATION,
  CAT_MUTATION_PULSE_PEAK_SCALE,
} from '../config';
import { getDoorMultiplier } from '../data/buildings';

/** 充气门：每层体型 +10%（1 + 0.1×N）；售价倍率见 data/door.csv */
export const INFLATE_STACK_BONUS = 0.1;

export interface CatMutationState {
  barbecueStacks: number;
  inflateStacks: number;
  danceStacks: number;
  flipCount: number;
  danceAngle: number;
}

export interface Cat {
  id: number;
  /** 网格坐标（连续值，0.5 表示格子中心） */
  x: number;
  y: number;
  /** 小猫基础价格（由猫窝等级决定，变异门会直接修改此值） */
  basePrice: number;
  /** 猫窝产出时的原始售价，用于按变异层数重算价格 */
  spawnBasePrice: number;
  /** 出生猫窝等级，决定 role 美术（role_1 ~ role_5） */
  nestLevel: number;
  /** 当前移动速度（由所在传送带等级决定） */
  speed: number;
  /** 变异门叠加状态 */
  mutations: CatMutationState;
  /** 移向包装箱中心时记录目标格 */
  approachingBox: { gx: number; gy: number } | null;
  /** 最近经过的格子，用于检测传送带循环 */
  recentCells: string[];
  /** 变异门触发的缩放脉冲动画 */
  pulseAnim: CatPulseAnim | null;
}

export interface CatPulseAnim {
  elapsed: number;
}

let nextCatId = 1;

export function createEmptyMutationState(): CatMutationState {
  return {
    barbecueStacks: 0,
    inflateStacks: 0,
    danceStacks: 0,
    flipCount: 0,
    danceAngle: 0,
  };
}

export function isCatMutated(mutations: CatMutationState): boolean {
  return (
    mutations.barbecueStacks +
      mutations.inflateStacks +
      mutations.danceStacks +
      mutations.flipCount >
    0
  );
}

export function createCat(
  x: number,
  y: number,
  basePrice = 10,
  speed = 1,
  nestLevel = 1,
): Cat {
  return {
    id: nextCatId++,
    x,
    y,
    basePrice,
    spawnBasePrice: basePrice,
    nestLevel,
    speed,
    mutations: createEmptyMutationState(),
    approachingBox: null,
    recentCells: [],
    pulseAnim: null,
  };
}

export function resetCatIdCounter(): void {
  nextCatId = 1;
}

/** 缓动缩放：1 → peak → 1，正弦曲线 */
export function getCatPulseScale(
  elapsed: number,
  duration = CAT_MUTATION_PULSE_DURATION,
  peakScale = CAT_MUTATION_PULSE_PEAK_SCALE,
): number {
  if (elapsed <= 0) {
    return 1;
  }
  if (elapsed >= duration) {
    return 1;
  }
  const t = elapsed / duration;
  return 1 + (peakScale - 1) * Math.sin(t * Math.PI);
}

/** 充气门：每层体型 +10%（1 + 0.1×N，可叠加） */
export function getCatInflateScale(mutations: CatMutationState): number {
  if (mutations.inflateStacks <= 0) {
    return 1;
  }
  return 1 + INFLATE_STACK_BONUS * mutations.inflateStacks;
}

/** 按变异层数从 spawnBasePrice 计算售价（与 data/door.csv 经过时价格倍率一致） */
export function calculateCatSellPrice(
  spawnBasePrice: number,
  mutations: CatMutationState,
): number {
  let price = spawnBasePrice;
  const m = mutations;

  if (m.inflateStacks > 0) {
    price *= Math.pow(getDoorMultiplier(1), m.inflateStacks);
  }
  if (m.danceStacks > 0) {
    price *= Math.pow(getDoorMultiplier(2), m.danceStacks);
  }
  if (m.flipCount > 0) {
    price *= Math.pow(getDoorMultiplier(3), m.flipCount);
  }
  if (m.barbecueStacks > 0) {
    price *= Math.pow(getDoorMultiplier(4), m.barbecueStacks);
  }

  return Math.round(price);
}

/** 按变异层数从 spawnBasePrice 重算售价 */
export function recalculateCatBasePrice(cat: Cat): void {
  cat.basePrice = calculateCatSellPrice(cat.spawnBasePrice, cat.mutations);
}

export function getCatPrice(cat: Cat): number {
  return calculateCatSellPrice(cat.spawnBasePrice, cat.mutations);
}

/** 到店出售时的实际金币（含转生倍率） */
export function getCatGoldSellPrice(cat: Cat, goldMultiplier: number): number {
  return Math.round(getCatPrice(cat) * goldMultiplier);
}

/** 精舞门转速倍率：1 + 门倍率 × 层数 */
export function getCatDanceSpeedMultiplier(mutations: CatMutationState): number {
  if (mutations.danceStacks <= 0) {
    return 1;
  }
  return 1 + getDoorMultiplier(2) * mutations.danceStacks;
}

/** 精舞门：沿竖直中轴线左右翻转（cos 在 1 ↔ -1 之间，非顺时针旋转） */
export function getCatDanceScaleX(mutations: CatMutationState): number {
  if (mutations.danceStacks <= 0) {
    return 1;
  }
  return Math.cos(mutations.danceAngle);
}

/** 是否被颠倒门上下翻转 */
export function isCatFlipped(mutations: CatMutationState): boolean {
  return mutations.flipCount % 2 === 1;
}

export function getBoxCenter(gx: number, gy: number): { x: number; y: number } {
  return { x: gx + 0.5, y: gy + 0.5 };
}

export function getCatCell(cat: Cat): { gx: number; gy: number } {
  return {
    gx: Math.floor(cat.x),
    gy: Math.floor(cat.y),
  };
}
