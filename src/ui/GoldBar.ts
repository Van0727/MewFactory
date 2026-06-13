import type { PlayerGold } from '../game/PlayerGold';

export class GoldBar {
  private container: HTMLElement;
  private valueEl: HTMLElement;
  private gold: PlayerGold;

  constructor(container: HTMLElement, gold: PlayerGold) {
    this.container = container;
    this.gold = gold;
    this.container.innerHTML = '';
    this.container.className = 'gold-bar';

    const label = document.createElement('span');
    label.className = 'gold-bar-label';
    label.textContent = '金币';
    this.container.appendChild(label);

    this.valueEl = document.createElement('span');
    this.valueEl.className = 'gold-bar-value';
    this.container.appendChild(this.valueEl);

    this.refresh();
  }

  refresh(): void {
    this.valueEl.textContent = String(this.gold.getAmount());
  }
}
