import type { IsoOrigin } from './isometric';
import { getSprite } from './assets';
import { drawSpriteInCell } from './spriteDraw';

export function drawSellShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
): void {
  drawSpriteInCell(ctx, getSprite('sellShop'), gx, gy, origin);
}
