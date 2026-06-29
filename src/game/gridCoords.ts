import { GRID_SIZE } from '../config';

/**
 * 棋盘坐标：左下角 (1,1)，右上角 (10,10)
 * - 左边为 X 轴（第 1 列在左侧）
 * - 右边为 Y 轴（第 1 行在底部）
 */
export function userCellToGrid(x: number, y: number): { gx: number; gy: number } {
  return {
    gx: x - 1,
    gy: GRID_SIZE - y,
  };
}

export function gridCellToUser(gx: number, gy: number): { x: number; y: number } {
  return {
    x: gx + 1,
    y: GRID_SIZE - gy,
  };
}

/** 固定出售商店：X=5~6, Y=1（底部从左数第 5–6 格，宽 2 格） */
export const SELL_SHOP_USER_CELL = { x: 5, y: 1 };
export const SELL_SHOP_WIDTH_CELLS = 2;
export const SELL_SHOP_GRID_CELL = userCellToGrid(
  SELL_SHOP_USER_CELL.x,
  SELL_SHOP_USER_CELL.y,
);

/** 建筑回收处：右下角 X=10, Y=10 */
export const RECYCLE_DEPOT_USER_CELL = { x: 10, y: 10 };
export const RECYCLE_DEPOT_GRID_CELL = userCellToGrid(
  RECYCLE_DEPOT_USER_CELL.x,
  RECYCLE_DEPOT_USER_CELL.y,
);

/** 属性商店：X=8, Y=1 */
export const ATTRIBUTE_SHOP_USER_CELL = { x: 8, y: 1 };
export const ATTRIBUTE_SHOP_GRID_CELL = userCellToGrid(
  ATTRIBUTE_SHOP_USER_CELL.x,
  ATTRIBUTE_SHOP_USER_CELL.y,
);

export function isAttributeShopCell(gx: number, gy: number): boolean {
  return gx === ATTRIBUTE_SHOP_GRID_CELL.gx && gy === ATTRIBUTE_SHOP_GRID_CELL.gy;
}

export function isRecycleDepotCell(gx: number, gy: number): boolean {
  return gx === RECYCLE_DEPOT_GRID_CELL.gx && gy === RECYCLE_DEPOT_GRID_CELL.gy;
}

export function isSellShopCell(gx: number, gy: number): boolean {
  return (
    gy === SELL_SHOP_GRID_CELL.gy &&
    gx >= SELL_SHOP_GRID_CELL.gx &&
    gx < SELL_SHOP_GRID_CELL.gx + SELL_SHOP_WIDTH_CELLS
  );
}

/** 出售商店贴图锚点格（最左侧格） */
export function isSellShopAnchor(gx: number, gy: number): boolean {
  return gx === SELL_SHOP_GRID_CELL.gx && gy === SELL_SHOP_GRID_CELL.gy;
}

/** 出售商店中心（玩家走向的目标点） */
export function getSellShopCenter(): { x: number; y: number } {
  return {
    x: SELL_SHOP_GRID_CELL.gx + SELL_SHOP_WIDTH_CELLS / 2,
    y: SELL_SHOP_GRID_CELL.gy + 0.5,
  };
}
