export class TutorialPanel {
  private el: HTMLElement;
  private stepEl: HTMLElement;
  private hintEl: HTMLElement;

  constructor(overlay: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'tutorial-panel is-hidden';
    this.el.innerHTML = `
      <div class="tutorial-panel__frame">
        <div class="tutorial-panel__bubble">
          <div class="tutorial-panel__step" aria-hidden="true">
            <span class="tutorial-panel__step-num"></span>
          </div>
          <p class="tutorial-panel__hint"></p>
        </div>
      </div>
      <div class="tutorial-panel__tail" aria-hidden="true">
        <span class="tutorial-panel__tail-fill"></span>
      </div>
    `;
    this.stepEl = this.el.querySelector('.tutorial-panel__step-num')!;
    this.hintEl = this.el.querySelector('.tutorial-panel__hint')!;
    overlay.appendChild(this.el);
  }

  show(step: number, hint: string): void {
    this.stepEl.textContent = String(step);
    this.hintEl.textContent = hint;
    this.el.classList.remove('is-hidden');
    this.el.classList.remove('is-updating');
    void this.el.offsetWidth;
    this.el.classList.add('is-updating');
  }

  hide(): void {
    this.el.classList.add('is-hidden');
    this.el.classList.remove('is-updating');
    this.stepEl.textContent = '';
    this.hintEl.textContent = '';
  }
}
