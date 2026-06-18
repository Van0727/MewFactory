import {
  BuildingType,
  Direction,
  createBuilding,
  type Building,
} from './Building';
import type { BuildingShopKind } from './buildingShopCatalog';
import { getBuildingConfig } from '../data/buildings';

export function createShopBuilding(type: BuildingShopKind, level: number): Building {
  const building = createBuilding(type, level, Direction.Right);
  const cfg = getBuildingConfig(type, level);
  if (cfg) {
    building.name = cfg.name;
    building.rarity = cfg.rarity;
    building.color = cfg.color;
    building.spriteId = cfg.spriteId;
    if (type === BuildingType.MutationGate && 'description' in cfg) {
      building.description = (cfg as { description?: string }).description;
      building.effect = (cfg as { effect?: string }).effect;
    }
  }
  return building;
}
