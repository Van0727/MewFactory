/** 玩家手里的小猫，无上限，可跨箱叠加。跟踪数量和累计价值。 */
export class HeldCats {
  private count = 0;
  private totalValue = 0;

  getCount(): number {
    return this.count;
  }

  getTotalValue(): number {
    return this.totalValue;
  }

  takeAll(): { count: number; value: number } {
    const result = { count: this.count, value: this.totalValue };
    this.count = 0;
    this.totalValue = 0;
    return result;
  }

  clear(): void {
    this.count = 0;
    this.totalValue = 0;
  }

  add(count: number, value = 0): void {
    if (count > 0) {
      this.count += count;
      this.totalValue += value;
    }
  }
}
