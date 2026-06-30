/** 来自 data/charatcer.csv */
export type CharacterAttributeId = 'moveSpeed' | 'strength';

export interface CharacterLevelConfig {
  level: number;
  value: number;
  price: number;
}

const ATTRIBUTE_CSV_NAMES: Record<CharacterAttributeId, string> = {
  moveSpeed: '移动速度',
  strength: '举起数量',
};

export const CHARACTER_ATTRIBUTE_IDS: CharacterAttributeId[] = ['moveSpeed', 'strength'];

export const CHARACTER_ATTRIBUTE_LABELS: Record<CharacterAttributeId, string> = {
  moveSpeed: '移动速度',
  strength: '举起数量',
};

/** 属性等级配置（与 charatcer.csv 同步） */
export const CHARACTER_CONFIGS: Record<CharacterAttributeId, CharacterLevelConfig[]> = {
  moveSpeed: [
    { level: 1, value: 100, price: 100 },
    { level: 2, value: 120, price: 200 },
    { level: 3, value: 140, price: 300 },
    { level: 4, value: 160, price: 400 },
    { level: 5, value: 180, price: 500 },
    { level: 6, value: 200, price: 600 },
    { level: 7, value: 220, price: 700 },
    { level: 8, value: 240, price: 800 },
    { level: 9, value: 260, price: 900 },
    { level: 10, value: 300, price: 1000 },
  ],
  strength: [
    { level: 1, value: 10, price: 100 },
    { level: 2, value: 20, price: 200 },
    { level: 3, value: 30, price: 300 },
    { level: 4, value: 50, price: 400 },
    { level: 5, value: 80, price: 500 },
    { level: 6, value: 120, price: 600 },
    { level: 7, value: 180, price: 700 },
    { level: 8, value: 250, price: 800 },
    { level: 9, value: 400, price: 900 },
    { level: 10, value: 800, price: 1000 },
  ],
};

export function getCharacterCsvName(attr: CharacterAttributeId): string {
  return ATTRIBUTE_CSV_NAMES[attr];
}

export function getCharacterLevelConfig(
  attr: CharacterAttributeId,
  level: number,
): CharacterLevelConfig | undefined {
  return CHARACTER_CONFIGS[attr].find((c) => c.level === level);
}

export function getCharacterMaxLevel(attr: CharacterAttributeId): number {
  return CHARACTER_CONFIGS[attr].length;
}

export function getCharacterValue(attr: CharacterAttributeId, level: number): number {
  return getCharacterLevelConfig(attr, level)?.value ?? CHARACTER_CONFIGS[attr][0].value;
}

export function formatCharacterValue(attr: CharacterAttributeId, value: number): string {
  if (attr === 'strength') {
    return `${value}只`;
  }
  return String(value);
}

/** 升到下一级所需金币（下一级行的 price） */
export function getCharacterUpgradePrice(
  attr: CharacterAttributeId,
  currentLevel: number,
): number | null {
  const nextLevel = currentLevel + 1;
  const cfg = getCharacterLevelConfig(attr, nextLevel);
  return cfg?.price ?? null;
}
