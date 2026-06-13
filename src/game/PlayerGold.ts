export class PlayerGold {
  private gold = 0;

  getAmount(): number {
    return this.gold;
  }

  add(amount: number): void {
    if (amount > 0) {
      this.gold += amount;
    }
  }
}
