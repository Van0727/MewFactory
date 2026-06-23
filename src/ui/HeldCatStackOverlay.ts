import type { Player } from '../game/Player';
import { getPlayerFeetGridPos } from '../game/gridUtils';
import { GRID_SIZE } from '../config';
import { getCatSpriteUrl } from '../render/assets';
import { computeOrigin } from '../render/isometric';
import { gridCellToOverlayPoint } from '../render/overlayCoords';
import { getFlatSpriteSize } from '../render/spriteDraw';

/** 每只猫向上偏移（相对猫身高） */
const STACK_STEP_RATIO = 0.32;
const CAT_DRAW_SCALE = 0.38;
/** overlay 向上延伸，让猫堆可戳出游戏区顶部 */
const TOP_OVERFLOW_PX = 2400;

export class HeldCatStackOverlay {
  private gameCanvas: HTMLCanvasElement;
  private overlay: HTMLElement;
  private layer: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private catImg: HTMLImageElement;

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

    this.catImg = new Image();
    this.catImg.src = getCatSpriteUrl();
  }

  resize(): void {
    const rect = this.gameCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor((rect.height + TOP_OVERFLOW_PX) * dpr);

    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height + TOP_OVERFLOW_PX}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  update(player: Player, count: number): void {
    this.resize();

    const cssWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (count <= 0 || !this.catImg.complete) {
      return;
    }

    const { gx, gy } = getPlayerFeetGridPos(player);
    const gameRect = this.gameCanvas.getBoundingClientRect();
    const origin = computeOrigin(gameRect.width, gameRect.height, GRID_SIZE);
    const feet = gridCellToOverlayPoint(this.gameCanvas, this.overlay, gx, gy);

    // layer 向上延伸 TOP_OVERFLOW_PX，锚点需加上该偏移
    const anchorX = feet.x;
    const anchorY = feet.y + TOP_OVERFLOW_PX;

    const size = getFlatSpriteSize(gx, gy, origin) * CAT_DRAW_SCALE;
    const stepPx = size * STACK_STEP_RATIO;
    const anchorOffsetY = size * 0.85;

    for (let i = 0; i < count; i++) {
      const y = anchorY - anchorOffsetY - stepPx * (i + 1);
      this.ctx.drawImage(this.catImg, anchorX - size / 2, y, size, size);
    }
  }

  destroy(): void {
    this.layer.remove();
  }
}
