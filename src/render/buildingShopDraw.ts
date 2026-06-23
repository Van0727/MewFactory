import { BuildingType, createBuilding, Direction } from '../game/Building';
import type { BuildingShopKind } from '../game/buildingShopCatalog';
import { getGridCellAnchor } from './tileBounds';
import { drawBuilding } from './buildingDraw';
import type { IsoOrigin } from './isometric';

export function drawBuildingShop(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  kind: BuildingShopKind,
  origin: IsoOrigin,
): void {
  const preview = createBuilding(kind, 1, Direction.Right);
  drawBuilding(ctx, gx, gy, preview, origin);

  const { cx, cy } = getGridCellAnchor(gx, gy, origin);
  const fontSize = Math.max(11, 13);
  const labelY = cy - fontSize * 2.1;
  const text = kind === BuildingType.MutationGate ? '门店' : '商店';
  const padX = fontSize * 1.1;
  const padY = fontSize * 0.45;

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textW = ctx.measureText(text).width;
  const badgeW = textW + padX * 2;
  const badgeH = fontSize + padY * 2;
  const bx = cx - badgeW / 2;
  const by = labelY - badgeH / 2;

  ctx.fillStyle = 'rgba(120, 80, 180, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffe566';
  ctx.strokeStyle = 'rgba(60, 30, 90, 0.55)';
  ctx.lineWidth = 2;
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
