import type { Cat } from '../game/Cat';
import {
  getCatDanceScaleX,
  getCatGoldSellPrice,
  getCatInflateScale,
  getCatPulseScale,
} from '../game/Cat';
import {
  formatCompactNumber,
  PACKING_BOX_GROUND_LIFT_PX,
  CAT_ROLE_SPRITE_TILE_SCALE,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { scaleCanvasUi } from '../ui/uiScale';
import { getRoleSprite } from './assets';
import { prepareCatRoleSource, getCatRoleSourceDrawScaleMultiplier } from './catSprite';
import type { IsoOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';
import { drawRoleFlatInCell } from './spriteDraw';

export function drawCat(
  ctx: CanvasRenderingContext2D,
  cat: Cat,
  origin: IsoOrigin,
  goldMultiplier = 1,
): void {
  const gx = cat.x - 0.5;
  const gy = cat.y - 0.5;
  const pulseScale = cat.pulseAnim
    ? getCatPulseScale(cat.pulseAnim.elapsed)
    : 1;
  const inflateScale = getCatInflateScale(cat.mutations);
  const roleImg = getRoleSprite(cat.nestLevel);
  const source = prepareCatRoleSource(roleImg, cat.mutations);
  const sourceScale = getCatRoleSourceDrawScaleMultiplier(source, roleImg);
  const drawScale =
    CAT_ROLE_SPRITE_TILE_SCALE * inflateScale * pulseScale * sourceScale;
  drawRoleFlatInCell(ctx, source, gx, gy, origin, {
    drawScale,
    anchorX: PLAYER_SPRITE_ANCHOR_X,
    anchorY: PLAYER_SPRITE_ANCHOR_Y,
    scaleX: getCatDanceScaleX(cat.mutations),
    flipVertical: cat.mutations.flipCount % 2 === 1,
  });
  drawCatPriceLabel(ctx, gx, gy, cat, pulseScale, origin, goldMultiplier);
}

function drawCatPriceLabel(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  cat: Cat,
  pulseScale: number,
  origin: IsoOrigin,
  goldMultiplier: number,
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = scaleCanvasUi(13, origin.viewScale);
  const labelY = cy - fontSize * 1.5;
  const text = formatCompactNumber(getCatGoldSellPrice(cat, goldMultiplier));
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
  const liftPx = scaleCanvasUi(PACKING_BOX_GROUND_LIFT_PX, origin.viewScale);
  const fontSize = scaleCanvasUi(11, origin.viewScale);
  const labelY = cy - liftPx - fontSize * 0.85;
  const atCapacity = capacity > 0 && count >= capacity;
  const text = atCapacity ? 'MAX' : `${count}/${capacity}`;

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = atCapacity ? '#ff4444' : '#fff';
  ctx.strokeStyle = atCapacity ? 'rgba(80, 0, 0, 0.75)' : 'rgba(0,0,0,0.55)';
  ctx.lineWidth = scaleCanvasUi(2, origin.viewScale);
  ctx.strokeText(text, cx, labelY);
  ctx.fillText(text, cx, labelY);
  ctx.restore();
}

export function getCatSortY(cat: Cat, origin: IsoOrigin): number {
  const { cy } = getGridCellAnchor(cat.x - 0.5, cat.y - 0.5, origin);
  return cy;
}
