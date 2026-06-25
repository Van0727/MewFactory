import {
  GOLD_SELL_COIN_COUNT,
  GOLD_SELL_FLY_DURATION,
  GOLD_SELL_POP_DURATION,
} from '../config';
import { gridCellToOverlayPoint } from '../render/overlayCoords';
import { overlayUiScale } from './uiScale';
import type { GoldBar } from './GoldBar';

interface CoinParticle {
  el: HTMLElement;
  angle: number;
  popDist: number;
}

interface ActiveSellFx {
  amount: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  phase: 'pop' | 'fly';
  labelEl: HTMLElement;
  coins: CoinParticle[];
  uiScale: number;
  onComplete: () => void;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function easeInCubic(t: number): number {
  return t * t * t;
}

export class GoldSellFx {
  private canvas: HTMLCanvasElement;
  private overlay: HTMLElement;
  private goldBar: GoldBar;
  private layer: HTMLElement;
  private active: ActiveSellFx | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    overlay: HTMLElement,
    goldBar: GoldBar,
  ) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.goldBar = goldBar;

    this.layer = document.createElement('div');
    this.layer.className = 'gold-sell-fx-layer';
    this.overlay.appendChild(this.layer);
  }

  play(gx: number, gy: number, amount: number, onComplete: () => void): void {
    if (this.active) {
      this.finishActive();
    }

    const start = gridCellToOverlayPoint(this.canvas, this.overlay, gx, gy);
    const target = this.goldBar.getFlyTarget(this.overlay);
    const overlayRect = this.overlay.getBoundingClientRect();
    const uiScale = overlayUiScale(overlayRect.width);

    const labelEl = document.createElement('div');
    labelEl.className = 'gold-sell-label';
    labelEl.textContent = `+${amount}`;
    this.layer.appendChild(labelEl);

    const coins: CoinParticle[] = [];
    for (let i = 0; i < GOLD_SELL_COIN_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'gold-sell-coin';
      this.layer.appendChild(el);
      coins.push({
        el,
        angle: (Math.PI * 2 * i) / GOLD_SELL_COIN_COUNT + Math.random() * 0.4,
        popDist: (28 + Math.random() * 22) * uiScale,
      });
    }

    this.active = {
      amount,
      startX: start.x,
      startY: start.y,
      targetX: target.x,
      targetY: target.y,
      elapsed: 0,
      phase: 'pop',
      labelEl,
      coins,
      uiScale,
      onComplete,
    };
  }

  update(dt: number): void {
    if (!this.active) {
      return;
    }

    const fx = this.active;
    const s = fx.uiScale;
    fx.elapsed += dt;

    if (fx.phase === 'pop') {
      const t = Math.min(1, fx.elapsed / GOLD_SELL_POP_DURATION);
      const scale = t < 1 ? easeOutBack(t) * 1.35 : 1.35;
      const popT = Math.min(1, t * 1.2);
      const labelY = fx.startY - 18 * s * easeOutBack(Math.min(1, t * 1.5));

      fx.labelEl.style.left = `${fx.startX}px`;
      fx.labelEl.style.top = `${labelY}px`;
      fx.labelEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
      fx.labelEl.style.opacity = '1';

      for (const coin of fx.coins) {
        const dist = coin.popDist * popT;
        const x = fx.startX + Math.cos(coin.angle) * dist;
        const y = fx.startY + Math.sin(coin.angle) * dist - 12 * s * popT;
        coin.el.style.left = `${x}px`;
        coin.el.style.top = `${y}px`;
        coin.el.style.opacity = String(0.4 + popT * 0.6);
        coin.el.style.transform = `translate(-50%, -50%) scale(${0.6 + popT * 0.6})`;
      }

      if (t >= 1) {
        fx.phase = 'fly';
        fx.elapsed = 0;
      }
      return;
    }

    const t = Math.min(1, fx.elapsed / GOLD_SELL_FLY_DURATION);
    const eased = easeInCubic(t);
    const x = fx.startX + (fx.targetX - fx.startX) * eased;
    const y = fx.startY - 18 * s + (fx.targetY - (fx.startY - 18 * s)) * eased;
    const scale = 1.35 - eased * 0.55;
    const opacity = 1 - eased * 0.85;

    fx.labelEl.style.left = `${x}px`;
    fx.labelEl.style.top = `${y}px`;
    fx.labelEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
    fx.labelEl.style.opacity = String(opacity);

    for (const coin of fx.coins) {
      coin.el.style.left = `${x + Math.cos(coin.angle) * (1 - eased) * 12 * s}px`;
      coin.el.style.top = `${y + Math.sin(coin.angle) * (1 - eased) * 12 * s}px`;
      coin.el.style.opacity = String(opacity);
      coin.el.style.transform = `translate(-50%, -50%) scale(${0.5 + (1 - eased) * 0.4})`;
    }

    if (t >= 1) {
      this.finishActive();
    }
  }

  private finishActive(): void {
    if (!this.active) {
      return;
    }
    this.active.labelEl.remove();
    for (const coin of this.active.coins) {
      coin.el.remove();
    }
    const done = this.active.onComplete;
    this.active = null;
    done();
  }
}
