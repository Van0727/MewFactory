import { GRID_SIZE } from '../config';
import { computeOrigin } from '../render/isometric';

/** Reference board canvas CSS size (~640×480 4:3 stage). */
export const REFERENCE_CANVAS_WIDTH = 592;
export const REFERENCE_CANVAS_HEIGHT = 388;

export const REFERENCE_VIEW_SCALE = computeOrigin(
  REFERENCE_CANVAS_WIDTH,
  REFERENCE_CANVAS_HEIGHT,
  GRID_SIZE,
).viewScale;

/** Scale canvas UI (fonts, bars, strokes) with iso viewScale. */
export function scaleCanvasUi(px: number, viewScale: number): number {
  return px * (viewScale / REFERENCE_VIEW_SCALE);
}

/** Scale overlay motion offsets when the board overlay resizes. */
export function overlayUiScale(width: number): number {
  return width / REFERENCE_CANVAS_WIDTH;
}
