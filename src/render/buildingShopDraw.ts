import { BuildingType, createBuilding, Direction } from '../game/Building';
import type { BuildingShopKind } from '../game/buildingShopCatalog';
import { getGridCellAnchor } from './tileBounds';
import { drawBuilding } from './buildingDraw';
import type { IsoOrigin } from './isometric';

export function drawBuildingShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  kind: BuildingShopKind,
  origin: IsoOrigin,
): void {
  const preview = createBuilding(kind, 1, Direction.Right);
  drawBuilding(ctx, gx, gy, preview, origin);

  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = Math.max(10, 12);

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe566';
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 3;
  const text = kind === BuildingType.MutationGate ? '门店' : '商店';
  ctx.strokeText(text, cx, cy - fontSize * 1.8);
  ctx.fillText(text, cx, cy - fontSize * 1.8);
  ctx.restore();
}
