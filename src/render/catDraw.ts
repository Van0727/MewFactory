import { PACKING_BOX_CAPACITY } from '../config';
import type { Cat } from '../game/Cat';
import { getSprite } from './assets';
import type { IsoOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';
import { drawSpriteInCell } from './spriteDraw';

export function drawCat(
  ctx: CanvasRenderingContext2D,
  cat: Cat,
  origin: IsoOrigin,
): void {
  const sprite = cat.mutated ? getSprite('catMutated') : getSprite('catNormal');
  drawSpriteInCell(ctx, sprite, cat.x - 0.5, cat.y - 0.5, origin);
}

export function drawBoxCount(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  count: number,
  origin: IsoOrigin,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = Math.max(10, 14);

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  const text = `${count}/${PACKING_BOX_CAPACITY}`;
  ctx.strokeText(text, cx, cy);
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

export function getCatSortY(cat: Cat, origin: IsoOrigin): number {
  const { cy } = getGridCellAnchor(cat.x - 0.5, cat.y - 0.5, origin);
  return cy;
}
