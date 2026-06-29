import {
  REBIRTH_BASE_COST,
  REBIRTH_COST_RATIO,
  REBIRTH_GOLD_MULTIPLIER_STEP,
  REBIRTH_INITIAL_GOLD_MULTIPLIER,
} from '../config';

export class RebirthState {
  private count = 0;

  getCount(): number {
    return this.count;
  }

  getGoldMultiplier(): number {
    return REBIRTH_INITIAL_GOLD_MULTIPLIER + this.count * REBIRTH_GOLD_MULTIPLIER_STEP;
  }

  getNextGoldMultiplier(): number {
    return (
      REBIRTH_INITIAL_GOLD_MULTIPLIER + (this.count + 1) * REBIRTH_GOLD_MULTIPLIER_STEP
    );
  }

  getRebirthCost(): number {
    return Math.round(REBIRTH_BASE_COST * Math.pow(REBIRTH_COST_RATIO, this.count));
  }

  performRebirth(): void {
    this.count += 1;
  }
}

export function formatGoldMultiplier(multiplier: number): string {
  const rounded = Math.round(multiplier * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}倍`;
}
