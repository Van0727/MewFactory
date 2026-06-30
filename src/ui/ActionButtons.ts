import type { Player } from '../game/Player';
import { gridCellToOverlayPoint } from '../render/overlayCoords';

export type ActionType = 'place' | 'rotate' | 'pickup';

export interface PlaceModeOptions {
  rotateEnabled: boolean;
  hint: string;
}

export class ActionButtons {
  private container: HTMLElement;
  private overlay: HTMLElement;
  private gameCanvas: HTMLCanvasElement;
  private hintEl: HTMLElement;
  private btnRow: HTMLElement;
  private placeBtn: HTMLButtonElement;
  private rotateBtn: HTMLButtonElement;
  private pickupBtn: HTMLButtonElement;
  private listeners: Array<(action: ActionType) => void> = [];

  constructor(
    container: HTMLElement,
    overlay: HTMLElement,
    gameCanvas: HTMLCanvasElement,
  ) {
    this.container = container;
    this.overlay = overlay;
    this.gameCanvas = gameCanvas;
    this.container.innerHTML = '';

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'place-hint place-hint-at-feet';
    this.overlay.appendChild(this.hintEl);

    this.btnRow = document.createElement('div');
    this.btnRow.className = 'action-btn-row';
    this.container.appendChild(this.btnRow);

    this.placeBtn = this.createButton('放下 (E)', 'place');
    this.rotateBtn = this.createButton('旋转 (R)', 'rotate', 'action-btn-rotate');
    this.pickupBtn = this.createButton('拿起 (E)', 'pickup');

    this.btnRow.appendChild(this.placeBtn);
    this.btnRow.appendChild(this.rotateBtn);
    this.btnRow.appendChild(this.pickupBtn);

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

  hideAll(): void {
    this.hintEl.style.display = 'none';
    this.placeBtn.style.display = 'none';
    this.rotateBtn.style.display = 'none';
    this.pickupBtn.style.display = 'none';
    this.container.style.display = 'none';
  }

  updatePlaceHintPosition(player: Player): void {
    if (this.hintEl.style.display === 'none') {
      return;
    }
    const point = gridCellToOverlayPoint(
      this.gameCanvas,
      this.overlay,
      player.x,
      player.y,
    );
    this.hintEl.style.left = `${point.x}px`;
    this.hintEl.style.top = `${point.y}px`;
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
