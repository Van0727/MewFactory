export interface HeldCatDisplayState {
  nestLevel: number;
  inflateStacks: number;
  danceStacks: number;
  barbecueStacks: number;
  flipCount: number;
}

export interface HeldCatEntry {
  nestLevel: number;
  value: number;
  /** 包装箱内相同形态猫堆叠数量 */
  count?: number;
  display?: HeldCatDisplayState;
}

export function heldCatDisplayFromState(state: HeldCatDisplayState): HeldCatDisplayState {
  return { ...state };
}

export function heldCatDisplayFromCat(cat: {
  nestLevel: number;
  mutations: {
    inflateStacks: number;
    danceStacks: number;
    barbecueStacks: number;
    flipCount: number;
  };
}): HeldCatDisplayState {
  return {
    nestLevel: cat.nestLevel,
    inflateStacks: cat.mutations.inflateStacks,
    danceStacks: cat.mutations.danceStacks,
    barbecueStacks: cat.mutations.barbecueStacks,
    flipCount: cat.mutations.flipCount,
  };
}

export function heldCatDisplaysEqual(
  a: HeldCatDisplayState,
  b: HeldCatDisplayState,
): boolean {
  return (
    a.nestLevel === b.nestLevel &&
    a.inflateStacks === b.inflateStacks &&
    a.danceStacks === b.danceStacks &&
    a.barbecueStacks === b.barbecueStacks &&
    a.flipCount === b.flipCount
  );
}

export function getHeldCatEntryCount(entry: HeldCatEntry): number {
  return entry.count ?? 1;
}

export function getHeldCatDisplayState(entry: HeldCatEntry): HeldCatDisplayState {
  return entry.display ?? {
    nestLevel: entry.nestLevel,
    inflateStacks: 0,
    danceStacks: 0,
    barbecueStacks: 0,
    flipCount: 0,
  };
}

/** 玩家手里的小猫，受举起数量属性限制单次拿取上限。 */
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

  takeMatching(
    predicate: (entry: HeldCatEntry) => boolean,
    maxCount: number,
  ): HeldCatEntry[] {
    if (maxCount <= 0 || this.stack.length === 0) {
      return [];
    }

    const taken: HeldCatEntry[] = [];
    const keep: HeldCatEntry[] = [];

    for (let i = this.stack.length - 1; i >= 0; i--) {
      const entry = this.stack[i];
      if (taken.length < maxCount && predicate(entry)) {
        taken.push(entry);
      } else {
        keep.push(entry);
      }
    }

    this.stack = keep.reverse();
    return taken;
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
