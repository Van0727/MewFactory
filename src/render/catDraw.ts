import { PACKING_BOX_CAPACITY } from '../config';
import type { Cat } from '../game/Cat';
import { getCatPrice, getCatPulseScale } from '../game/Cat';
import { getSprite } from './assets';
import type { IsoOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';
import { drawSpriteInCell } from './spriteDraw';

export function drawCat(
  ctx: CanvasRenderingContext2D,
  cat: Cat,
  origin: IsoOrigin,
): void {
  const gx = cat.x - 0.5;
  const gy = cat.y - 0.5;
  const pulseScale = cat.pulseAnim
    ? getCatPulseScale(cat.pulseAnim.elapsed)
    : 1;
  const sprite = cat.mutated ? getSprite('catMutated') : getSprite('catNormal');
  drawSpriteInCell(ctx, sprite, gx, gy, origin, { drawScale: pulseScale });
  drawCatPriceLabel(ctx, gx, gy, cat, pulseScale, origin);
}

function drawCatPriceLabel(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  cat: Cat,
  pulseScale: number,
  origin: IsoOrigin,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = Math.max(10, 13);
  const labelY = cy - fontSize * 1.5;
  const text = `${getCatPrice(cat)}`;
  const fillStyle = cat.mutated ? '#ffb4b4' : '#fff';

  ctx.save();
  ctx.translate(cx, labelY);
  ctx.scale(pulseScale, pulseScale);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function drawNestSpawnCountdown(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  secondsRemaining: number,
  origin: IsoOrigin,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = Math.max(10, 14);
  const labelY = cy - fontSize * 1.4;

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  const text = `${Math.ceil(secondsRemaining)}s`;
  ctx.strokeText(text, cx, labelY);
  ctx.fillText(text, cx, labelY);
  ctx.restore();
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
