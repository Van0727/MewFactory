import { BuildingType, type Building } from './Building';
import type { Grid } from './Grid';

export function canPlaceBuilding(
  grid: Grid,
  gx: number,
  gy: number,
  building: Building,
): boolean {
  if (!grid.inBounds(gx, gy)) {
    return false;
  }

  if (building.type === BuildingType.MutationGate) {
    return grid.canPlaceMutationGate(gx, gy);
  }

  return grid.isEmpty(gx, gy);
}
