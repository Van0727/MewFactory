import {
  COLOR_BUILDING_CAT_NEST,
  COLOR_BUILDING_CONVEYOR,
  COLOR_BUILDING_MUTATION_GATE,
  COLOR_BUILDING_PACKING_BOX,
  TILE_WIDTH,
} from '../config';
import {
  BuildingType,
  Direction,
  type Building,
} from '../game/Building';
import { getTileTopCorners, type IsoOrigin } from './isometric';

function getBuildingColor(type: BuildingType): string {
  switch (type) {
    case BuildingType.CatNest:
      return COLOR_BUILDING_CAT_NEST;
    case BuildingType.Conveyor:
      return COLOR_BUILDING_CONVEYOR;
    case BuildingType.PackingBox:
      return COLOR_BUILDING_PACKING_BOX;
    case BuildingType.MutationGate:
      return COLOR_BUILDING_MUTATION_GATE;
  }
}

function getDirectionVector(dir: Direction): [number, number] {
  switch (dir) {
    case Direction.Up:
      return [0, -1];
    case Direction.Down:
      return [0, 1];
    case Direction.Left:
      return [-1, 0];
    case Direction.Right:
      return [1, 0];
  }
}

function getTileCenter(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): { cx: number; cy: number; scale: number } {
  const corners = getTileTopCorners(gx, gy, origin);
  const cx = (corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4;
  const cy = (corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4;
  const scale = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]) / TILE_WIDTH;
  return { cx, cy, scale };
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  building: Building,
  origin: IsoOrigin,
): void {
  const { cx, cy, scale } = getTileCenter(gx, gy, origin);
  drawBuildingAtPoint(ctx, cx, cy, scale, building);
}

export function drawBuildingAtPoint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  building: Building,
): void {
  const size = 18 * scale;
  const color = getBuildingColor(building.type);

  ctx.save();

  if (building.type === BuildingType.PackingBox) {
    ctx.fillStyle = color;
    ctx.fillRect(cx - size * 0.6, cy - size * 0.5, size * 1.2, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - size * 0.6, cy - size * 0.5, size * 1.2, size);
  } else if (building.type === BuildingType.MutationGate) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    drawDirectionArrow(ctx, cx, cy, building.direction, size * 0.5, color);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (building.type === BuildingType.Conveyor || building.type === BuildingType.CatNest) {
      drawDirectionArrow(ctx, cx, cy, building.direction, size * 0.45, '#fff');
    }
  }

  ctx.restore();
}

function drawDirectionArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  direction: Direction,
  length: number,
  color: string,
): void {
  const [dx, dy] = getDirectionVector(direction);
  const endX = cx + dx * length;
  const endY = cy + dy * length;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - dx * length * 0.3, cy - dy * length * 0.3);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const headSize = length * 0.35;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 6),
    endY - headSize * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 6),
    endY - headSize * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}
