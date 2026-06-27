import { BuildingType } from '../game/Building';
import { getBuildingShopTitle } from '../game/buildingShopCatalog';
import { scaleCanvasUi } from '../ui/uiScale';
import type { IsoOrigin } from './isometric';

export interface FloatingMapLabelColors {
  badgeFill: string;
  badgeStroke: string;
  textFill: string;
  textStroke: string;
}

const DEFAULT_COLORS: FloatingMapLabelColors = {
  badgeFill: 'rgba(180, 110, 40, 0.92)',
  badgeStroke: 'rgba(255, 255, 255, 0.55)',
  textFill: '#ffe566',
  textStroke: 'rgba(80, 40, 10, 0.55)',
};

/** 以「猫窝商店」为基准的统一外框宽度 */
export function getMapShopBadgeWidth(
  ctx: CanvasRenderingContext2D,
  origin: IsoOrigin,
): number {
  const fontSize = scaleCanvasUi(14, origin.viewScale);
  const padX = fontSize * 1.15;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const textW = ctx.measureText(getBuildingShopTitle(BuildingType.CatNest)).width;
  return textW + padX * 2;
}

/** 地块上方悬浮标签（回收处、建筑商店等共用） */
export function drawFloatingMapLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  origin: IsoOrigin,
  options: {
    lift?: number;
    colors?: FloatingMapLabelColors;
    badgeWidth?: number;
  } = {},
): void {
  const colors = options.colors ?? DEFAULT_COLORS;
  const lift = options.lift ?? 1.4;
  const fontSize = scaleCanvasUi(14, origin.viewScale);
  const labelY = cy - fontSize * lift;
  const padX = fontSize * 1.15;
  const padY = fontSize * 0.5;
  const strokeW = scaleCanvasUi(2, origin.viewScale);

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const badgeW =
    options.badgeWidth ??
    ctx.measureText(text).width + padX * 2;
  const badgeH = fontSize + padY * 2;
  const bx = cx - badgeW / 2;
  const by = labelY - badgeH / 2;

  ctx.fillStyle = colors.badgeFill;
  ctx.strokeStyle = colors.badgeStroke;
  ctx.lineWidth = strokeW;
  roundRect(ctx, bx, by, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.textFill;
  ctx.strokeStyle = colors.textStroke;
  ctx.lineWidth = strokeW;
  ctx.strokeText(text, cx, labelY);
  ctx.fillText(text, cx, labelY);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
