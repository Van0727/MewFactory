import { GRID_SIZE } from '../config';
import type { Player } from './Player';

export interface GridCell {
  gx: number;
  gy: number;
}

export function getPlayerCell(player: Player): GridCell {
  const cx = player.x + 0.5;
  const cy = player.y + 0.5;
  return {
    gx: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(cx))),
    gy: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(cy))),
  };
}
