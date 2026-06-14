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

/** 固定出售商店：X=5, Y=1（底部从左数第 5 格） */
export const SELL_SHOP_USER_CELL = { x: 5, y: 1 };
export const SELL_SHOP_GRID_CELL = userCellToGrid(
  SELL_SHOP_USER_CELL.x,
  SELL_SHOP_USER_CELL.y,
);
