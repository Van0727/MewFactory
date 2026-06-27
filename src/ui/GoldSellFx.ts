import {
  GOLD_SELL_FLY_DURATION,
  GOLD_SELL_POP_DURATION,
  getGoldSellCoinCount,
} from '../config';
import { getGoldChickUrl } from '../render/assets';
import { gridCellToOverlayPoint } from '../render/overlayCoords';
import { overlayUiScale } from './uiScale';
import type { GoldBar } from './GoldBar';

interface CoinParticle {
  el: HTMLElement;
  angle: number;
  popDist: number;
  popX: number;
  popY: number;
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

  play(
    gx: number,
    gy: number,
    amount: number,
    onComplete: () => void,
    coinCount = getGoldSellCoinCount(1),
  ): void {
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
    const coinUrl = getGoldChickUrl();
    for (let i = 0; i < coinCount; i++) {
      const el = document.createElement('div');
      el.className = 'gold-sell-coin';
      el.style.backgroundImage = `url(${coinUrl})`;
      this.layer.appendChild(el);
      coins.push({
        el,
        angle: (Math.PI * 2 * i) / coinCount + Math.random() * 0.5,
        popDist: (42 + Math.random() * 36) * uiScale,
        popX: start.x,
        popY: start.y,
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
        const y = fx.startY + Math.sin(coin.angle) * dist - 16 * s * popT;
        coin.popX = x;
        coin.popY = y;
        coin.el.style.left = `${x}px`;
        coin.el.style.top = `${y}px`;
        coin.el.style.opacity = String(0.5 + popT * 0.5);
        coin.el.style.transform = `translate(-50%, -50%) scale(${0.55 + popT * 0.75})`;
      }

      if (t >= 1) {
        fx.phase = 'fly';
        fx.elapsed = 0;
      }
      return;
    }

    const t = Math.min(1, fx.elapsed / GOLD_SELL_FLY_DURATION);
    const eased = easeInCubic(t);
    const labelY0 = fx.startY - 18 * s;
    const x = fx.startX + (fx.targetX - fx.startX) * eased;
    const y = labelY0 + (fx.targetY - labelY0) * eased;
    const scale = 1.35 - eased * 0.55;
    const opacity = 1 - eased * 0.85;

    fx.labelEl.style.left = `${x}px`;
    fx.labelEl.style.top = `${y}px`;
    fx.labelEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
    fx.labelEl.style.opacity = String(opacity);

    const coinCount = fx.coins.length;
    for (let i = 0; i < coinCount; i++) {
      const coin = fx.coins[i];
      const stagger = (i / coinCount) * 0.18;
      const coinT = Math.min(1, Math.max(0, (t - stagger) / (1 - stagger * 0.5)));
      const coinEased = easeInCubic(coinT);
      const cx = coin.popX + (fx.targetX - coin.popX) * coinEased;
      const cy = coin.popY + (fx.targetY - coin.popY) * coinEased;
      const coinScale = 1.3 - coinEased * 0.75;
      const coinOpacity = 1 - coinEased * 0.9;
      coin.el.style.left = `${cx}px`;
      coin.el.style.top = `${cy}px`;
      coin.el.style.opacity = String(coinOpacity);
      coin.el.style.transform = `translate(-50%, -50%) scale(${coinScale})`;
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
