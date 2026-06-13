import { SELL_SHOP_GRID_CELL } from './gridCoords';
import type { Grid } from './Grid';

/** 在棋盘上放置固定出售商店（不可拆除、不可覆盖） */
export function seedFixedShops(grid: Grid): void {
  grid.markShop(SELL_SHOP_GRID_CELL.gx, SELL_SHOP_GRID_CELL.gy);
}
