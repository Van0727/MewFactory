import { GRID_SIZE } from '../config';
import type { Player } from './Player';

export interface GridCell {
  gx: number;
  gy: number;
}

/** player.x/y 为脚底（精灵底部中心）在网格上的连续坐标 */
export function getPlayerCell(player: Player): GridCell {
  return {
    gx: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(player.x))),
    gy: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(player.y))),
  };
}

export function getPlayerFeetGridPos(player: Player): { gx: number; gy: number } {
  return {
    gx: player.x - 0.5,
    gy: player.y - 0.5,
  };
}
