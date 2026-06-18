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
  const name = getBuildingName(type, level);
  const typeLabel = getBuildingTypeLabel(type);
  return `${name}（${typeLabel} Lv.${level}）`;
}

function getBuildingTypeLabel(type: BuildingType): string {
  switch (type) {
    case BuildingType.CatNest:
      return '猫窝';
    case BuildingType.Conveyor:
      return '传送带';
    case BuildingType.MutationGate:
      return '变异门';
    case BuildingType.PackingBox:
      return '包装箱';
  }
}
