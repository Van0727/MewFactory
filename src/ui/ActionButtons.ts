export type ActionType = 'place' | 'rotate' | 'pickup' | 'bag';

export interface PlaceModeOptions {
  rotateEnabled: boolean;
  hint: string;
}

export class ActionButtons {
  private container: HTMLElement;
  private hintEl: HTMLElement;
  private btnRow: HTMLElement;
  private placeBtn: HTMLButtonElement;
  private rotateBtn: HTMLButtonElement;
  private pickupBtn: HTMLButtonElement;
  private bagBtn: HTMLButtonElement;
  private listeners: Array<(action: ActionType) => void> = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = '';

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'place-hint';
    this.container.appendChild(this.hintEl);

    this.btnRow = document.createElement('div');
    this.btnRow.className = 'action-btn-row';
    this.container.appendChild(this.btnRow);

    this.placeBtn = this.createButton('放下 (E)', 'place');
    this.rotateBtn = this.createButton('旋转 (R)', 'rotate', 'action-btn-rotate');
    this.pickupBtn = this.createButton('拿起 (E)', 'pickup');
    this.bagBtn = this.createButton('装袋 (Space)', 'bag', 'action-btn-bag');

    this.btnRow.appendChild(this.placeBtn);
    this.btnRow.appendChild(this.rotateBtn);
    this.btnRow.appendChild(this.pickupBtn);
    this.btnRow.appendChild(this.bagBtn);

    this.hideAll();
  }

  onAction(listener: (action: ActionType) => void): void {
    this.listeners.push(listener);
  }

  showPlaceMode(options: PlaceModeOptions): void {
    this.hintEl.textContent = options.hint;
    this.hintEl.style.display = '';
    this.placeBtn.style.display = '';
    this.rotateBtn.style.display = '';
    this.pickupBtn.style.display = 'none';
    this.setRotateEnabled(options.rotateEnabled);
    this.container.style.display = 'flex';
  }

  showPickupMode(): void {
    this.hintEl.style.display = 'none';
    this.placeBtn.style.display = 'none';
    this.rotateBtn.style.display = 'none';
    this.pickupBtn.style.display = '';
    this.container.style.display = 'flex';
  }

  setBagButton(visible: boolean, enabled: boolean): void {
    this.bagBtn.style.display = visible ? '' : 'none';
    this.bagBtn.disabled = !enabled;
    this.bagBtn.classList.toggle('is-greyed', visible && !enabled);
    if (visible) {
      this.container.style.display = 'flex';
    }
  }

  hideAll(): void {
    this.hintEl.style.display = 'none';
    this.placeBtn.style.display = 'none';
    this.rotateBtn.style.display = 'none';
    this.pickupBtn.style.display = 'none';
    this.bagBtn.style.display = 'none';
    this.bagBtn.disabled = true;
    this.bagBtn.classList.remove('is-greyed');
    this.container.style.display = 'none';
  }

  private setRotateEnabled(enabled: boolean): void {
    this.rotateBtn.disabled = !enabled;
    this.rotateBtn.classList.toggle('is-greyed', !enabled);
  }

  private createButton(
    label: string,
    action: ActionType,
    extraClass = '',
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = extraClass ? `action-btn ${extraClass}` : 'action-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (btn.disabled) {
        return;
      }
      for (const listener of this.listeners) {
        listener(action);
      }
    });
    return btn;
  }
}
