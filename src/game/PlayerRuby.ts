export class PlayerRuby {
  private ruby = 0;

  getAmount(): number {
    return this.ruby;
  }

  add(amount: number): void {
    if (amount > 0) {
      this.ruby += amount;
    }
  }

  spend(amount: number): boolean {
    if (amount <= 0 || this.ruby < amount) {
      return false;
    }
    this.ruby -= amount;
    return true;
  }

  setAmount(amount: number): void {
    this.ruby = Math.max(0, amount);
  }
}
