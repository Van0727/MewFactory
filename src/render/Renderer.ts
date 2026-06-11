import {
  COLOR_BACKGROUND,
  COLOR_DARK,
  COLOR_LIGHT,
  COLOR_PLAYER,
  GRID_SIZE,
  TILE_HEIGHT,
} from '../config';
import type { Player } from '../game/Player';
import {
  computeOrigin,
  getDepth,
  getTileCorners,
  gridToScreen,
  type IsoOrigin,
} from './isometric';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private origin: IsoOrigin = { originX: 0, originY: 0 };
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (width === this.lastWidth && height === this.lastHeight) {
      return;
    }

    this.lastWidth = width;
    this.lastHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.origin = computeOrigin(rect.width, rect.height, GRID_SIZE);
  }

  draw(player: Player): void {
    const rect = this.canvas.getBoundingClientRect();
    this.origin = computeOrigin(rect.width, rect.height, GRID_SIZE);

    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = COLOR_BACKGROUND;
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.drawBoard(player);
  }

  private drawBoard(player: Player): void {
    type DrawItem =
      | { kind: 'tile'; gx: number; gy: number; depth: number }
      | { kind: 'player'; depth: number };

    const items: DrawItem[] = [];

    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        items.push({ kind: 'tile', gx, gy, depth: getDepth(gx, gy) });
      }
    }

    items.push({ kind: 'player', depth: getDepth(player.x, player.y) + 0.5 });

    items.sort((a, b) => a.depth - b.depth);

    for (const item of items) {
      if (item.kind === 'tile') {
        this.drawTile(item.gx, item.gy);
      } else {
        this.drawPlayer(player);
      }
    }
  }

  private drawTile(gx: number, gy: number): void {
    const corners = getTileCorners(gx, gy, this.origin);
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < corners.length; i++) {
      this.ctx.lineTo(corners[i][0], corners[i][1]);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = (gx + gy) % 2 === 0 ? COLOR_LIGHT : COLOR_DARK;
    this.ctx.fill();
    this.ctx.strokeStyle = '#999';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawPlayer(player: Player): void {
    const { x, y } = gridToScreen(player.x, player.y, this.origin);
    const radius = TILE_HEIGHT * 0.45;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y - radius * 0.3, radius * 0.7, radius, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = COLOR_PLAYER;
    this.ctx.fill();
    this.ctx.strokeStyle = '#2a5a8a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}
