import { getAttributeShopSprite } from './assets';
import { getTileTopCorners, type IsoOrigin } from './isometric';
import { drawSpriteInIsoTile } from './spriteDraw';

export function drawAttributeShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
): void {
  const topCorners = getTileTopCorners(gx, gy, origin);
  const img = getAttributeShopSprite();
  drawSpriteInIsoTile(ctx, img, topCorners);
}
