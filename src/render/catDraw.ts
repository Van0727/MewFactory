import type { Cat } from '../game/Cat';
import { getCatPrice, getCatPulseScale } from '../game/Cat';
import {
  CAT_ROLE_SPRITE_TILE_SCALE,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { getRoleSprite } from './assets';
import { prepareCatRoleSource } from './catSprite';
import type { IsoOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';
import { drawRoleFlatInCell } from './spriteDraw';

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
  const inflateScale = 1 + 0.1 * cat.mutations.inflateStacks;
  const drawScale = CAT_ROLE_SPRITE_TILE_SCALE * inflateScale * pulseScale;
  const roleImg = getRoleSprite(cat.nestLevel);
  const source = prepareCatRoleSource(roleImg, cat.mutations);
  drawRoleFlatInCell(ctx, source, gx, gy, origin, {
    drawScale,
    anchorX: PLAYER_SPRITE_ANCHOR_X,
    anchorY: PLAYER_SPRITE_ANCHOR_Y,
  });
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
  const fillStyle =
    cat.mutations.barbecueStacks > 0 ? '#ffb4b4' : '#fff';

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
  capacity: number,
  origin: IsoOrigin,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const barW = Math.max(48, 56);
  const barH = Math.max(8, 10);
  const barX = cx - barW / 2;
  const barY = cy - barH * 2.2;
  const fillRatio = capacity > 0 ? Math.min(1, count / capacity) : 0;

  ctx.save();
  ctx.fillStyle = 'rgba(60, 40, 25, 0.88)';
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fill();

  if (fillRatio > 0) {
    ctx.fillStyle = '#ffd54f';
    roundRect(ctx, barX + 1, barY + 1, (barW - 2) * fillRatio, barH - 2, (barH - 2) / 2);
    ctx.fill();
  }

  const fontSize = Math.max(9, 11);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  const text = `${count}/${capacity}`;
  ctx.strokeText(text, cx, barY + barH / 2);
  ctx.fillText(text, cx, barY + barH / 2);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function getCatSortY(cat: Cat, origin: IsoOrigin): number {
  const { cy } = getGridCellAnchor(cat.x - 0.5, cat.y - 0.5, origin);
  return cy;
}
