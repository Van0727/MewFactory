export class TutorialPanel {
  private el: HTMLElement;

  constructor(overlay: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'tutorial-panel is-hidden';
    overlay.appendChild(this.el);
  }

  show(hint: string): void {
    this.el.textContent = hint;
    this.el.classList.remove('is-hidden');
  }

  setHint(hint: string): void {
    if (this.el.classList.contains('is-hidden')) {
      return;
    }
    this.el.textContent = hint;
  }

  hide(): void {
    this.el.classList.add('is-hidden');
    this.el.textContent = '';
  }
}
