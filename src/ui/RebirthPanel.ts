import type { PlayerGold } from '../game/PlayerGold';
import { formatCompactNumber } from '../config';
import { formatGoldMultiplier, type RebirthState } from '../game/RebirthState';

export class RebirthPanel {
  private container: HTMLElement;
  private rebirthState: RebirthState;
  private playerGold: PlayerGold;
  private priceEl: HTMLElement;
  private multiplierEl: HTMLElement;
  private rebirthBtn: HTMLButtonElement;
  private onRebirth: () => void;

  constructor(
    container: HTMLElement,
    rebirthState: RebirthState,
    playerGold: PlayerGold,
    onRebirth: () => void,
  ) {
    this.container = container;
    this.rebirthState = rebirthState;
    this.playerGold = playerGold;
    this.onRebirth = onRebirth;
    this.container.innerHTML = '';
    this.container.className = 'rebirth-panel';

    const title = document.createElement('div');
    title.className = 'rebirth-title';
    title.textContent = '重生';
    this.container.appendChild(title);

    this.priceEl = document.createElement('div');
    this.priceEl.className = 'rebirth-price';
    this.container.appendChild(this.priceEl);

    this.multiplierEl = document.createElement('div');
    this.multiplierEl.className = 'rebirth-multiplier';
    this.container.appendChild(this.multiplierEl);

    this.rebirthBtn = document.createElement('button');
    this.rebirthBtn.type = 'button';
    this.rebirthBtn.className = 'rebirth-btn';
    this.rebirthBtn.textContent = '重生';
    this.rebirthBtn.addEventListener('click', () => {
      if (this.rebirthBtn.disabled) {
        return;
      }
      this.onRebirth();
    });
    this.container.appendChild(this.rebirthBtn);

    this.refresh();
  }

  refresh(): void {
    const cost = this.rebirthState.getRebirthCost();
    const current = this.rebirthState.getGoldMultiplier();
    const next = this.rebirthState.getNextGoldMultiplier();
    const canAfford = this.playerGold.getAmount() >= cost;

    this.priceEl.textContent = `价格：${formatCompactNumber(cost)}`;
    this.multiplierEl.textContent = `倍率：${formatGoldMultiplier(current)} → ${formatGoldMultiplier(next)}`;
    this.rebirthBtn.disabled = !canAfford;
    this.rebirthBtn.classList.toggle('is-affordable', canAfford);
  }
}
