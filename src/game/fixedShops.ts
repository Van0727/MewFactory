import { BuildingType } from './Building';
import { SELL_SHOP_GRID_CELL, userCellToGrid } from './gridCoords';
import type { Grid } from './Grid';

const BUILDING_SHOP_LAYOUT = [
  { x: 10, y: 8, kind: BuildingType.CatNest },
  { x: 10, y: 6, kind: BuildingType.Conveyor },
  { x: 10, y: 4, kind: BuildingType.MutationGate },
  { x: 10, y: 2, kind: BuildingType.PackingBox },
] as const;

/** 在棋盘上放置固定出售商店与建筑商店 */
export function seedFixedShops(grid: Grid): void {
  grid.markShop(SELL_SHOP_GRID_CELL.gx, SELL_SHOP_GRID_CELL.gy);

  for (const shop of BUILDING_SHOP_LAYOUT) {
    const { gx, gy } = userCellToGrid(shop.x, shop.y);
    grid.markBuildingShop(gx, gy, shop.kind);
  }
}
