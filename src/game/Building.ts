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

import { MUTATION_GATE_DEFAULT_MULTIPLIER } from '../config';

export interface Building {
  type: BuildingType;
  direction: Direction;
  level: number;
  /** 变异门价格倍率（仅 MutationGate） */
  priceMultiplier?: number;
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
  const building: Building = { type, direction, level };
  if (type === BuildingType.MutationGate) {
    building.priceMultiplier = MUTATION_GATE_DEFAULT_MULTIPLIER;
  }
  return building;
}

export function getMutationGateMultiplier(gate: Building): number {
  return gate.priceMultiplier ?? MUTATION_GATE_DEFAULT_MULTIPLIER;
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
