import {
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
  PLAYER_SPRITE_TILE_SCALE,
} from '../config';
import type { Player } from '../game/Player';
import { getPlayerFeetGridPos } from '../game/gridUtils';
import type { IsoOrigin } from './isometric';
import { drawSpriteFlatInCell } from './spriteDraw';

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  player: Player,
  origin: IsoOrigin,
): void {
  const { gx, gy } = getPlayerFeetGridPos(player);
  drawSpriteFlatInCell(ctx, img, gx, gy, origin, {
    drawScale: PLAYER_SPRITE_TILE_SCALE,
    anchorX: PLAYER_SPRITE_ANCHOR_X,
    anchorY: PLAYER_SPRITE_ANCHOR_Y,
  });
}
