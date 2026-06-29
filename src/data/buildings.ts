import {
  BUILDING_PRICE_BASE,
  BUILDING_PRICE_RATIO,
  CAT_SELL_PRICE_BASE,
  CAT_SELL_PRICE_RATIO,
  tierExponentialPrice,
} from '../config';
import type { BuildingType } from '../game/Building';

/** 稀有度枚举 */
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

/** 稀有度对应颜色 */
export const RARITY_COLORS: Record<Rarity, string> = {
  N: '#ffffff',
  R: '#4caf50',
  SR: '#2196f3',
  SSR: '#9c27b0',
  UR: '#ff9800',
};

/** 建筑商店名称填充色（高饱和度，配合深色描边） */
export const SHOP_LABEL_COLORS: Record<Rarity, string> = {
  N: '#ffffff',
  R: '#4de84d',
  SR: '#3db8ff',
  SSR: '#d060ff',
  UR: '#ffaa22',
};

export function getShopLabelColor(rarity: Rarity): string {
  return SHOP_LABEL_COLORS[rarity];
}

/** 每级建筑通用配置 */
export interface BuildingLevelConfig {
  level: number;
  name: string;
  rarity: Rarity;
  color: string;
  spriteId: string;
  price: number;
}

/** 猫窝额外配置 */
export interface CatHouseConfig extends BuildingLevelConfig {
  spawnInterval: number;
  catBasePrice: number;
}

/** 传送带额外配置 */
export interface ConveyorConfig extends BuildingLevelConfig {
  speed: number;
}

/** 包装箱额外配置 */
export interface CatBoxConfig extends BuildingLevelConfig {
  capacity: number;
}

/** 变异门额外配置 */
export interface DoorConfig extends BuildingLevelConfig {
  priceMultiplier: number;
  description: string;
  effect: string;
}

type BuildingConfigMap = {
  CatNest: CatHouseConfig[];
  Conveyor: ConveyorConfig[];
  PackingBox: CatBoxConfig[];
  MutationGate: DoorConfig[];
};

/** 所有建筑配置数据（从 CSV 解析） */
export const BUILDING_CONFIGS: BuildingConfigMap = {
  CatNest: [
    { level: 1, name: '喵喵窝', rarity: 'N', color: '#ffffff', spriteId: 'cat_1', price: 100, spawnInterval: 5, catBasePrice: 10 },
    { level: 2, name: '旺旺窝', rarity: 'R', color: '#4caf50', spriteId: 'cat_2', price: 300, spawnInterval: 5, catBasePrice: 30 },
    { level: 3, name: '哞哞窝', rarity: 'SR', color: '#2196f3', spriteId: 'cat_3', price: 900, spawnInterval: 5, catBasePrice: 90 },
    { level: 4, name: '咕咕窝', rarity: 'SSR', color: '#9c27b0', spriteId: 'cat_4', price: 2700, spawnInterval: 5, catBasePrice: 270 },
    { level: 5, name: '呱呱窝', rarity: 'UR', color: '#ff9800', spriteId: 'cat_5', price: 8100, spawnInterval: 5, catBasePrice: 810 },
  ],
  Conveyor: [
    { level: 1, name: '传送带', rarity: 'N', color: '#ffffff', spriteId: 'conveyor_1', price: 100, speed: 1.0 },
    { level: 2, name: '滑草传送带', rarity: 'R', color: '#4caf50', spriteId: 'conveyor_2', price: 300, speed: 2.0 },
    { level: 3, name: '溜冰传送带', rarity: 'SR', color: '#2196f3', spriteId: 'conveyor_3', price: 900, speed: 3.0 },
    { level: 4, name: '彩虹传送带', rarity: 'SSR', color: '#9c27b0', spriteId: 'conveyor_4', price: 2700, speed: 4.0 },
    { level: 5, name: '香蕉皮传送带', rarity: 'UR', color: '#ff9800', spriteId: 'conveyor_5', price: 8100, speed: 5.0 },
  ],
  PackingBox: [
    { level: 1, name: '纸箱', rarity: 'N', color: '#ffffff', spriteId: 'box_1', price: 100, capacity: 10 },
    { level: 2, name: '顺丰包装箱', rarity: 'R', color: '#4caf50', spriteId: 'box_2', price: 300, capacity: 30 },
    { level: 3, name: '浴缸', rarity: 'SR', color: '#2196f3', spriteId: 'box_3', price: 900, capacity: 100 },
    { level: 4, name: '圣诞袜', rarity: 'SSR', color: '#9c27b0', spriteId: 'box_4', price: 2700, capacity: 200 },
    { level: 5, name: '异次元口袋', rarity: 'UR', color: '#ff9800', spriteId: 'box_5', price: 8100, capacity: 500 },
  ],
  MutationGate: [
    { level: 1, name: '充气门', rarity: 'N', color: '#ffffff', spriteId: 'door_2', price: 100, priceMultiplier: 1.5, description: '变大变大！', effect: '小猫变大10%，可叠加' },
    { level: 2, name: '精舞门', rarity: 'R', color: '#4caf50', spriteId: 'door_3', price: 300, priceMultiplier: 2.0, description: 'Dancing！', effect: '小猫旋转速度增加50%，可叠加' },
    { level: 3, name: '颠倒门', rarity: 'SR', color: '#2196f3', spriteId: 'door_4', price: 900, priceMultiplier: 2.5, description: '脚就是头！', effect: '小猫上下翻转，可反复触发' },
    { level: 4, name: '烧烤门', rarity: 'SSR', color: '#9c27b0', spriteId: 'door_1', price: 2700, priceMultiplier: 3.0, description: '着火啦！', effect: '小猫身上着火，可叠加火焰高度' },
  ],
};

