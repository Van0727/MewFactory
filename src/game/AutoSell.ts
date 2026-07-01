import { AUTO_SELL_INTERVAL } from '../config';
import { BuildingType } from './Building';
import { getSellShopCenter } from './gridCoords';
import type { Grid } from './Grid';
import type { Player } from './Player';
import type { Simulation } from './Simulation';

type AutoSellPhase = 'idle' | 'collecting' | 'selling';

export interface AutoSellDeps {
  player: Player;
  grid: Grid;
  simulation: Simulation;
  getMoveSpeed: () => number;
  collectFromBox: () => void;
  sellAllHeldCats: () => void;
}

/** 开启后每隔 AUTO_SELL_INTERVAL 秒自动走遍包装箱并出售；移动输入取消 */
export class AutoSell {
  private enabled = false;
  private phase: AutoSellPhase = 'idle';
  private intervalElapsed = 0;
  private boxQueue: Array<{ gx: number; gy: number }> = [];
  private currentTarget: { x: number; y: number } | null = null;
  private deps: AutoSellDeps;

  constructor(deps: AutoSellDeps) {
    this.deps = deps;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** 正在自动寻路（拾取/出售），此时不由玩家手动移动 */
  isControllingPlayer(): boolean {
    return this.enabled && this.phase !== 'idle';
  }

  start(): void {
    this.enabled = true;
    this.intervalElapsed = 0;
    this.replanAndBeginCollecting();
  }

  stop(): void {
    this.enabled = false;
    this.phase = 'idle';
    this.intervalElapsed = 0;
    this.boxQueue = [];
    this.currentTarget = null;
  }

  update(dt: number): void {
    if (!this.enabled) {
      return;
    }

    if (this.phase === 'idle') {
      this.intervalElapsed += dt;
      if (this.intervalElapsed >= AUTO_SELL_INTERVAL) {
        this.intervalElapsed = 0;
        this.replanAndBeginCollecting();
      }
      return;
    }

    if (this.phase === 'collecting') {
      this.updateCollecting(dt);
      return;
    }

    this.updateSelling(dt);
  }

  private replanAndBeginCollecting(): void {
    const { player, grid } = this.deps;
    const boxes: Array<{ gx: number; gy: number }> = [];

    grid.forEachBuilding((gx, gy, building) => {
      if (building.type === BuildingType.PackingBox) {
        boxes.push({ gx, gy });
      }
    });

    boxes.sort((a, b) => {
      const da = Math.hypot(a.gx + 0.5 - player.x, a.gy + 0.5 - player.y);
      const db = Math.hypot(b.gx + 0.5 - player.x, b.gy + 0.5 - player.y);
      return da - db;
    });

    this.boxQueue = boxes;
    this.phase = 'collecting';
    this.advanceToNextBox();
  }

  private advanceToNextBox(): void {
    const next = this.boxQueue.shift();
    if (!next) {
      this.phase = 'selling';
      this.currentTarget = null;
      return;
    }
    this.currentTarget = { x: next.gx + 0.5, y: next.gy + 0.5 };
  }

  private updateCollecting(dt: number): void {
    if (!this.currentTarget) {
      this.phase = 'selling';
      return;
    }

    const speed = this.deps.getMoveSpeed();
    const arrived = this.deps.player.moveToward(
      this.currentTarget.x,
      this.currentTarget.y,
      dt,
      speed,
    );
    if (arrived) {
      this.deps.collectFromBox();
      this.advanceToNextBox();
    }
  }

  private updateSelling(dt: number): void {
    const { x: targetX, y: targetY } = getSellShopCenter();
    const speed = this.deps.getMoveSpeed();
    const arrived = this.deps.player.moveToward(targetX, targetY, dt, speed);
    if (arrived) {
      this.deps.sellAllHeldCats();
      this.phase = 'idle';
      this.currentTarget = null;
    }
  }
}
