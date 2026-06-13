import { GRID_SIZE, PLAYER_SPEED } from '../config';
import type { MovementState } from '../input/InputManager';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class Player {
  /** 脚底（精灵底部中心）在网格上的连续坐标 */
  x = Math.floor(GRID_SIZE / 2) + 0.5;
  y = Math.floor(GRID_SIZE / 2) + 0.5;

  update(dt: number, input: MovementState): void {
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv;
      dy *= inv;
    }

    this.x = clamp(this.x + dx * PLAYER_SPEED * dt, 0, GRID_SIZE);
    this.y = clamp(this.y + dy * PLAYER_SPEED * dt, 0, GRID_SIZE);
  }
}
