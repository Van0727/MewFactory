import type { CatMutationState } from '../game/Cat';
import { configureSpriteSmoothing } from './spriteDraw';

let offscreenCanvas: HTMLCanvasElement | null = null;

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

function needsOffscreenCompose(mutations: CatMutationState): boolean {
  return (
    mutations.barbecueStacks > 0 ||
    mutations.danceStacks > 0 ||
    mutations.flipCount % 2 === 1
  );
}

/** 为旋转 / 火焰等效果预留边距，避免离屏合成时被裁切 */
function computeMutationPadding(size: number, mutations: CatMutationState): number {
  let pad = 0;
  if (mutations.danceStacks > 0) {
    pad = Math.max(pad, Math.ceil(size * (Math.SQRT2 - 1) / 2));
  }
  if (mutations.barbecueStacks > 0) {
    const flameExt = size * 0.08 * mutations.barbecueStacks * 1.25;
    pad = Math.max(pad, Math.ceil(flameExt));
  }
  return pad;
}

/**
 * 在 role 原图基础上叠加变异视觉效果（着色 / 旋转 / 翻转），不替换资源。
 * 充气与脉冲缩放由 drawSpriteFlatInCell 的 drawScale 处理，避免离屏裁切。
 */
export function prepareCatRoleSource(
  img: HTMLImageElement,
  mutations: CatMutationState,
): CanvasImageSource {
  const size = img.naturalWidth || img.width;
  if (!needsOffscreenCompose(mutations)) {
    return img;
  }

  const pad = computeMutationPadding(size, mutations);
  const canvasSize = size + 2 * pad;
  const offscreen = borrowOffscreen(canvasSize);
  const octx = offscreen.getContext('2d');
  if (!octx) {
    return img;
  }

  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, canvasSize, canvasSize);

  const rotation = mutations.danceStacks > 0 ? mutations.danceAngle : 0;
  const flipY = mutations.flipCount % 2 === 1 ? -1 : 1;

  configureSpriteSmoothing(octx);
  octx.translate(canvasSize / 2, canvasSize / 2);
  octx.rotate(rotation);
  octx.scale(1, flipY);
  octx.drawImage(img, -size / 2, -size / 2, size, size);

  if (mutations.barbecueStacks > 0) {
    const tintAlpha = Math.min(0.85, 0.35 + mutations.barbecueStacks * 0.15);
    octx.globalCompositeOperation = 'source-atop';
    octx.fillStyle = `rgba(255, 60, 0, ${tintAlpha})`;
    octx.fillRect(-size / 2, -size / 2, size, size);

    octx.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < mutations.barbecueStacks; i++) {
      const flameHeight = size * 0.08 * (i + 1);
      const flameAlpha = Math.min(0.75, 0.35 + i * 0.12);
      octx.fillStyle = `rgba(255, ${120 + i * 20}, 0, ${flameAlpha})`;
      octx.fillRect(-size / 4, -size / 2 - flameHeight * 0.25, size / 2, flameHeight);
    }
    octx.globalCompositeOperation = 'source-over';
  }

  return offscreen;
}
