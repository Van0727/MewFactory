import { BuildingType, createBuilding, Direction } from './Building';
import type { Grid } from './Grid';
import type { Simulation } from './Simulation';

/** Pre-placed pipeline for manual acceptance: nest → conveyors → box. */
export function seedDemoPipeline(grid: Grid, simulation: Simulation): void {
  const nest = createBuilding(BuildingType.CatNest, 1, Direction.Right);
  grid.set(2, 5, nest);
  simulation.onBuildingPlaced(2, 5, nest);

  for (let gx = 3; gx <= 6; gx++) {
    const conveyor = createBuilding(BuildingType.Conveyor, 1, Direction.Right);
    grid.set(gx, 5, conveyor);
    simulation.onBuildingPlaced(gx, 5, conveyor);
  }

  const box = createBuilding(BuildingType.PackingBox, 1, Direction.Left);
  grid.set(7, 5, box);
  simulation.onBuildingPlaced(7, 5, box);
}

export function shouldLoadDemoPipeline(): boolean {
  return new URLSearchParams(window.location.search).has('demo');
}
