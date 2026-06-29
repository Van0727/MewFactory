import { getRecycleDepotSprite } from './assets';
import { getTileTopCorners, type IsoOrigin } from './isometric';
import { drawSpriteInIsoTile } from './spriteDraw';

export function drawRecycleDepot(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
): void {
  const topCorners = getTileTopCorners(gx, gy, origin);
  const img = getRecycleDepotSprite();
  drawSpriteInIsoTile(ctx, img, topCorners);
}
