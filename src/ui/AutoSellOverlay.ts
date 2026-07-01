export class AutoSellOverlay {
  private el: HTMLElement;
  private titleEl: HTMLElement;
  private hintEl: HTMLElement;

  constructor(overlay: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'auto-sell-overlay is-hidden';
    this.el.innerHTML = `
      <p class="auto-sell-overlay-title"></p>
      <p class="auto-sell-overlay-hint"></p>
    `;
    this.titleEl = this.el.querySelector('.auto-sell-overlay-title')!;
    this.hintEl = this.el.querySelector('.auto-sell-overlay-hint')!;
    this.titleEl.textContent = '自动出售中。。。。。。';
    this.hintEl.textContent = '移动取消';
    overlay.appendChild(this.el);
  }

  show(): void {
    this.el.classList.remove('is-hidden');
  }

  hide(): void {
    this.el.classList.add('is-hidden');
  }
}
