import type { CatMutationState } from '../game/Cat';
import { configureSpriteSmoothing } from './spriteDraw';

let offscreenCanvas: HTMLCanvasElement | null = null;

function getSourcePixelSize(source: CanvasImageSource): number {
  if (source instanceof HTMLImageElement) {
    return source.naturalWidth || source.width;
  }
  if (source instanceof HTMLCanvasElement) {
    return source.width;
  }
  return (source as ImageBitmap).width;
}

function borrowOffscreen(size: number): HTMLCanvasElement {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
  }
  if (offscreenCanvas.width !== size || offscreenCanvas.height !== size) {
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
  }
  return offscreenCanvas;
}

function computeBarbecuePadding(size: number, stacks: number): number {
  const flameExt = size * 0.08 * stacks * 1.25;
  return Math.ceil(flameExt);
}

/**
 * 烧烤门着色 / 火焰叠在 role 原图上。
 * 充气、精舞翻转、颠倒翻转在绘制阶段按最终体型叠加（见 catDraw）。
 */
export function prepareCatRoleSource(
  img: HTMLImageElement,
  mutations: CatMutationState,
): CanvasImageSource {
  if (mutations.barbecueStacks <= 0) {
    return img;
  }

  const size = img.naturalWidth || img.width;
  const pad = computeBarbecuePadding(size, mutations.barbecueStacks);
  const canvasSize = size + 2 * pad;
  const offscreen = borrowOffscreen(canvasSize);
  const octx = offscreen.getContext('2d');
  if (!octx) {
    return img;
  }

  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, canvasSize, canvasSize);

  configureSpriteSmoothing(octx);
  octx.drawImage(img, pad, pad, size, size);

  const tintAlpha = Math.min(0.85, 0.35 + mutations.barbecueStacks * 0.15);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = `rgba(255, 60, 0, ${tintAlpha})`;
  octx.fillRect(pad, pad, size, size);

  octx.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < mutations.barbecueStacks; i++) {
    const flameHeight = size * 0.08 * (i + 1);
    const flameAlpha = Math.min(0.75, 0.35 + i * 0.12);
    octx.fillStyle = `rgba(255, ${120 + i * 20}, 0, ${flameAlpha})`;
    octx.fillRect(
      pad + size / 4,
      pad - flameHeight * 0.25,
      size / 2,
      flameHeight,
    );
  }
  octx.globalCompositeOperation = 'source-over';

  return offscreen;
}

/**
 * 烧烤门离屏画布比 role 大一圈；绘制时需放大 drawScale，否则充气体型会被 pad 稀释。
 */
export function getCatRoleSourceDrawScaleMultiplier(
  source: CanvasImageSource,
  roleImg: HTMLImageElement,
): number {
  const roleSize = roleImg.naturalWidth || roleImg.width;
  if (roleSize <= 0) {
    return 1;
  }
  return getSourcePixelSize(source) / roleSize;
}
