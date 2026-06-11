export const BuildingType = {
  CatNest: 'CatNest',
  Conveyor: 'Conveyor',
  PackingBox: 'PackingBox',
  MutationGate: 'MutationGate',
} as const;

export type BuildingType = (typeof BuildingType)[keyof typeof BuildingType];

export const Direction = {
  Up: 'Up',
  Down: 'Down',
  Left: 'Left',
  Right: 'Right',
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export interface Building {
  type: BuildingType;
  direction: Direction;
  level: number;
}

const DIRECTION_ROTATION: Direction[] = [
  Direction.Up,
  Direction.Right,
  Direction.Down,
  Direction.Left,
];

export function rotateDirection(dir: Direction): Direction {
  const index = DIRECTION_ROTATION.indexOf(dir);
  return DIRECTION_ROTATION[(index + 1) % DIRECTION_ROTATION.length];
}

export function buildingStackKey(b: Building): string {
  return `${b.type}|${b.direction}|${b.level}`;
}

export function buildingsEqual(a: Building, b: Building): boolean {
  return buildingStackKey(a) === buildingStackKey(b);
}

export function createBuilding(
  type: BuildingType,
  level = 1,
  direction: Direction = Direction.Left,
): Building {
  return { type, direction, level };
}

export function getBuildingLabel(type: BuildingType): string {
  switch (type) {
    case BuildingType.CatNest:
      return '窝';
    case BuildingType.Conveyor:
      return '带';
    case BuildingType.PackingBox:
      return '箱';
    case BuildingType.MutationGate:
      return '门';
  }
}
