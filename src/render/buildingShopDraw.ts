import { BuildingType, createBuilding, Direction } from '../game/Building';
import { getBuildingShopTitle, type BuildingShopKind } from '../game/buildingShopCatalog';
import { getGridCellAnchor } from './tileBounds';
import { drawBuilding } from './buildingDraw';
import { drawFloatingMapLabel, getMapShopBadgeWidth } from './mapLabelDraw';
import type { IsoOrigin } from './isometric';

const SHOP_LABEL_COLORS = {
  badgeFill: 'rgba(120, 80, 180, 0.92)',
  badgeStroke: 'rgba(255, 255, 255, 0.55)',
  textFill: '#ffe566',
  textStroke: 'rgba(60, 30, 90, 0.55)',
};

export function drawBuildingShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  kind: BuildingShopKind,
  origin: IsoOrigin,
): void {
  const previewDirection =
    kind === BuildingType.CatNest ? Direction.Up : Direction.Right;
  const preview = createBuilding(kind, 1, previewDirection);
  drawBuilding(ctx, gx, gy, preview, origin);

  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const badgeWidth = getMapShopBadgeWidth(ctx, origin);
  drawFloatingMapLabel(ctx, cx, cy, getBuildingShopTitle(kind), origin, {
    lift: 3.2,
    colors: SHOP_LABEL_COLORS,
    badgeWidth,
  });
}
