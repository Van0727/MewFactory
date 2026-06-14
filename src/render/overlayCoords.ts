import { GRID_SIZE } from '../config';
import { computeOrigin } from './isometric';
import { getGridCellAnchor } from './tileBounds';

/** 网格格心 → ui-overlay 内 CSS 像素坐标 */
export function gridCellToOverlayPoint(
  canvas: HTMLCanvasElement,
  overlay: HTMLElement,
  gx: number,
  gy: number,
): { x: number; y: number } {
  const canvasRect = canvas.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  const origin = computeOrigin(canvasRect.width, canvasRect.height, GRID_SIZE);
  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  return {
    x: cx + canvasRect.left - overlayRect.left,
    y: cy + canvasRect.top - overlayRect.top,
  };
}
