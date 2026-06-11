import { GRID_SIZE } from '../config';
import { Direction } from './Building';

export const ALL_DIRECTIONS: Direction[] = [
  Direction.Up,
  Direction.Right,
  Direction.Down,
  Direction.Left,
];

export function getOffset(direction: Direction): { dx: number; dy: number } {
  switch (direction) {
    case Direction.Up:
      return { dx: 0, dy: -1 };
    case Direction.Down:
      return { dx: 0, dy: 1 };
    case Direction.Left:
      return { dx: -1, dy: 0 };
    case Direction.Right:
      return { dx: 1, dy: 0 };
  }
}

export function getOpposite(direction: Direction): Direction {
  switch (direction) {
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    case Direction.Left:
      return Direction.Right;
    case Direction.Right:
      return Direction.Left;
  }
}

export function isOpposite(a: Direction, b: Direction): boolean {
  return getOpposite(a) === b;
}

export function getNeighbor(
  gx: number,
  gy: number,
  direction: Direction,
): { gx: number; gy: number } | null {
  const { dx, dy } = getOffset(direction);
  const nx = gx + dx;
  const ny = gy + dy;
  if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
    return null;
  }
  return { gx: nx, gy: ny };
}

/** End-of-belt neighbor scan: same direction first, then clockwise. */
export function orderDirectionsForEnd(currentDir: Direction): Direction[] {
  const startIndex = ALL_DIRECTIONS.indexOf(currentDir);
  const ordered: Direction[] = [currentDir];
  for (let i = 1; i < ALL_DIRECTIONS.length; i++) {
    ordered.push(ALL_DIRECTIONS[(startIndex + i) % ALL_DIRECTIONS.length]);
  }
  return ordered;
}
