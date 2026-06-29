import { BuildingType } from './Building';
import {
  ATTRIBUTE_SHOP_GRID_CELL,
  RECYCLE_DEPOT_GRID_CELL,
  SELL_SHOP_GRID_CELL,
  SELL_SHOP_WIDTH_CELLS,
  userCellToGrid,
} from './gridCoords';
import type { Grid } from './Grid';

const BUILDING_SHOP_LAYOUT = [
  { x: 10, y: 1, kind: BuildingType.PackingBox },
  { x: 10, y: 3, kind: BuildingType.MutationGate },
  { x: 10, y: 5, kind: BuildingType.Conveyor },
  { x: 10, y: 7, kind: BuildingType.CatNest },
] as const;

/** 在棋盘上放置固定出售商店、建筑回收处与建筑商店 */
export function seedFixedShops(grid: Grid): void {
  for (let dx = 0; dx < SELL_SHOP_WIDTH_CELLS; dx++) {
    grid.markShop(SELL_SHOP_GRID_CELL.gx + dx, SELL_SHOP_GRID_CELL.gy);
  }

  grid.markRecycleDepot(RECYCLE_DEPOT_GRID_CELL.gx, RECYCLE_DEPOT_GRID_CELL.gy);
  grid.markAttributeShop(ATTRIBUTE_SHOP_GRID_CELL.gx, ATTRIBUTE_SHOP_GRID_CELL.gy);

  for (const shop of BUILDING_SHOP_LAYOUT) {
    const { gx, gy } = userCellToGrid(shop.x, shop.y);
    grid.markBuildingShop(gx, gy, shop.kind);
  }
}
