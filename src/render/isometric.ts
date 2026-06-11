import { TILE_HEIGHT, TILE_WIDTH } from '../config';

export interface IsoOrigin {
  originX: number;
  originY: number;
}

export function gridToScreen(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_WIDTH / 2) + origin.originX,
    y: (gx + gy) * (TILE_HEIGHT / 2) + origin.originY,
  };
}

export function computeOrigin(
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
): IsoOrigin {
  const centerGx = gridSize / 2;
  const centerGy = gridSize / 2;
  const centerScreenX = (centerGx - centerGy) * (TILE_WIDTH / 2);
  const centerScreenY = (centerGx + centerGy) * (TILE_HEIGHT / 2);

  return {
    originX: canvasWidth / 2 - centerScreenX,
    originY: canvasHeight / 2 - centerScreenY,
  };
}

export function getTileCorners(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): [number, number][] {
  const { x, y } = gridToScreen(gx, gy, origin);
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  return [
    [x, y - hh],
    [x + hw, y],
    [x, y + hh],
    [x - hw, y],
  ];
}

export function getDepth(gx: number, gy: number): number {
  return gx + gy;
}
