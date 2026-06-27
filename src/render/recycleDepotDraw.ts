import { getGridCellAnchor } from './tileBounds';
import { drawFloatingMapLabel, getMapShopBadgeWidth } from './mapLabelDraw';
import type { IsoOrigin } from './isometric';

const RECYCLE_LABEL = '回收';

export function drawRecycleDepot(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const badgeWidth = getMapShopBadgeWidth(ctx, origin);
  drawFloatingMapLabel(ctx, cx, cy, RECYCLE_LABEL, origin, { badgeWidth });
}
