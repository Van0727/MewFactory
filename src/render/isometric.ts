import {
  BOARD_PADDING,
  GRID_SIZE,
  PERSPECTIVE_MIN_SCALE,
  TILE_HEIGHT,
  TILE_THICKNESS,
  TILE_WIDTH,
} from '../config';

export interface IsoOrigin {
  originX: number;
  originY: number;
  viewScale: number;
}

export function getDepthScale(gy: number): number {
  const t = Math.max(0, Math.min(1, gy / GRID_SIZE));
  return PERSPECTIVE_MIN_SCALE + (1 - PERSPECTIVE_MIN_SCALE) * t;
}

function getVanishXUnscaled(): number {
  return (GRID_SIZE * TILE_WIDTH) / 2;
}

function projectXUnscaled(worldX: number, gy: number): number {
  const vanishX = getVanishXUnscaled();
  return vanishX + (worldX - vanishX) * getDepthScale(gy);
}

function projectYUnscaled(gy: number): number {
  let y = 0;
  const row = Math.floor(gy);

  for (let i = 0; i < row; i++) {
    y += TILE_HEIGHT * getDepthScale(Math.min(i + 0.5, GRID_SIZE));
  }

  const frac = gy - row;
  if (frac > 0) {
    const rowScale = getDepthScale(Math.min(row + 0.5, GRID_SIZE));
    y += TILE_HEIGHT * rowScale * frac;
  }

  return y;
}

export function projectX(worldX: number, gy: number, origin: IsoOrigin): number {
  return origin.originX + projectXUnscaled(worldX, gy) * origin.viewScale;
}

export function projectY(gy: number, origin: IsoOrigin): number {
  return origin.originY + projectYUnscaled(gy) * origin.viewScale;
}

export function getTileTopCorners(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): [number, number][] {
  const yBack = projectY(gy, origin);
  const yFront = projectY(gy + 1, origin);

  return [
    [projectX(gx * TILE_WIDTH, gy, origin), yBack],
    [projectX((gx + 1) * TILE_WIDTH, gy, origin), yBack],
    [projectX((gx + 1) * TILE_WIDTH, gy + 1, origin), yFront],
    [projectX(gx * TILE_WIDTH, gy + 1, origin), yFront],
  ];
}

/** 横向多格建筑顶面四边形（从 gx 起连续 widthCells 格） */
export function getWideCellTopCorners(
  gx: number,
  gy: number,
  widthCells: number,
  origin: IsoOrigin,
): [number, number][] {
  const yBack = projectY(gy, origin);
  const yFront = projectY(gy + 1, origin);

  return [
    [projectX(gx * TILE_WIDTH, gy, origin), yBack],
    [projectX((gx + widthCells) * TILE_WIDTH, gy, origin), yBack],
    [projectX((gx + widthCells) * TILE_WIDTH, gy + 1, origin), yFront],
    [projectX(gx * TILE_WIDTH, gy + 1, origin), yFront],
  ];
}

export function getTileFrontCorners(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): [number, number][] {
  const yTop = projectY(gy + 1, origin);
  const thick = TILE_THICKNESS * getDepthScale(gy + 1) * origin.viewScale;
  const xLeft = projectX(gx * TILE_WIDTH, gy + 1, origin);
  const xRight = projectX((gx + 1) * TILE_WIDTH, gy + 1, origin);

  return [
    [xLeft, yTop],
    [xRight, yTop],
    [xRight, yTop + thick],
    [xLeft, yTop + thick],
  ];
}

export function getTileBoundsCorners(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): [number, number][] {
  return [...getTileTopCorners(gx, gy, origin), ...getTileFrontCorners(gx, gy, origin)];
}

function getBoardBounds(gridSize: number): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const tempOrigin: IsoOrigin = { originX: 0, originY: 0, viewScale: 1 };

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const corners = getTileBoundsCorners(gx, gy, tempOrigin);
      for (const [cx, cy] of corners) {
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
      }
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function computeOrigin(
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
): IsoOrigin {
  const bounds = getBoardBounds(gridSize);
  const availableWidth = Math.max(canvasWidth - BOARD_PADDING * 2, 1);
  const availableHeight = Math.max(canvasHeight - BOARD_PADDING * 2, 1);
  const viewScale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);

  return {
    viewScale,
    originX: (canvasWidth - bounds.width * viewScale) / 2 - bounds.minX * viewScale,
    originY: (canvasHeight - bounds.height * viewScale) / 2 - bounds.minY * viewScale,
  };
}

export function getTileSortY(_gx: number, gy: number, origin: IsoOrigin): number {
  const yFront = projectY(gy + 1, origin);
  return yFront + TILE_THICKNESS * getDepthScale(gy + 1) * origin.viewScale;
}

export function getPlayerAnchor(
  px: number,
  py: number,
  origin: IsoOrigin,
): { cx: number; cy: number; scale: number } {
  const xBackLeft = projectX(px * TILE_WIDTH, py, origin);
  const xBackRight = projectX((px + 1) * TILE_WIDTH, py, origin);
  const xFrontLeft = projectX(px * TILE_WIDTH, py + 1, origin);
  const xFrontRight = projectX((px + 1) * TILE_WIDTH, py + 1, origin);
  const yBack = projectY(py, origin);
  const yFront = projectY(py + 1, origin);

  return {
    cx: (xBackLeft + xBackRight + xFrontLeft + xFrontRight) / 4,
    cy: (yBack + yFront) / 2,
    scale: getDepthScale(py) * origin.viewScale,
  };
}
