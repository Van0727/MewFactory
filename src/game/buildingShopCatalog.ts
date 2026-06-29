import { BuildingType } from './Building';
import { getBuildingName } from '../data/buildings';

/** 棋盘上固定建筑商店的售卖建筑类型 */
export type BuildingShopKind = BuildingType;

export const BUILDING_SHOP_KINDS = [
  BuildingType.CatNest,
  BuildingType.Conveyor,
  BuildingType.MutationGate,
  BuildingType.PackingBox,
] as const;

export function isBuildingShopKind(type: BuildingType): type is BuildingShopKind {
  return (BUILDING_SHOP_KINDS as readonly BuildingType[]).includes(type);
}

export function getBuildingShopTitle(type: BuildingShopKind): string {
  switch (type) {
    case BuildingType.CatNest:
      return '猫窝商店';
    case BuildingType.Conveyor:
      return '传送带商店';
    case BuildingType.MutationGate:
      return '变异门商店';
    case BuildingType.PackingBox:
      return '包装箱商店';
  }
}

export function getBuildingShopItemLabel(type: BuildingShopKind, level: number): string {
  return getBuildingName(type, level);
}

export function getBuildingShopSpriteId(type: BuildingShopKind): string {
  switch (type) {
    case BuildingType.CatNest:
      return 'shop_mew';
    case BuildingType.Conveyor:
      return 'shop_conveyor';
    case BuildingType.MutationGate:
      return 'shop_door';
    case BuildingType.PackingBox:
      return 'shop_box';
  }
}
