/** 玩家手里的小猫，无上限，可跨箱叠加 */
export class HeldCats {
  private count = 0;

  getCount(): number {
    return this.count;
  }

  takeAll(): number {
    const count = this.count;
    this.count = 0;
    return count;
  }

  clear(): void {
    this.count = 0;
  }

  add(count: number): void {
    if (count > 0) {
      this.count += count;
    }
  }
}
