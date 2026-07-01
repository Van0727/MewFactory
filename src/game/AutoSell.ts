import { AUTO_SELL_INTERVAL } from '../config';
import { BuildingType } from './Building';
import { getSellShopCenter } from './gridCoords';
import type { Grid } from './Grid';
import type { Player } from './Player';
import type { Simulation } from './Simulation';

type AutoSellPhase = 'idle' | 'collecting' | 'selling';

interface BoxTarget {
  gx: number;
  gy: number;
  catCount: number;
}

export interface AutoSellDeps {
  player: Player;
  getGrid: () => Grid;
  getSimulation: () => Simulation;
  getMoveSpeed: () => number;
  getHeldCatCount: () => number;
  collectFromBox: () => void;
  sellAllHeldCats: () => void;
}

/** 开启后每隔 AUTO_SELL_INTERVAL 秒自动走遍包装箱并出售；移动输入取消 */
export class AutoSell {
  private enabled = false;
  private phase: AutoSellPhase = 'idle';
  private intervalElapsed = 0;
  private boxQueue: BoxTarget[] = [];
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
    this.beginCollecting();
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

    const step = Math.max(dt, 1 / 120);

    if (this.phase === 'idle') {
      this.intervalElapsed += step;
      if (this.intervalElapsed >= AUTO_SELL_INTERVAL) {
        this.intervalElapsed = 0;
        this.beginCollecting();
      }
      return;
    }

    if (this.phase === 'collecting') {
      this.updateCollecting(step);
      if (this.phase !== 'collecting') {
        this.updateSelling(step);
      }
      return;
    }

    this.updateSelling(step);
  }

  private beginCollecting(): void {
    const { player, getGrid, getSimulation, getHeldCatCount } = this.deps;
    const grid = getGrid();
    const simulation = getSimulation();
    const boxes: BoxTarget[] = [];

    grid.forEachBuilding((gx, gy, building) => {
      if (building.type === BuildingType.PackingBox) {
        boxes.push({
          gx,
          gy,
          catCount: simulation.getBoxCount(gx, gy),
        });
      }
    });

    const withCats = boxes.filter((box) => box.catCount > 0);
    if (withCats.length > 0) {
      withCats.sort((a, b) => {
        const da = Math.hypot(a.gx + 0.5 - player.x, a.gy + 0.5 - player.y);
        const db = Math.hypot(b.gx + 0.5 - player.x, b.gy + 0.5 - player.y);
        return da - db;
      });
      this.boxQueue = withCats;
      this.phase = 'collecting';
      this.advanceToNextBox();
      return;
    }

    if (getHeldCatCount() > 0 || boxes.length === 0) {
      this.boxQueue = [];
      this.phase = 'selling';
      this.currentTarget = null;
      return;
    }

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
      this.intervalElapsed = 0;
    }
  }
}
