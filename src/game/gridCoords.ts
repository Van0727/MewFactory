import { GRID_SIZE } from '../config';

/**
 * 棋盘坐标：左下角 (1,1)，右上角 (10,10)
 * - 第一个数为行（第1行在底部）
 * - 第二个数为列（第1列在左侧）
 */
export function userCellToGrid(row: number, col: number): { gx: number; gy: number } {
  return {
    gx: col - 1,
    gy: GRID_SIZE - row,
  };
}

export function gridCellToUser(gx: number, gy: number): { row: number; col: number } {
  return {
    row: GRID_SIZE - gy,
    col: gx + 1,
  };
}

/** 固定出售商店：第 1 行第 5 格（底部从左数第 5 格） */
export const SELL_SHOP_USER_CELL = { row: 1, col: 5 };
export const SELL_SHOP_GRID_CELL = userCellToGrid(
  SELL_SHOP_USER_CELL.row,
  SELL_SHOP_USER_CELL.col,
);
