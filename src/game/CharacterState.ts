import { PLAYER_SPEED } from '../config';
import {
  type CharacterAttributeId,
  getCharacterMaxLevel,
  getCharacterUpgradePrice,
  getCharacterValue,
} from '../data/character';

const MOVE_SPEED_REFERENCE = 100;

export class CharacterState {
  private levels: Record<CharacterAttributeId, number> = {
    moveSpeed: 1,
    strength: 1,
  };

  getLevel(attr: CharacterAttributeId): number {
    return this.levels[attr];
  }

  getMoveSpeed(): number {
    const tableValue = getCharacterValue('moveSpeed', this.levels.moveSpeed);
    return tableValue * (PLAYER_SPEED / MOVE_SPEED_REFERENCE);
  }

  getCarryLimit(): number {
    return getCharacterValue('strength', this.levels.strength);
  }

  canUpgrade(attr: CharacterAttributeId): boolean {
    return this.levels[attr] < getCharacterMaxLevel(attr);
  }

  getUpgradePrice(attr: CharacterAttributeId): number | null {
    if (!this.canUpgrade(attr)) {
      return null;
    }
    return getCharacterUpgradePrice(attr, this.levels[attr]);
  }

  getCurrentValue(attr: CharacterAttributeId): number {
    return getCharacterValue(attr, this.levels[attr]);
  }

  getNextLevelValue(attr: CharacterAttributeId): number | null {
    if (!this.canUpgrade(attr)) {
      return null;
    }
    return getCharacterValue(attr, this.levels[attr] + 1);
  }

  upgrade(attr: CharacterAttributeId): void {
    if (!this.canUpgrade(attr)) {
      return;
    }
    this.levels[attr] += 1;
  }
}
