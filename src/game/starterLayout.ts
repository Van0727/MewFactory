import { GRID_SIZE } from '../config';
import {
  BuildingType,
  createBuilding,
  Direction,
  rotateDirection,
} from './Building';
import type { Grid } from './Grid';
import type { Simulation } from './Simulation';

/** 预设生产线：猫窝 → 4 节传送带（其中 1 节带变异门）→ 包装箱 */
export function seedStarterPipeline(grid: Grid, simulation: Simulation): void {
  const row = Math.floor(GRID_SIZE / 2);
  const nestX = 1;
  const conveyorCount = 4;
  const boxX = nestX + 1 + conveyorCount;
  const gateConveyorIndex = 1;

  const nest = createBuilding(BuildingType.CatNest, 1, Direction.Right);
  grid.set(nestX, row, nest);
  simulation.onBuildingPlaced(nestX, row, nest);

  for (let i = 0; i < conveyorCount; i++) {
    const gx = nestX + 1 + i;
    const conveyor = createBuilding(BuildingType.Conveyor, 1, Direction.Right);
    grid.set(gx, row, conveyor);
    simulation.onBuildingPlaced(gx, row, conveyor);

    if (i === gateConveyorIndex) {
      const gate = createBuilding(
        BuildingType.MutationGate,
        1,
        rotateDirection(conveyor.direction),
      );
      grid.setMutationGate(gx, row, gate);
    }
  }

  const box = createBuilding(BuildingType.PackingBox, 1, Direction.Left);
  grid.set(boxX, row, box);
  simulation.onBuildingPlaced(boxX, row, box);
}
