export interface HeldCatDisplayState {
  nestLevel: number;
  inflateStacks: number;
  barbecueStacks: number;
  flipCount: number;
}

export interface HeldCatEntry {
  nestLevel: number;
  value: number;
  /** 拾取后以包装箱首只猫的展示形态绘制 */
  display?: HeldCatDisplayState;
}

export function getHeldCatDisplayState(entry: HeldCatEntry): HeldCatDisplayState {
  return entry.display ?? {
    nestLevel: entry.nestLevel,
    inflateStacks: 0,
    barbecueStacks: 0,
    flipCount: 0,
  };
}

/** 玩家手里的小猫，受力量属性限制单次拿取上限。 */
export class HeldCats {
  private stack: HeldCatEntry[] = [];
  private maxCount = Number.POSITIVE_INFINITY;

  setMaxCount(maxCount: number): void {
    this.maxCount = Math.max(1, maxCount);
  }

  getMaxCount(): number {
    return this.maxCount;
  }

  getCount(): number {
    return this.stack.length;
  }

  getRemainingSpace(): number {
    if (!Number.isFinite(this.maxCount)) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(0, this.maxCount - this.stack.length);
  }

  getTotalValue(): number {
    return this.stack.reduce((sum, entry) => sum + entry.value, 0);
  }

  getStack(): readonly HeldCatEntry[] {
    return this.stack;
  }

  getTopEntry(): HeldCatEntry | null {
    return this.stack.at(-1) ?? null;
  }

  takeAll(): { count: number; value: number } {
    const count = this.stack.length;
    const value = this.getTotalValue();
    this.stack = [];
    return { count, value };
  }

  clear(): void {
    this.stack = [];
  }

  addEntries(entries: HeldCatEntry[]): number {
    const space = this.getRemainingSpace();
    if (space <= 0 || entries.length === 0) {
      return 0;
    }
    const takeCount =
      Number.isFinite(space) ? Math.min(entries.length, space) : entries.length;
    if (takeCount <= 0) {
      return 0;
    }
    this.stack.push(...entries.slice(0, takeCount));
    return takeCount;
  }
}
