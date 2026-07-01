import {
  COLOR_BACKGROUND,
  COLOR_DARK_FRONT,
  COLOR_GROUND_BASE,
  COLOR_LIGHT_FRONT,
  COLOR_TILE_PLACE_INVALID,
  COLOR_TILE_PLACE_VALID,
  COLOR_TILE_TUTORIAL_RGB,
  GRID_SIZE,
  TILE_GROUND_BLEED_PX,
} from '../config';
import { scaleCanvasUi } from '../ui/uiScale';
import { BuildingType, type Building } from '../game/Building';
import type { Cat } from '../game/Cat';
import type { Grid } from '../game/Grid';
import type { Player } from '../game/Player';
import { RECYCLE_DEPOT_GRID_CELL, SELL_SHOP_GRID_CELL, ATTRIBUTE_SHOP_GRID_CELL } from '../game/gridCoords';
import { drawAttributeShop } from './attributeShopDraw';
import { getPlayerFeetGridPos } from '../game/gridUtils';
import { getSprite } from './assets';
import { drawBuilding, drawHeldBuildingInCell } from './buildingDraw';
import { drawPlayerSprite } from './playerDraw';
import { drawBoxCount, drawCat, drawNestSpawnCountdown, getCatSortY } from './catDraw';
import { drawSellShop } from './shopDraw';
import { drawRecycleDepot } from './recycleDepotDraw';
import { drawBuildingShop } from './buildingShopDraw';
import { getCatBoxCapacity } from '../data/buildings';
import {
  computeOrigin,
  getTileFrontCorners,
  getTileSortY,
  getTileTopCorners,
  type IsoOrigin,
} from './isometric';
import { getGridCellAnchor } from './tileBounds';
import {
  configureSpriteSmoothing,
  drawSpriteInIsoTile,
  expandCorners,
} from './spriteDraw';

export interface DrawState {
  player: Player;
  grid: Grid;
  heldBuilding: Building | null;
  heldCatCount: number;
  previewCell: { gx: number; gy: number } | null;
  canPlaceAtPreview: boolean | null;
  cats: readonly Cat[];
  getBoxCount: (gx: number, gy: number) => number;
  getBoxDrawScale: (gx: number, gy: number) => number;
  getNestSpawnCountdown: (gx: number, gy: number) => number | null;
  /** 到店出售金币倍率（转生），用于小猫头顶标价 */
  catGoldMultiplier?: number;
  tutorialHighlightCell?: { gx: number; gy: number } | null;
}

