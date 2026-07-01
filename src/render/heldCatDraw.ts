import type { CatMutationState } from '../game/Cat';
import { getCatInflateScale } from '../game/Cat';
import type { HeldCatEntry } from '../game/HeldCats';
import { getHeldCatDisplayState } from '../game/HeldCats';
import {
  CAT_ROLE_SPRITE_TILE_SCALE,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { getRoleSprite } from './assets';
import { prepareCatRoleSource, getCatRoleSourceDrawScaleMultiplier } from './catSprite';
import { configureSpriteSmoothing, drawRoleFlatAtPoint } from './spriteDraw';

function displayToMutations(
  display: ReturnType<typeof getHeldCatDisplayState>,
): CatMutationState {
  return {
    barbecueStacks: display.barbecueStacks,
    inflateStacks: display.inflateStacks,
    danceStacks: display.danceStacks,
    flipCount: display.flipCount,
    danceAngle: 0,
  };
}

/**
 * 在脚下锚点绘制手持猫（与流水线 drawCat / drawRoleFlatInCell 一致）。
 * flatSize：格内基准边长（未乘 CAT_ROLE_SPRITE_TILE_SCALE）。
 */
export function drawHeldCatEntry(
  ctx: CanvasRenderingContext2D,
  entry: HeldCatEntry,
  feetX: number,
  feetY: number,
  flatSize: number,
): void {
  const display = getHeldCatDisplayState(entry);
  const mutations = displayToMutations(display);
  const roleImg = getRoleSprite(display.nestLevel);
  if (!roleImg.complete) {
    return;
  }

  const inflateScale = getCatInflateScale(mutations);
  const source = prepareCatRoleSource(roleImg, mutations);
  const sourceScale = getCatRoleSourceDrawScaleMultiplier(source, roleImg);

  drawRoleFlatAtPoint(ctx, source, feetX, feetY, flatSize, {
    drawScale: CAT_ROLE_SPRITE_TILE_SCALE * inflateScale * sourceScale,
    anchorX: PLAYER_SPRITE_ANCHOR_X,
    anchorY: PLAYER_SPRITE_ANCHOR_Y,
    flipVertical: mutations.flipCount % 2 === 1,
  });
}

/** 在固定方形区域内完整绘制小猫（contain，不裁切） */
export function drawHeldCatEntryFit(
  ctx: CanvasRenderingContext2D,
  entry: HeldCatEntry,
  width: number,
  height: number,
): void {
  const display = getHeldCatDisplayState(entry);
  const mutations = displayToMutations(display);
  const roleImg = getRoleSprite(display.nestLevel);
  if (!roleImg.complete) {
    return;
  }

  const inflateScale = getCatInflateScale(mutations);
  const source = prepareCatRoleSource(roleImg, mutations);
  const sourceScale = getCatRoleSourceDrawScaleMultiplier(source, roleImg);
  const sourceSize =
    source instanceof HTMLImageElement
      ? source.naturalWidth || source.width
      : (source as HTMLCanvasElement).width;

  const flipVertical = mutations.flipCount % 2 === 1;
  const scaleX = Math.abs(Math.cos(mutations.danceAngle)) || 1;
  const padding = Math.max(2, Math.min(width, height) * 0.06);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const contentScale =
    CAT_ROLE_SPRITE_TILE_SCALE * inflateScale * sourceScale;
  const drawW = sourceSize * contentScale * scaleX;
  const drawH = sourceSize * contentScale;
  const fitScale = Math.min(innerW / drawW, innerH / drawH);
  const finalW = drawW * fitScale;
  const finalH = drawH * fitScale;
  const centerX = width / 2;
  const centerY = height / 2 + innerH * 0.04;

  ctx.save();
  configureSpriteSmoothing(ctx);
  ctx.translate(centerX, centerY);
  if (flipVertical) {
    ctx.scale(1, -1);
  }
  ctx.scale(scaleX, 1);
  ctx.drawImage(
    source,
    (-finalW / scaleX) / 2,
    -finalH / 2,
    finalW / scaleX,
    finalH,
  );
  ctx.restore();
}

/** 在固定方形区域内居中绘制（快捷栏图标等） */
export function drawHeldCatEntryCentered(
  ctx: CanvasRenderingContext2D,
  entry: HeldCatEntry,
  size: number,
): void {
  const feetX = size / 2;
  const feetY = size * (0.5 + PLAYER_SPRITE_ANCHOR_Y * 0.35);
  const flatSize = size * 0.82 / CAT_ROLE_SPRITE_TILE_SCALE;
  drawHeldCatEntry(ctx, entry, feetX, feetY, flatSize);
}
