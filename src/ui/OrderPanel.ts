import { formatCompactNumber, ORDER_COMPLETE_FX_DURATION } from '../config';
import type { Order } from '../data/orders';
import { getOrderMaxRubyReward, formatOrderRequirement, orderPreviewEntry } from '../data/orders';
import { getRubyUrl } from '../render/assets';
import { drawHeldCatEntryFit } from '../render/heldCatDraw';

const CAT_PREVIEW_WIDTH = 96;
const CAT_PREVIEW_HEIGHT = 112;

export class OrderPanel {
  private el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private reqEl: HTMLElement;
  private rewardNumEl: HTMLElement;
  private quantityProgressEl: HTMLElement;

  constructor(overlay: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'order-panel-root is-hidden';
    this.el.innerHTML = `
      <div class="order-panel__quantity-header">
        <span class="order-panel__title">订单</span>
        <span class="order-panel__progress"></span>
      </div>
      <div class="order-panel tutorial-panel">
        <div class="tutorial-panel__frame">
          <div class="tutorial-panel__bubble order-panel__bubble">
            <div class="order-panel__cat-wrap" aria-hidden="true">
              <canvas class="order-panel__cat-canvas" width="${CAT_PREVIEW_WIDTH}" height="${CAT_PREVIEW_HEIGHT}"></canvas>
            </div>
            <div class="order-panel__content">
              <p class="order-panel__row order-panel__req"></p>
              <p class="order-panel__row order-panel__reward">
                <span class="order-panel__reward-num"></span>
                <img class="order-panel__ruby-icon" alt="" />
              </p>
            </div>
          </div>
        </div>
        <div class="tutorial-panel__tail" aria-hidden="true">
          <span class="tutorial-panel__tail-fill"></span>
        </div>
      </div>
    `;
    this.canvas = this.el.querySelector('.order-panel__cat-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.quantityProgressEl = this.el.querySelector('.order-panel__progress')!;
    this.reqEl = this.el.querySelector('.order-panel__req')!;
    this.rewardNumEl = this.el.querySelector('.order-panel__reward-num')!;
    const rubyIcon = this.el.querySelector('.order-panel__ruby-icon') as HTMLImageElement;
    rubyIcon.src = getRubyUrl();
    overlay.appendChild(this.el);
  }

  show(order: Order): void {
    this.update(order);
    this.el.classList.remove('is-hidden');
    this.el.classList.remove('is-updating');
    void this.el.offsetWidth;
    this.el.classList.add('is-updating');
  }

  hide(): void {
    this.el.classList.add('is-hidden');
    this.el.classList.remove('is-updating');
    this.el.classList.remove('is-player-occluded');
  }

  refresh(order: Order | null): void {
    if (!order) {
      this.hide();
      return;
    }
    if (this.el.classList.contains('is-hidden')) {
      this.show(order);
      return;
    }
    this.update(order);
  }

  updatePlayerOcclusion(playerClientX: number, playerClientY: number): void {
    if (this.el.classList.contains('is-hidden') || this.el.classList.contains('is-complete')) {
      return;
    }

    const rect = this.el.getBoundingClientRect();
    const margin = 28;
    const overlaps =
      playerClientX >= rect.left - margin &&
      playerClientX <= rect.right + margin &&
      playerClientY >= rect.top - margin &&
      playerClientY <= rect.bottom + margin;
    this.el.classList.toggle('is-player-occluded', overlaps);
  }

  /** 订单完成特效播放中（避免 syncOrderPanel 打断动画） */
  isCompleteFxActive(): boolean {
    return this.el.classList.contains('is-complete');
  }

  /** overlay 本地坐标，用于红宝石飞入动画起点 */
  getFlySource(overlay: HTMLElement): { x: number; y: number } {
    const overlayRect = overlay.getBoundingClientRect();
    const bubble = this.el.querySelector('.order-panel__bubble') as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - overlayRect.left,
      y: rect.top + rect.height / 2 - overlayRect.top,
    };
  }

  /** 订单完成：播放面板特效后回调（用于飞宝石） */
  playCompleteEffect(order: Order, onDone: () => void): void {
    this.update(order);
    this.el.classList.remove('is-hidden');
    this.el.classList.remove('is-updating');
    this.el.classList.add('is-complete');
    window.setTimeout(() => {
      this.el.classList.remove('is-complete');
      this.hide();
      onDone();
    }, ORDER_COMPLETE_FX_DURATION * 1000);
  }

  private update(order: Order): void {
    this.quantityProgressEl.textContent = `${order.delivered}/${order.quantity}`;
    this.reqEl.textContent = formatOrderRequirement(order);
    this.rewardNumEl.textContent = formatCompactNumber(getOrderMaxRubyReward(order));
    this.drawPreview(order);
  }

  private drawPreview(order: Order): void {
    this.ctx.clearRect(0, 0, CAT_PREVIEW_WIDTH, CAT_PREVIEW_HEIGHT);
    drawHeldCatEntryFit(
      this.ctx,
      orderPreviewEntry(order),
      CAT_PREVIEW_WIDTH,
      CAT_PREVIEW_HEIGHT,
    );
  }
}
