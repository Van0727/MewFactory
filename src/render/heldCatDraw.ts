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
import { drawRoleFlatAtPoint } from './spriteDraw';

function displayToMutations(
  display: ReturnType<typeof getHeldCatDisplayState>,
): CatMutationState {
  return {
    barbecueStacks: display.barbecueStacks,
    inflateStacks: display.inflateStacks,
    danceStacks: 0,
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
