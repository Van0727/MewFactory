import { MUTATION_GATE_DEFAULT_MULTIPLIER } from '../config';
import {
  BuildingType,
  Direction,
  createBuilding,
  type Building,
} from './Building';
import type { BuildingShopKind } from './buildingShopCatalog';

export function createShopBuilding(type: BuildingShopKind, level: number): Building {
  const building = createBuilding(type, level, Direction.Right);
  if (type === BuildingType.MutationGate) {
    building.priceMultiplier = MUTATION_GATE_DEFAULT_MULTIPLIER + (level - 1) * 0.25;
  }
  return building;
}
