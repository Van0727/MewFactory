import {
  ORDER_NEXT_DELAY_SECONDS,
  ORDER_TUTORIAL_DELAY_SECONDS,
} from '../config';
import { generateFixedOrder, generateOrder, getOrderRubyReward, type Order, type OrderUnlockContext } from '../data/orders';

export type OrderManagerListener = () => void;
export type OrderUnlockContextProvider = () => OrderUnlockContext;

type OrderPhase = 'idle' | 'waiting_first' | 'active' | 'waiting_next';

export class OrderManager {
  private phase: OrderPhase = 'idle';
  private delayRemaining = 0;
  private order: Order | null = null;
  private rebirthCount = 0;
  private completedOrderCount = 0;
  private listener: OrderManagerListener | null = null;
  private unlockContextProvider: OrderUnlockContextProvider | null = null;

  setListener(listener: OrderManagerListener | null): void {
    this.listener = listener;
  }

  setUnlockContextProvider(provider: OrderUnlockContextProvider | null): void {
    this.unlockContextProvider = provider;
  }

  reset(): void {
    this.phase = 'idle';
    this.delayRemaining = 0;
    this.order = null;
    this.completedOrderCount = 0;
    this.notify();
  }

  scheduleFirstOrder(delaySeconds = ORDER_TUTORIAL_DELAY_SECONDS): void {
    this.phase = 'waiting_first';
    this.delayRemaining = delaySeconds;
    this.order = null;
    this.notify();
  }

  setRebirthCount(count: number): void {
    this.rebirthCount = Math.max(0, count);
  }

  update(dt: number): void {
    if (this.phase !== 'waiting_first' && this.phase !== 'waiting_next') {
      return;
    }

    this.delayRemaining -= dt;
    if (this.delayRemaining > 0) {
      return;
    }

    const unlock = this.unlockContextProvider?.() ?? {
      ownedCatNestLevels: new Set([1]),
      ownedGateLevels: new Set<number>(),
    };
    const fixed = generateFixedOrder(this.completedOrderCount, this.rebirthCount);
    this.order =
      fixed ?? generateOrder(this.rebirthCount, unlock);
    this.phase = 'active';
    this.delayRemaining = 0;
    this.notify();
  }

  hasActiveOrder(): boolean {
    return this.phase === 'active' && this.order !== null;
  }

  isPanelVisible(): boolean {
    return this.phase === 'active' && this.order !== null;
  }

  getOrder(): Order | null {
    return this.order;
  }

  getRemainingNeeded(): number {
    if (!this.order) {
      return 0;
    }
    return Math.max(0, this.order.quantity - this.order.delivered);
  }

  /** 交付匹配的猫，返回本次交付数量；完成时返回奖励红宝石数，否则 0 */
  deliver(count: number): { delivered: number; rubyReward: number } {
    if (!this.order || this.phase !== 'active' || count <= 0) {
      return { delivered: 0, rubyReward: 0 };
    }

    const needed = this.getRemainingNeeded();
    const deliveredNow = Math.min(count, needed);
    this.order.delivered += deliveredNow;

    if (this.order.delivered < this.order.quantity) {
      this.notify();
      return { delivered: deliveredNow, rubyReward: 0 };
    }

    const rubyReward = getOrderRubyReward(this.order);
    this.order = null;
    this.completedOrderCount += 1;
    this.phase = 'waiting_next';
    this.delayRemaining = ORDER_NEXT_DELAY_SECONDS;
    this.notify();
    return { delivered: deliveredNow, rubyReward };
  }

  private notify(): void {
    this.listener?.();
  }
}
