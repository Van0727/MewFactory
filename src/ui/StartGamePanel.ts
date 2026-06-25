import { getStartButtonUrl } from '../render/assets';

export class StartGamePanel {
  private container: HTMLElement;
  private onStart: () => void;

  constructor(container: HTMLElement, onStart: () => void) {
    this.container = container;
    this.onStart = onStart;
    this.container.innerHTML = '';
    this.container.className = 'start-game-panel';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'start-game-btn';
    btn.setAttribute('aria-label', 'start');

    const img = document.createElement('img');
    img.className = 'start-game-btn-img';
    img.src = getStartButtonUrl();
    img.alt = 'start';
    btn.appendChild(img);

    btn.addEventListener('click', () => {
      this.onStart();
    });
    this.container.appendChild(btn);
  }

  hide(): void {
    this.container.classList.add('is-hidden');
  }

  show(): void {
    this.container.classList.remove('is-hidden');
  }
}
