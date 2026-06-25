import {
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
  SPRITE_SOURCE_SCALE,
} from '../config';
import type { Player } from '../game/Player';
import { getPlayerFeetGridPos } from '../game/gridUtils';
import type { IsoOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';
import { configureSpriteSmoothing } from './spriteDraw';

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  player: Player,
  origin: IsoOrigin,
): void {
  const { gx, gy } = getPlayerFeetGridPos(player);
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const worldScale = origin.viewScale / SPRITE_SOURCE_SCALE;
  const drawWidth = img.naturalWidth * worldScale;
  const drawHeight = img.naturalHeight * worldScale;
  const anchorPxX = drawWidth * PLAYER_SPRITE_ANCHOR_X;
  const anchorPxY = drawHeight * PLAYER_SPRITE_ANCHOR_Y;

  ctx.save();
  configureSpriteSmoothing(ctx);
  ctx.drawImage(img, cx - anchorPxX, cy - anchorPxY, drawWidth, drawHeight);
  ctx.restore();
}
