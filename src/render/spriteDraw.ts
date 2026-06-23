import { Direction } from '../game/Building';
import { TILE_BLEED_PX, TILE_GROUND_BLEED_PX } from '../config';
import { getTileTopCorners, type IsoOrigin } from './isometric';
import { getCellAnchor, getGridCellAnchor } from './tileBounds';

const offscreenPool = new Map<string, HTMLCanvasElement>();
const SOURCE_EDGE_PAD = 4;
/** Overlap between the two triangles across the internal diagonal (CSS px). */
const GROUND_DIAGONAL_OVERLAP = 1;

/** Square art faces grid Left by default. */
export function directionToAngle(dir: Direction): number {
  switch (dir) {
    case Direction.Left:
      return 0;
    case Direction.Up:
      return Math.PI / 2;
    case Direction.Right:
      return Math.PI;
    case Direction.Down:
      return -Math.PI / 2;
  }
}

export function configureSpriteSmoothing(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function expandCorners(
  corners: [number, number][],
  bleedPx: number,
): [number, number][] {
  if (bleedPx <= 0) {
    return corners;
  }
  const cx = corners.reduce((sum, [x]) => sum + x, 0) / corners.length;
  const cy = corners.reduce((sum, [, y]) => sum + y, 0) / corners.length;
  return corners.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) {
      return [x, y] as [number, number];
    }
    const scale = (len + bleedPx) / len;
    return [cx + dx * scale, cy + dy * scale] as [number, number];
  });
}

/** Push three triangle vertices out from their centroid so adjacent triangles overlap. */
function expandTriangle(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  px: number,
): [[number, number], [number, number], [number, number]] {
  const cx = (p0[0] + p1[0] + p2[0]) / 3;
  const cy = (p0[1] + p1[1] + p2[1]) / 3;
  const push = ([x, y]: [number, number]): [number, number] => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) {
      return [x, y];
    }
    const scale = (len + px) / len;
    return [cx + dx * scale, cy + dy * scale];
  };
  return [push(p0), push(p1), push(p2)];
}

function clipToPolygon(ctx: CanvasRenderingContext2D, corners: [number, number][]): void {
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i][0], corners[i][1]);
  }
  ctx.closePath();
  ctx.clip();
}

function getSourceSize(source: CanvasImageSource): number {
  if (source instanceof HTMLImageElement) {
    return source.naturalWidth || source.width;
  }
  if (source instanceof HTMLCanvasElement) {
    return source.width;
  }
  return (source as ImageBitmap).width;
}

function drawImageTriangle(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  sample: number,
  pad: number,
): void {
  ctx.save();
  clipToPolygon(ctx, [p0, p1, p2]);
  configureSpriteSmoothing(ctx);
  ctx.transform(
    (p1[0] - p0[0]) / sample,
    (p1[1] - p0[1]) / sample,
    (p2[0] - p1[0]) / sample,
    (p2[1] - p1[1]) / sample,
    p0[0],
    p0[1],
  );
  ctx.drawImage(source, -pad, -pad, sample, sample);
  ctx.restore();
}

function drawImageTriangleLower(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  sample: number,
  pad: number,
): void {
  ctx.save();
  clipToPolygon(ctx, [p0, p1, p2]);
  configureSpriteSmoothing(ctx);
  ctx.transform(
    (p1[0] - p2[0]) / sample,
    (p1[1] - p2[1]) / sample,
    (p2[0] - p0[0]) / sample,
    (p2[1] - p0[1]) / sample,
    p0[0],
    p0[1],
  );
  ctx.drawImage(source, -pad, -pad, sample, sample);
  ctx.restore();
}

/**
 * Ground: exact trapezoid via two triangles. The quad is expanded outward so
 * neighbors overlap (no inter-tile seam), and each triangle is expanded so they
 * overlap across the diagonal (no internal seam). Square art keeps its 1:1 source.
 */
function drawGroundOnIsoQuad(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  corners: [number, number][],
  bleedPx = TILE_GROUND_BLEED_PX,
): void {
  const [backLeft, backRight, frontRight, frontLeft] = expandCorners(corners, bleedPx);
  const size = getSourceSize(source);
  const pad = SOURCE_EDGE_PAD + 2;
  const sample = size + pad * 2;

  const upper = expandTriangle(backLeft, backRight, frontRight, GROUND_DIAGONAL_OVERLAP);
  const lower = expandTriangle(backLeft, frontRight, frontLeft, GROUND_DIAGONAL_OVERLAP);

  drawImageTriangle(ctx, source, upper[0], upper[1], upper[2], sample, pad);
  drawImageTriangleLower(ctx, source, lower[0], lower[1], lower[2], sample, pad);
}

