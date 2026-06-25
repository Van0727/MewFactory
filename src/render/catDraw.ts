import type { Cat } from '../game/Cat';
import { getCatPrice, getCatPulseScale } from '../game/Cat';
import {
  CAT_ROLE_SPRITE_TILE_SCALE,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { scaleCanvasUi } from '../ui/uiScale';
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
  const fontSize = scaleCanvasUi(13, origin.viewScale);
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
  ctx.lineWidth = scaleCanvasUi(3, origin.viewScale);
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
  const fontSize = scaleCanvasUi(14, origin.viewScale);
  const labelY = cy - fontSize * 1.4;

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = scaleCanvasUi(3, origin.viewScale);
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
  const barW = scaleCanvasUi(56, origin.viewScale);
  const barH = scaleCanvasUi(10, origin.viewScale);
  const barInset = scaleCanvasUi(1, origin.viewScale);
  const barX = cx - barW / 2;
  const barY = cy - barH * 2.2;
  const fillRatio = capacity > 0 ? Math.min(1, count / capacity) : 0;

  ctx.save();
  ctx.fillStyle = 'rgba(60, 40, 25, 0.88)';
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fill();

  if (fillRatio > 0) {
    ctx.fillStyle = '#ffd54f';
    roundRect(
      ctx,
      barX + barInset,
      barY + barInset,
      (barW - barInset * 2) * fillRatio,
      barH - barInset * 2,
      (barH - barInset * 2) / 2,
    );
    ctx.fill();
  }

  const fontSize = scaleCanvasUi(11, origin.viewScale);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = scaleCanvasUi(2, origin.viewScale);
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
