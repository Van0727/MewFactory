import { SELL_SHOP_WIDTH_CELLS } from '../game/gridCoords';
import type { IsoOrigin } from './isometric';
import { getWideCellTopCorners } from './isometric';
import { getSellShopSprite } from './assets';
import { drawRectOnIsoQuad } from './spriteDraw';

export function drawSellShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
): void {
  const img = getSellShopSprite();
  const sourceWidth = img.naturalWidth || 512;
  const sourceHeight = img.naturalHeight || 256;
  const corners = getWideCellTopCorners(gx, gy, SELL_SHOP_WIDTH_CELLS, origin);
  drawRectOnIsoQuad(ctx, img, corners, sourceWidth, sourceHeight);
}
