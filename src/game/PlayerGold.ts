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

  spend(amount: number): boolean {
    if (amount <= 0 || this.gold < amount) {
      return false;
    }
    this.gold -= amount;
    return true;
  }

  setAmount(amount: number): void {
    this.gold = Math.max(0, amount);
  }
}
