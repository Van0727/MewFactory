import { getTileTopCorners, type IsoOrigin } from './isometric';

export function getCellAnchor(corners: [number, number][]): { cx: number; cy: number } {
  return {
    cx: corners.reduce((sum, [x]) => sum + x, 0) / corners.length,
    cy: corners.reduce((sum, [, y]) => sum + y, 0) / corners.length,
  };
}

export function getGridCellAnchor(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): { cx: number; cy: number } {
  return getCellAnchor(getTileTopCorners(gx, gy, origin));
}