/** Buildings / entities: single affine + clip (supports rotated source). */
export function drawSquareOnIsoQuad(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  corners: [number, number][],
  bleedPx = TILE_BLEED_PX,
): void {
  const expanded = expandCorners(corners, bleedPx);
  const [backLeft, backRight, , frontLeft] = expanded;
  const size = getSourceSize(source);
  const pad = SOURCE_EDGE_PAD;
  const sample = size + pad * 2;

  ctx.save();
  clipToPolygon(ctx, expanded);
  configureSpriteSmoothing(ctx);
  ctx.transform(
    (backRight[0] - backLeft[0]) / sample,
    (backRight[1] - backLeft[1]) / sample,
    (frontLeft[0] - backLeft[0]) / sample,
    (frontLeft[1] - backLeft[1]) / sample,
    backLeft[0],
    backLeft[1],
  );
  ctx.drawImage(source, -pad, -pad, sample, sample);
  ctx.restore();
}

/** 以四边形中心为原点缩放顶点，使精灵整体变大而不被格子裁切 */
function scaleCornersFromCenter(
  corners: [number, number][],
  scale: number,
): [number, number][] {
  if (scale === 1) {
    return corners;
  }
  const { cx, cy } = getCellAnchor(corners);
  return corners.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
}

function borrowOffscreen(size: number): HTMLCanvasElement {
  const key = `sq${size}`;
  let canvas = offscreenPool.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    offscreenPool.set(key, canvas);
  }
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  return canvas;
}

function prepareSquareSource(
  img: HTMLImageElement,
  rotation: number,
  drawScale: number,
): CanvasImageSource {
  if (rotation === 0 && drawScale === 1) {
    return img;
  }
  const size = img.naturalWidth || img.width;
  const offscreen = borrowOffscreen(size);
  const octx = offscreen.getContext('2d');
  if (!octx) {
    return img;
  }
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, size, size);
  configureSpriteSmoothing(octx);
  octx.translate(size / 2, size / 2);
  octx.rotate(rotation);
  octx.scale(drawScale, drawScale);
  octx.drawImage(img, -size / 2, -size / 2, size, size);
  return offscreen;
}

export interface DrawSpriteInCellOptions {
  rotation?: number;
  drawScale?: number;
  bleedPx?: number;
  /** 源图归一化锚点 (0–1)，默认 0.5 为图像中心 */
  anchorX?: number;
  anchorY?: number;
}

export function drawSpriteInCell(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  gx: number,
  gy: number,
  origin: IsoOrigin,
  options: DrawSpriteInCellOptions = {},
): void {
  const corners = getTileTopCorners(gx, gy, origin);
  const { rotation = 0, drawScale = 1, bleedPx = TILE_BLEED_PX } = options;
  const source = prepareSquareSource(img, rotation, 1);
  const quad = scaleCornersFromCenter(corners, drawScale);
  drawSquareOnIsoQuad(ctx, source, quad, bleedPx);
}

export function getFlatSpriteSize(gx: number, gy: number, origin: IsoOrigin): number {
  const corners = getTileTopCorners(gx, gy, origin);
  const frontWidth = Math.hypot(corners[2][0] - corners[3][0], corners[2][1] - corners[3][1]);
  const backWidth = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]);
  return (frontWidth + backWidth) / 2;
}

/** 无透视：在格子锚点绘制正方向精灵（玩家、手持建筑） */
export function drawSpriteFlatInCell(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  gx: number,
  gy: number,
  origin: IsoOrigin,
  options: DrawSpriteInCellOptions = {},
): void {
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const size = getFlatSpriteSize(gx, gy, origin);
  const {
    rotation = 0,
    drawScale = 1,
    anchorX = 0.5,
    anchorY = 0.5,
  } = options;
  const source = prepareSquareSource(img, rotation, drawScale);
  const drawSize = size * drawScale;
  const anchorPxX = drawSize * anchorX;
  const anchorPxY = drawSize * anchorY;

  ctx.save();
  configureSpriteSmoothing(ctx);
  ctx.drawImage(source, cx - anchorPxX, cy - anchorPxY, drawSize, drawSize);
  ctx.restore();
}

export function drawSpriteInIsoTile(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  corners: [number, number][],
  bleedPx = TILE_GROUND_BLEED_PX,
): void {
  drawGroundOnIsoQuad(ctx, img, corners, bleedPx);
}

export function getCellDrawSize(
  gx: number,
  gy: number,
  origin: IsoOrigin,
): { cx: number; cy: number } {
  return getGridCellAnchor(gx, gy, origin);
}

export { getCellAnchor, getGridCellAnchor, getTileTopCorners, expandCorners };
