import { BuildingType, type Building } from '../game/Building';
import { getBuildingSprite } from './assets';
import { type IsoOrigin } from './isometric';
import { directionToAngle, drawSpriteFlatInCell, drawSpriteInCell } from './spriteDraw';

function buildingNeedsRotation(type: BuildingType): boolean {
  return (
    type === BuildingType.CatNest ||
    type === BuildingType.Conveyor ||
    type === BuildingType.MutationGate
  );
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  building: Building,
  origin: IsoOrigin,
  drawScale = 1,
): void {
  drawBuildingInCell(ctx, gx, gy, origin, building, drawScale);
}

export function drawBuildingInCell(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
  building: Building,
  drawScale = 1,
): void {
  const sprite = getBuildingSprite(building);
  const rotation = buildingNeedsRotation(building.type)
    ? directionToAngle(building.direction)
    : 0;

  drawSpriteInCell(ctx, sprite, gx, gy, origin, { rotation, drawScale });
}

/** 手持建筑：无透视，正方向绘制 */
export function drawHeldBuildingInCell(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
  building: Building,
  drawScale = 1,
): void {
  const sprite = getBuildingSprite(building);
  const rotation = buildingNeedsRotation(building.type)
    ? directionToAngle(building.direction)
    : 0;

  drawSpriteFlatInCell(ctx, sprite, gx, gy, origin, { rotation, drawScale });
}
