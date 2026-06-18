import {
  getBuildingConfig,
  getBuildingName,
  type Rarity,
} from '../data/buildings';

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
  /** 建筑名称（如 "纸箱"、"顺丰包装箱"） */
  name: string;
  /** 稀有度 */
  rarity: Rarity;
  /** 稀有度对应颜色 */
  color: string;
  /** 图片资源 ID（如 "box_1"、"door_2"） */
  spriteId: string;
  /** 变异门描述文字 */
  description?: string;
  /** 变异门效果文字 */
  effect?: string;
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
  const cfg = getBuildingConfig(type, level);
  const building: Building = {
    type,
    direction,
    level,
    name: cfg?.name ?? getBuildingName(type, level),
    rarity: cfg?.rarity ?? 'N',
    color: cfg?.color ?? '#ffffff',
    spriteId: cfg?.spriteId ?? type.toLowerCase(),
  };
  if (type === BuildingType.MutationGate && 'description' in (cfg ?? {})) {
    const doorCfg = cfg as { description?: string; effect?: string };
    building.description = doorCfg.description;
    building.effect = doorCfg.effect;
  }
  return building;
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
