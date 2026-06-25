export interface HeldCatEntry {
  nestLevel: number;
  value: number;
}

/** 玩家手里的小猫，无上限，可跨箱叠加。按只记录品种与价值。 */
export class HeldCats {
  private stack: HeldCatEntry[] = [];

  getCount(): number {
    return this.stack.length;
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

  addEntries(entries: HeldCatEntry[]): void {
    if (entries.length > 0) {
      this.stack.push(...entries);
    }
  }
}