type TileHighlight = 'valid' | 'invalid' | 'tutorial' | null;

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
    configureSpriteSmoothing(this.ctx);
  }

  showLoading(message = 'Loading...'): void {
    const rect = this.canvas.getBoundingClientRect();
    const origin = computeOrigin(rect.width, rect.height, GRID_SIZE);
    const fontSize = scaleCanvasUi(18, origin.viewScale);
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = COLOR_BACKGROUND;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = '#ccc';
    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(message, rect.width / 2, rect.height / 2);
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

  getPlayerClientPosition(player: Player): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const { gx, gy } = getPlayerFeetGridPos(player);
    const { cx, cy } = getGridCellAnchor(gx, gy, this.origin);
    return {
      x: rect.left + cx,
      y: rect.top + cy,
    };
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
      this.drawTile(tile.gx, tile.gy);

      const building = state.grid.get(tile.gx, tile.gy);
      if (building) {
        const boxScale =
          building.type === BuildingType.PackingBox
            ? state.getBoxDrawScale(tile.gx, tile.gy)
            : 1;
        drawBuilding(this.ctx, tile.gx, tile.gy, building, this.origin, boxScale);
      }
      const gate = state.grid.getMutationGate(tile.gx, tile.gy);
      if (gate) {
        drawBuilding(this.ctx, tile.gx, tile.gy, gate, this.origin);
      }

      if (highlight) {
        this.drawTileHighlight(tile.gx, tile.gy, highlight);
      } else if (this.isTutorialHighlightCell(tile.gx, tile.gy, state)) {
        this.drawTileHighlight(tile.gx, tile.gy, 'tutorial');
      }

      if (building?.type === BuildingType.PackingBox) {
        drawBoxCount(
          this.ctx,
          tile.gx,
          tile.gy,
          state.getBoxCount(tile.gx, tile.gy),
          getCatBoxCapacity(building.level),
          this.origin,
        );
      }

      if (building?.type === BuildingType.CatNest) {
        const countdown = state.getNestSpawnCountdown(tile.gx, tile.gy);
        if (countdown !== null) {
          drawNestSpawnCountdown(
            this.ctx,
            tile.gx,
            tile.gy,
            countdown,
            this.origin,
          );
        }
      }

    }

    state.grid.forEachBuildingShop((gx, gy, kind) => {
      drawBuildingShop(this.ctx, gx, gy, kind, this.origin);
    });

    if (state.grid.isShop(SELL_SHOP_GRID_CELL.gx, SELL_SHOP_GRID_CELL.gy)) {
      drawSellShop(
        this.ctx,
        SELL_SHOP_GRID_CELL.gx,
        SELL_SHOP_GRID_CELL.gy,
        this.origin,
      );
    }

    if (state.grid.isRecycleDepot(RECYCLE_DEPOT_GRID_CELL.gx, RECYCLE_DEPOT_GRID_CELL.gy)) {
      drawRecycleDepot(
        this.ctx,
        RECYCLE_DEPOT_GRID_CELL.gx,
        RECYCLE_DEPOT_GRID_CELL.gy,
        this.origin,
      );
    }

    if (state.grid.isAttributeShop(ATTRIBUTE_SHOP_GRID_CELL.gx, ATTRIBUTE_SHOP_GRID_CELL.gy)) {
      drawAttributeShop(
        this.ctx,
        ATTRIBUTE_SHOP_GRID_CELL.gx,
        ATTRIBUTE_SHOP_GRID_CELL.gy,
        this.origin,
      );
    }

    const sortedCats = [...state.cats].sort(
      (a, b) => getCatSortY(a, this.origin) - getCatSortY(b, this.origin),
    );
    for (const cat of sortedCats) {
      drawCat(this.ctx, cat, this.origin, state.catGoldMultiplier ?? 1);
    }

    this.drawPlayer(state.player, state.heldBuilding, state.heldCatCount);
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

  private isTutorialHighlightCell(
    gx: number,
    gy: number,
    state: DrawState,
  ): boolean {
    const cell = state.tutorialHighlightCell;
    return cell !== null && cell !== undefined && cell.gx === gx && cell.gy === gy;
  }

  private drawTile(gx: number, gy: number): void {
    const isLight = (gx + gy) % 2 === 0;
    const frontColor = isLight ? COLOR_DARK_FRONT : COLOR_LIGHT_FRONT;
    const topCorners = getTileTopCorners(gx, gy, this.origin);
    const tileSprite = isLight ? getSprite('tileLight') : getSprite('tileDark');

    this.fillPolygon(getTileFrontCorners(gx, gy, this.origin), frontColor);
    // Neutral under-fill: any sub-pixel gap between tiles shows this, not the dark background.
    this.fillPolygon(expandCorners(topCorners, TILE_GROUND_BLEED_PX), COLOR_GROUND_BASE);
    drawSpriteInIsoTile(this.ctx, tileSprite, topCorners);
  }

  private drawTileHighlight(gx: number, gy: number, highlight: Exclude<TileHighlight, null>): void {
    const topCorners = getTileTopCorners(gx, gy, this.origin);
    let overlay: string;
    if (highlight === 'valid') {
      overlay = COLOR_TILE_PLACE_VALID;
    } else if (highlight === 'invalid') {
      overlay = COLOR_TILE_PLACE_INVALID;
    } else {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);
      const alpha = 0.22 + pulse * 0.38;
      overlay = `rgba(${COLOR_TILE_TUTORIAL_RGB}, ${alpha})`;
    }
    this.fillPolygon(topCorners, overlay);
  }

  private drawPlayer(player: Player, heldBuilding: Building | null, _heldCatCount: number): void {
    const { gx, gy } = getPlayerFeetGridPos(player);
    drawPlayerSprite(this.ctx, getSprite('player'), player, this.origin);

    if (heldBuilding) {
      drawHeldBuildingInCell(this.ctx, gx, gy, this.origin, heldBuilding);
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