/** 所有建筑类型对应的最高等级 */
export const BUILDING_MAX_LEVEL: Record<BuildingType, number> = {
  CatNest: 5,
  Conveyor: 5,
  PackingBox: 5,
  MutationGate: 4,
};

/** 获取指定类型和等级的建筑配置 */
export function getBuildingConfig<T extends BuildingType>(
  type: T,
  level: number,
): BuildingConfigMap[T][number] | undefined {
  const configs = BUILDING_CONFIGS[type];
  return configs.find((c) => c.level === level) as BuildingConfigMap[T][number] | undefined;
}

/** 获取指定类型的所有等级配置 */
export function getBuildingConfigs<T extends BuildingType>(
  type: T,
): BuildingConfigMap[T] {
  return BUILDING_CONFIGS[type] as BuildingConfigMap[T];
}

/** 获取猫窝的小猫基础价格 */
export function getCatHouseBasePrice(level: number): number {
  return tierExponentialPrice(CAT_SELL_PRICE_BASE, CAT_SELL_PRICE_RATIO, level);
}

/** 获取猫窝的产出间隔 */
export function getCatHouseSpawnInterval(level: number): number {
  return getBuildingConfig('CatNest', level)?.spawnInterval ?? 5;
}

/** 获取传送带速度 */
export function getConveyorSpeed(level: number): number {
  return getBuildingConfig('Conveyor', level)?.speed ?? 1;
}

/** 获取包装箱容量 */
export function getCatBoxCapacity(level: number): number {
  return getBuildingConfig('PackingBox', level)?.capacity ?? 10;
}

/** 获取变异门价格倍率 */
export function getDoorMultiplier(level: number): number {
  return getBuildingConfig('MutationGate', level)?.priceMultiplier ?? 1.5;
}

/** 获取建筑名称 */
export function getBuildingName(type: BuildingType, level: number): string {
  return getBuildingConfig(type, level)?.name ?? `${type} Lv.${level}`;
}

/** 获取建筑购买价格 */
export function getBuildingPrice(_type: BuildingType, level: number): number {
  return tierExponentialPrice(BUILDING_PRICE_BASE, BUILDING_PRICE_RATIO, level);
}
