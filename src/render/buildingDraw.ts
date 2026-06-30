import { BuildingType, type Building } from '../game/Building';
import {
  BUILDING_GROUND_LIFT_PX,
  HELD_BUILDING_DRAW_SCALE,
  PACKING_BOX_GROUND_LIFT_PX,
  SPRITE_SOURCE_SCALE,
} from '../config';
import { getBuildingSprite, getSprite } from './assets';
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

function getHeldHeadOffset(origin: IsoOrigin): { headTopFromFeet: number; gap: number } {
  const playerImg = getSprite('player');
  const worldScale = origin.viewScale / SPRITE_SOURCE_SCALE;
  const playerHeight = playerImg.naturalHeight * worldScale;
  return {
    headTopFromFeet: playerHeight * 0.48,
    gap: scaleCanvasUi(3, origin.viewScale),
  };
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

/** 手持建筑：无透视，显示在玩家头顶上方 */
export function drawHeldBuildingInCell(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  origin: IsoOrigin,
  building: Building,
  drawScale = 1,
): void {
  const sprite = getBuildingSprite(building);
  const heldScale = drawScale * HELD_BUILDING_DRAW_SCALE;
  const { headTopFromFeet, gap } = getHeldHeadOffset(origin);
  const offsetY = -(headTopFromFeet + gap);
  const rotation =
    building.type === BuildingType.MutationGate
      ? Math.PI / 2
      : buildingNeedsRotation(building.type)
        ? directionToAngleForBuilding(building)
        : 0;

  drawSpriteFlatInCell(ctx, sprite, gx, gy, origin, {
    rotation,
    drawScale: heldScale,
    anchorX: 0.5,
    anchorY: 1,
    offsetY,
  });
}
