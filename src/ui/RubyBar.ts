import { formatCompactNumber } from '../config';
import type { PlayerRuby } from '../game/PlayerRuby';
import { getRubyUrl } from '../render/assets';

export class RubyBar {
  private container: HTMLElement;
  private valueEl: HTMLElement;
  private ruby: PlayerRuby;

  constructor(container: HTMLElement, ruby: PlayerRuby) {
    this.container = container;
    this.ruby = ruby;
    this.container.innerHTML = '';
    this.container.className = 'ruby-bar';

    const icon = document.createElement('img');
    icon.className = 'ruby-bar-icon';
    icon.src = getRubyUrl();
    icon.alt = '';
    this.container.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'ruby-bar-label';
    label.textContent = '红宝石';
    this.container.appendChild(label);

    this.valueEl = document.createElement('span');
    this.valueEl.className = 'ruby-bar-value';
    this.container.appendChild(this.valueEl);

    this.refresh();
  }

  refresh(): void {
    this.valueEl.textContent = formatCompactNumber(this.ruby.getAmount());
  }

  pulseReceive(): void {
    this.container.classList.remove('ruby-bar-receive');
    void this.container.offsetWidth;
    this.container.classList.add('ruby-bar-receive');
    this.container.addEventListener(
      'animationend',
      () => this.container.classList.remove('ruby-bar-receive'),
      { once: true },
    );
  }
}
