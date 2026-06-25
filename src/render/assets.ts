import type { Building } from '../game/Building';
import { BUILDING_CONFIGS } from '../data/buildings';
import {
  SPRITE_SOURCE_SIZE,
  UI_ICON_SOURCE_SIZE,
} from '../config';

/** Board sprites: square PNG (SPRITE_SOURCE_SIZE²); mapped to iso cells when drawn. */
export const BOARD_SPRITE_SIZE = SPRITE_SOURCE_SIZE;
export const BOARD_SPRITE_WIDTH = SPRITE_SOURCE_SIZE;
export const BOARD_SPRITE_HEIGHT = SPRITE_SOURCE_SIZE;
export const UI_ICON_SIZE = UI_ICON_SOURCE_SIZE;

export type BaseAssetKey =
  | 'tileLight'
  | 'tileDark'
  | 'catNormal'
  | 'catMutated'
  | 'player'
  | 'uiPickup'
  | 'goldChick';

const BASE_ASSET_PATHS: Record<BaseAssetKey, string> = {
  tileLight: 'assets/tiles/tile_light.png',
  tileDark: 'assets/tiles/tile_dark.png',
  catNormal: 'assets/cats/cat_normal.png',
  catMutated: 'assets/cats/cat_mutated.png',
  player: 'assets/buildings/player.png',
  uiPickup: 'assets/ui/pickup.png',
  goldChick: 'assets/ui/gold_chick.png',
};

export const ROLE_SPRITE_IDS = ['role_1', 'role_2', 'role_3', 'role_4', 'role_5'] as const;
/** 出售区域贴图（512×256，占 2 格宽） */
export const SELL_SHOP_SPRITE_ID = 'sell_shop';
/** 开始游戏按钮 */
export const START_BUTTON_SPRITE_ID = 'start';

const BOARD_EXTRA_SPRITE_IDS = [SELL_SHOP_SPRITE_ID, START_BUTTON_SPRITE_ID] as const;

function collectBuildingSpriteIds(): string[] {
  const ids = new Set<string>();
  for (const configs of Object.values(BUILDING_CONFIGS)) {
    for (const cfg of configs) {
      ids.add(cfg.spriteId);
    }
  }
  for (const roleId of ROLE_SPRITE_IDS) {
    ids.add(roleId);
  }
  for (const spriteId of BOARD_EXTRA_SPRITE_IDS) {
    ids.add(spriteId);
  }
  return [...ids];
}

let baseSprites: Record<BaseAssetKey, HTMLImageElement> | null = null;
let buildingSprites: Map<string, HTMLImageElement> | null = null;

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${relativePath}`;
}

async function loadImageFromPath(path: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = assetUrl(path);
  await img.decode();
  return img;
}

async function loadBaseImage(key: BaseAssetKey): Promise<[BaseAssetKey, HTMLImageElement]> {
  const img = await loadImageFromPath(BASE_ASSET_PATHS[key]);
  return [key, img];
}

export async function loadAssets(): Promise<void> {
  const baseKeys = Object.keys(BASE_ASSET_PATHS) as BaseAssetKey[];
  const baseEntries = await Promise.all(baseKeys.map(loadBaseImage));
  baseSprites = Object.fromEntries(baseEntries) as Record<BaseAssetKey, HTMLImageElement>;

  const spriteIds = collectBuildingSpriteIds();
  const buildingEntries = await Promise.all(
    spriteIds.map(async (spriteId) => {
      const img = await loadImageFromPath(`assets/buildings/${spriteId}.png`);
      return [spriteId, img] as const;
    }),
  );
  buildingSprites = new Map(buildingEntries);
}

export function getSprite(key: BaseAssetKey): HTMLImageElement {
  if (!baseSprites) {
    throw new Error('Assets not loaded — call loadAssets() first');
  }
  return baseSprites[key];
}

export function getSpriteById(spriteId: string): HTMLImageElement {
  if (!buildingSprites) {
    throw new Error('Assets not loaded — call loadAssets() first');
  }
  const img = buildingSprites.get(spriteId);
  if (!img) {
    throw new Error(`Missing building sprite: ${spriteId}`);
  }
  return img;
}

export function getSpriteUrl(spriteId: string): string {
  return assetUrl(`assets/buildings/${spriteId}.png`);
}

export function getBuildingSprite(building: Building): HTMLImageElement {
  return getSpriteById(building.spriteId);
}

export function getUiIconUrl(spriteId: string): string {
  return getSpriteUrl(spriteId);
}

export function getBuildingSpriteUrl(spriteId: string): string {
  return getSpriteUrl(spriteId);
}

export function getRoleSpriteId(nestLevel: number): string {
  const level = Math.max(1, Math.min(5, nestLevel));
  return `role_${level}`;
}

export function getRoleSprite(nestLevel: number): HTMLImageElement {
  return getSpriteById(getRoleSpriteId(nestLevel));
}

export function getRoleSpriteUrl(nestLevel: number): string {
  return getSpriteUrl(getRoleSpriteId(nestLevel));
}

export function getSellShopSprite(): HTMLImageElement {
  return getSpriteById(SELL_SHOP_SPRITE_ID);
}

export function getSellShopSpriteUrl(): string {
  return getSpriteUrl(SELL_SHOP_SPRITE_ID);
}

export function getStartButtonUrl(): string {
  return getSpriteUrl(START_BUTTON_SPRITE_ID);
}

export function getUiPickupUrl(): string {
  return assetUrl(BASE_ASSET_PATHS.uiPickup);
}

export function getGoldChickUrl(): string {
  return assetUrl(BASE_ASSET_PATHS.goldChick);
}

export function getCatSpriteUrl(): string {
  return assetUrl(BASE_ASSET_PATHS.catNormal);
}
