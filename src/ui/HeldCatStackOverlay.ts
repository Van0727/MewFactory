import type { Player } from '../game/Player';
import type { HeldCatEntry } from '../game/HeldCats';
import { getPlayerFeetGridPos } from '../game/gridUtils';
import {
  CAT_ROLE_SPRITE_TILE_SCALE,
  GRID_SIZE,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { getRoleSprite } from '../render/assets';
import { computeOrigin } from '../render/isometric';
import { gridCellToOverlayPoint } from '../render/overlayCoords';
import { getFlatSpriteSize } from '../render/spriteDraw';

/** 每只猫向上偏移（相对猫身高） */
const STACK_STEP_RATIO = 0.32;/** overlay 向上延伸倍数，让猫堆可戳出游戏区顶部 */
const TOP_OVERFLOW_RATIO = 5;

export class HeldCatStackOverlay {
  private gameCanvas: HTMLCanvasElement;
  private overlay: HTMLElement;
  private layer: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private topOverflowPx = 0;

  constructor(gameCanvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.gameCanvas = gameCanvas;
    this.overlay = overlay;

    this.layer = document.createElement('div');
    this.layer.className = 'held-cats-layer';
    this.overlay.appendChild(this.layer);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'held-cats-canvas';
    this.layer.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get held-cats 2D context');
    }
    this.ctx = ctx;
  }

  resize(): void {
    const rect = this.gameCanvas.getBoundingClientRect();
    const topOverflow = rect.height * TOP_OVERFLOW_RATIO;
    this.topOverflowPx = topOverflow;
    this.layer.style.top = `${-topOverflow}px`;
    this.layer.style.height = `${rect.height + topOverflow}px`;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor((rect.height + topOverflow) * dpr);

    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height + topOverflow}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  update(player: Player, stack: readonly HeldCatEntry[]): void {
    this.resize();

    const cssWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (stack.length <= 0) {
      return;
    }

    const { gx, gy } = getPlayerFeetGridPos(player);
    const gameRect = this.gameCanvas.getBoundingClientRect();
    const origin = computeOrigin(gameRect.width, gameRect.height, GRID_SIZE);
    const feet = gridCellToOverlayPoint(this.gameCanvas, this.overlay, gx, gy);

    // layer 向上延伸 TOP_OVERFLOW_PX，锚点需加上该偏移
    const anchorX = feet.x;
    const anchorY = feet.y + this.topOverflowPx;

    const flatSize = getFlatSpriteSize(gx, gy, origin);
    const drawSize = flatSize * CAT_ROLE_SPRITE_TILE_SCALE;
    const stepPx = drawSize * STACK_STEP_RATIO;
    const anchorOffsetX = drawSize * PLAYER_SPRITE_ANCHOR_X;
    const anchorOffsetY = drawSize * PLAYER_SPRITE_ANCHOR_Y;

    for (let i = 0; i < stack.length; i++) {
      const entry = stack[i];
      const img = getRoleSprite(entry.nestLevel);
      if (!img.complete) {
        continue;
      }
      const y = anchorY - anchorOffsetY - stepPx * (i + 1);
      this.ctx.drawImage(img, anchorX - anchorOffsetX, y, drawSize, drawSize);
    }  }

  destroy(): void {
    this.layer.remove();
  }
}
