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

  /** ui-overlay 坐标系下的回收目标点 */
  getFlyTarget(overlay: HTMLElement): { x: number; y: number } {
    const overlayRect = overlay.getBoundingClientRect();
    const barRect = this.container.getBoundingClientRect();
    return {
      x: barRect.left + barRect.width / 2 - overlayRect.left,
      y: barRect.top + barRect.height / 2 - overlayRect.top,
    };
  }

  pulseReceive(): void {
    this.container.classList.remove('gold-bar-receive');
    void this.container.offsetWidth;
    this.container.classList.add('gold-bar-receive');
    this.container.addEventListener(
      'animationend',
      () => this.container.classList.remove('gold-bar-receive'),
      { once: true },
    );
  }
}
