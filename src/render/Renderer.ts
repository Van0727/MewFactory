import {
  COLOR_BACKGROUND,
  COLOR_DARK,
  COLOR_DARK_FRONT,
  COLOR_LIGHT,
  COLOR_LIGHT_FRONT,
  COLOR_PLAYER,
  COLOR_TILE_PLACE_INVALID,
  COLOR_TILE_PLACE_VALID,
  GRID_SIZE,
  TILE_HEIGHT,
} from '../config';
import type { Building } from '../game/Building';
import type { Grid } from '../game/Grid';
import type { Player } from '../game/Player';
import { drawBuilding, drawBuildingAtPoint } from './buildingDraw';
import {
  computeOrigin,
  getPlayerAnchor,
  getTileFrontCorners,
  getTileSortY,
  getTileTopCorners,
  type IsoOrigin,
} from './isometric';

export interface DrawState {
  player: Player;
  grid: Grid;
  heldBuilding: Building | null;
  previewCell: { gx: number; gy: number } | null;
  canPlaceAtPreview: boolean | null;
}

type TileHighlight = 'valid' | 'invalid' | null;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private origin: IsoOrigin = { originX: 0, originY: 0, viewScale: 1 };
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

  draw(state: DrawState): void {
    const rect = this.canvas.getBoundingClientRect();
    this.origin = computeOrigin(rect.width, rect.height, GRID_SIZE);

    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = COLOR_BACKGROUND;
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.drawBoard(state);
  }

  private drawBoard(state: DrawState): void {
    const tiles: { gx: number; gy: number; sortY: number }[] = [];

    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        tiles.push({
          gx,
          gy,
          sortY: getTileSortY(gx, gy, this.origin),
        });
      }
    }

    tiles.sort((a, b) => a.sortY - b.sortY);

    for (const tile of tiles) {
      const highlight = this.getTileHighlight(tile.gx, tile.gy, state);
      this.drawTile(tile.gx, tile.gy, highlight);

      const building = state.grid.get(tile.gx, tile.gy);
      if (building) {
        drawBuilding(this.ctx, tile.gx, tile.gy, building, this.origin);
      }
      const gate = state.grid.getMutationGate(tile.gx, tile.gy);
      if (gate) {
        drawBuilding(this.ctx, tile.gx, tile.gy, gate, this.origin);
      }
    }

    this.drawPlayer(state.player, state.heldBuilding);
  }

  private getTileHighlight(gx: number, gy: number, state: DrawState): TileHighlight {
    if (!state.previewCell || state.canPlaceAtPreview === null) {
      return null;
    }
    if (gx !== state.previewCell.gx || gy !== state.previewCell.gy) {
      return null;
    }
    return state.canPlaceAtPreview ? 'valid' : 'invalid';
  }

  private drawTile(gx: number, gy: number, highlight: TileHighlight): void {
    const isLight = (gx + gy) % 2 === 0;
    const topColor = isLight ? COLOR_LIGHT : COLOR_DARK;
    const frontColor = isLight ? COLOR_LIGHT_FRONT : COLOR_DARK_FRONT;

    this.fillPolygon(getTileFrontCorners(gx, gy, this.origin), frontColor);
    this.fillPolygon(getTileTopCorners(gx, gy, this.origin), topColor);

    if (highlight) {
      const overlay =
        highlight === 'valid' ? COLOR_TILE_PLACE_VALID : COLOR_TILE_PLACE_INVALID;
      this.fillPolygon(getTileTopCorners(gx, gy, this.origin), overlay);
    }

    const top = getTileTopCorners(gx, gy, this.origin);
    this.ctx.beginPath();
    this.ctx.moveTo(top[0][0], top[0][1]);
    for (let i = 1; i < top.length; i++) {
      this.ctx.lineTo(top[i][0], top[i][1]);
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.lineWidth = Math.max(1, this.origin.viewScale);
    this.ctx.stroke();
  }

  private drawPlayer(player: Player, heldBuilding: Building | null): void {
    const { cx, cy, scale } = getPlayerAnchor(player.x, player.y, this.origin);
    const radius = TILE_HEIGHT * 0.42 * scale;

    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + radius * 0.15, radius * 0.75, radius * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy - radius * 0.35, radius * 0.55, radius * 0.7, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = COLOR_PLAYER;
    this.ctx.fill();
    this.ctx.strokeStyle = '#2a5a8a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    if (heldBuilding) {
      const holdY = cy - radius * 2.1;
      const holdScale = scale * 0.85;
      drawBuildingAtPoint(this.ctx, cx, holdY, holdScale, heldBuilding);
    }
  }

  private fillPolygon(corners: [number, number][], color: string): void {
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < corners.length; i++) {
      this.ctx.lineTo(corners[i][0], corners[i][1]);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
}
