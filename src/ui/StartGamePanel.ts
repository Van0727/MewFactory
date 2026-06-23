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
    btn.className = 'action-btn start-game-btn';
    btn.textContent = '开始游戏';
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
