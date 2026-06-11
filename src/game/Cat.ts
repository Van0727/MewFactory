import { CAT_BASE_PRICE, CAT_BASE_QUALITY } from '../config';

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
  };
}

export function resetCatIdCounter(): void {
  nextCatId = 1;
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
