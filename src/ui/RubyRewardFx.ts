import {
  GOLD_SELL_FLY_DURATION,
  GOLD_SELL_POP_DURATION,
  formatCompactNumber,
} from '../config';
import { getRubyUrl } from '../render/assets';
import { overlayUiScale } from './uiScale';
import type { RubyBar } from './RubyBar';

interface RubyParticle {
  el: HTMLElement;
  angle: number;
  popDist: number;
  popX: number;
  popY: number;
}

interface ActiveRubyFx {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  phase: 'pop' | 'fly';
  labelEl: HTMLElement;
  rubies: RubyParticle[];
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

function getRubyParticleCount(amount: number): number {
  if (amount <= 0) {
    return 0;
  }
  return Math.min(12, Math.max(4, Math.ceil(amount / 4)));
}

export class RubyRewardFx {
  private overlay: HTMLElement;
  private rubyBar: RubyBar;
  private layer: HTMLElement;
  private active: ActiveRubyFx | null = null;

  constructor(overlay: HTMLElement, rubyBar: RubyBar) {
    this.overlay = overlay;
    this.rubyBar = rubyBar;

    this.layer = document.createElement('div');
    this.layer.className = 'ruby-reward-fx-layer';
    this.overlay.appendChild(this.layer);
  }

  /** overlay 本地坐标 */
  play(
    startX: number,
    startY: number,
    amount: number,
    onComplete: () => void,
    particleCount = getRubyParticleCount(amount),
  ): void {
    if (this.active) {
      this.finishActive();
    }

    const target = this.rubyBar.getFlyTarget(this.overlay);
    const overlayRect = this.overlay.getBoundingClientRect();
    const uiScale = overlayUiScale(overlayRect.width);

    const labelEl = document.createElement('div');
    labelEl.className = 'ruby-reward-label';
    labelEl.textContent = `+${formatCompactNumber(amount)}`;
    this.layer.appendChild(labelEl);

    const rubies: RubyParticle[] = [];
    const rubyUrl = getRubyUrl();
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');
      el.className = 'ruby-reward-gem';
      el.style.backgroundImage = `url(${rubyUrl})`;
      this.layer.appendChild(el);
      rubies.push({
        el,
        angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.5,
        popDist: (36 + Math.random() * 28) * uiScale,
        popX: startX,
        popY: startY,
      });
    }

    this.active = {
      startX,
      startY,
      targetX: target.x,
      targetY: target.y,
      elapsed: 0,
      phase: 'pop',
      labelEl,
      rubies,
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

      for (const ruby of fx.rubies) {
        const dist = ruby.popDist * popT;
        const x = fx.startX + Math.cos(ruby.angle) * dist;
        const y = fx.startY + Math.sin(ruby.angle) * dist - 14 * s * popT;
        ruby.popX = x;
        ruby.popY = y;
        ruby.el.style.left = `${x}px`;
        ruby.el.style.top = `${y}px`;
        ruby.el.style.opacity = String(0.5 + popT * 0.5);
        ruby.el.style.transform = `translate(-50%, -50%) scale(${0.55 + popT * 0.75})`;
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

    const rubyCount = fx.rubies.length;
    for (let i = 0; i < rubyCount; i++) {
      const ruby = fx.rubies[i];
      const stagger = (i / rubyCount) * 0.18;
      const rubyT = Math.min(1, Math.max(0, (t - stagger) / (1 - stagger * 0.5)));
      const rubyEased = easeInCubic(rubyT);
      const cx = ruby.popX + (fx.targetX - ruby.popX) * rubyEased;
      const cy = ruby.popY + (fx.targetY - ruby.popY) * rubyEased;
      const rubyScale = 1.3 - rubyEased * 0.75;
      const rubyOpacity = 1 - rubyEased * 0.9;
      ruby.el.style.left = `${cx}px`;
      ruby.el.style.top = `${cy}px`;
      ruby.el.style.opacity = String(rubyOpacity);
      ruby.el.style.transform = `translate(-50%, -50%) scale(${rubyScale})`;
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
    for (const ruby of this.active.rubies) {
      ruby.el.remove();
    }
    const done = this.active.onComplete;
    this.active = null;
    done();
  }
}
