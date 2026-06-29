import { BuildingType, type Building } from '../game/Building';
import {
  BUILDING_GROUND_LIFT_PX,
  PACKING_BOX_GROUND_LIFT_PX,
  PLAYER_SPRITE_ANCHOR_X,
  PLAYER_SPRITE_ANCHOR_Y,
} from '../config';
import { getBuildingSprite } from './assets';
import { type IsoOrigin } from './isometric';
import { scaleCanvasUi } from '../ui/uiScale';
import { directionToAngleForBuilding, drawLiftedBuildingInCell, drawSpriteFlatInCell, drawSpriteInCell } from './spriteDraw';

function buildingNeedsRotation(type: BuildingType): boolean {
  return (
    type === BuildingType.CatNest ||
    type === BuildingType.Conveyor ||
    type === BuildingType.MutationGate
  );
}

function buildingUsesGroundLift(type: BuildingType): boolean {
  return type === BuildingType.CatNest || type === BuildingType.PackingBox;
}

function getGroundLiftBasePx(type: BuildingType): number {
  return type === BuildingType.PackingBox
    ? PACKING_BOX_GROUND_LIFT_PX
    : BUILDING_GROUND_LIFT_PX;
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
    ? directionToAngleForBuilding(building)
    : 0;

  if (buildingUsesGroundLift(building.type)) {
    drawLiftedBuildingInCell(ctx, sprite, gx, gy, origin, {
      rotation,
      drawScale,
      liftBasePx: getGroundLiftBasePx(building.type),
    });
    return;
  }

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
    ? directionToAngleForBuilding(building)
    : 0;

  if (buildingUsesGroundLift(building.type)) {
    const liftPx =
      scaleCanvasUi(getGroundLiftBasePx(building.type), origin.viewScale) * drawScale;
    drawSpriteFlatInCell(ctx, sprite, gx, gy, origin, {
      rotation,
      drawScale,
      anchorX: PLAYER_SPRITE_ANCHOR_X,
      anchorY: PLAYER_SPRITE_ANCHOR_Y,
      offsetY: -liftPx,
    });
    return;
  }

  drawSpriteFlatInCell(ctx, sprite, gx, gy, origin, { rotation, drawScale });
}
