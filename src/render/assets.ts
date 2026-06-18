import { BuildingType } from '../game/Building';
import type { Building } from '../game/Building';
import {
  SPRITE_SOURCE_SIZE,
  UI_ICON_SOURCE_SIZE,
} from '../config';

/** Board sprites: square PNG (SPRITE_SOURCE_SIZE²); mapped to iso cells when drawn. */
export const BOARD_SPRITE_SIZE = SPRITE_SOURCE_SIZE;
export const BOARD_SPRITE_WIDTH = SPRITE_SOURCE_SIZE;
export const BOARD_SPRITE_HEIGHT = SPRITE_SOURCE_SIZE;
export const UI_ICON_SIZE = UI_ICON_SOURCE_SIZE;

export type AssetKey =
  | 'tileLight'
  | 'tileDark'
  | 'catNest'
  | 'conveyor'
  | 'packingBox'
  | 'mutationGate'
  | 'catNormal'
  | 'catMutated'
  | 'player'
  | 'sellShop'
  | 'uiPickup'
  | 'uiCatNest'
  | 'uiConveyor'
  | 'uiPackingBox'
  | 'uiMutationGate';

const ASSET_PATHS: Record<AssetKey, string> = {
  tileLight: 'assets/tiles/tile_light.png',
  tileDark: 'assets/tiles/tile_dark.png',
  catNest: 'assets/buildings/cat_nest.png',
  conveyor: 'assets/buildings/conveyor.png',
  packingBox: 'assets/buildings/packing_box.png',
  mutationGate: 'assets/buildings/mutation_gate.png',
  catNormal: 'assets/cats/cat_normal.png',
  catMutated: 'assets/cats/cat_mutated.png',
  player: 'assets/player/player.png',
  sellShop: 'assets/buildings/sell_shop.png',
  uiPickup: 'assets/ui/pickup.png',
  uiCatNest: 'assets/ui/cat_nest.png',
  uiConveyor: 'assets/ui/conveyor.png',
  uiPackingBox: 'assets/ui/packing_box.png',
  uiMutationGate: 'assets/ui/mutation_gate.png',
};

/** Map spriteId → AssetKey. When real per-level art is ready, this maps e.g. "box_1" → its own key. */
const SPRITE_ID_MAP: Record<BuildingType, AssetKey> = {
  CatNest: 'catNest',
  Conveyor: 'conveyor',
  PackingBox: 'packingBox',
  MutationGate: 'mutationGate',
};

let sprites: Record<AssetKey, HTMLImageElement> | null = null;

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${relativePath}`;
}

async function loadImage(key: AssetKey): Promise<[AssetKey, HTMLImageElement]> {
  const src = assetUrl(ASSET_PATHS[key]);
  const img = new Image();
  img.src = src;
  await img.decode();
  return [key, img];
}

export async function loadAssets(): Promise<void> {
  const keys = Object.keys(ASSET_PATHS) as AssetKey[];
  const entries = await Promise.all(keys.map(loadImage));
  sprites = Object.fromEntries(entries) as Record<AssetKey, HTMLImageElement>;
}

export function getSprite(key: AssetKey): HTMLImageElement {
  if (!sprites) {
    throw new Error('Assets not loaded — call loadAssets() first');
  }
  return sprites[key];
}

/** 根据建筑获取对应的精灵图。后续可扩展为根据 spriteId 取不同图片。 */
export function getBuildingSprite(building: Building): HTMLImageElement {
  // 暂时所有等级共用同一张占位图，后续可映射 building.spriteId → 独立图片
  const key = SPRITE_ID_MAP[building.type];
  return getSprite(key);
}

export function getUiIconUrl(type: BuildingType): string {
  switch (type) {
    case BuildingType.CatNest:
      return assetUrl(ASSET_PATHS.uiCatNest);
    case BuildingType.Conveyor:
      return assetUrl(ASSET_PATHS.uiConveyor);
    case BuildingType.PackingBox:
      return assetUrl(ASSET_PATHS.uiPackingBox);
    case BuildingType.MutationGate:
      return assetUrl(ASSET_PATHS.uiMutationGate);
  }
}

export function getUiPickupUrl(): string {
  return assetUrl(ASSET_PATHS.uiPickup);
}

export function getCatSpriteUrl(): string {
  return assetUrl(ASSET_PATHS.catNormal);
}
