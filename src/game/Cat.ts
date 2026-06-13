import {
  CAT_BASE_PRICE,
  CAT_BASE_QUALITY,
  CAT_MUTATION_PULSE_DURATION,
  CAT_MUTATION_PULSE_PEAK_SCALE,
} from '../config';

export interface Cat {
  id: number;
  /** 网格坐标（连续值，0.5 表示格子中心） */
  x: number;
  y: number;
  quality: number;
  basePrice: number;
  mutated: boolean;
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

export function createCat(x: number, y: number): Cat {
  return {
    id: nextCatId++,
    x,
    y,
    quality: CAT_BASE_QUALITY,
    basePrice: CAT_BASE_PRICE,
    mutated: false,
    approachingBox: null,
    recentCells: [],
    pulseAnim: null,
  };
}

export function resetCatIdCounter(): void {
  nextCatId = 1;
}

export function getCatPrice(cat: Cat): number {
  return Math.round(cat.basePrice * cat.quality);
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

export function getBoxCenter(gx: number, gy: number): { x: number; y: number } {
  return { x: gx + 0.5, y: gy + 0.5 };
}

export function getCatCell(cat: Cat): { gx: number; gy: number } {
  return {
    gx: Math.floor(cat.x),
    gy: Math.floor(cat.y),
  };
}
