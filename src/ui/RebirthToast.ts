import { REBIRTH_TOAST_DURATION } from '../config';
import { formatGoldMultiplier } from '../game/RebirthState';

export class RebirthToast {
  private el: HTMLElement;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(overlay: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'rebirth-toast';
    overlay.appendChild(this.el);
  }

  show(multiplier: number): void {
    this.el.textContent = `倍率提升至 ${formatGoldMultiplier(multiplier)}`;
    this.el.classList.add('is-visible');

    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => {
      this.el.classList.remove('is-visible');
      this.hideTimer = null;
    }, REBIRTH_TOAST_DURATION * 1000);
  }
}
