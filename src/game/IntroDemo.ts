import { BuildingType } from './Building';
import { getSellShopCenter } from './gridCoords';
import type { Grid } from './Grid';
import type { Player } from './Player';
import type { Simulation } from './Simulation';

const INTRO_WAIT_SECONDS = 5;

type IntroState = 'waiting' | 'collecting' | 'selling';

export interface IntroDemoDeps {
  player: Player;
  grid: Grid;
  simulation: Simulation;
  collectFromBox: () => void;
  sellAllHeldCats: () => void;
}

export class IntroDemo {
  private active = true;
  private state: IntroState = 'waiting';
  private waitElapsed = 0;
  private boxQueue: Array<{ gx: number; gy: number }> = [];
  private currentTarget: { x: number; y: number } | null = null;
  private deps: IntroDemoDeps;

  constructor(deps: IntroDemoDeps) {
    this.deps = deps;
  }

  isActive(): boolean {
    return this.active;
  }

  stop(): void {
    this.active = false;
  }

  update(dt: number): void {
    if (!this.active) {
      return;
    }

    switch (this.state) {
      case 'waiting':
        this.waitElapsed += dt;
        if (this.waitElapsed >= INTRO_WAIT_SECONDS) {
          this.waitElapsed = 0;
          this.beginCollecting();
        }
        break;
      case 'collecting':
        this.updateCollecting(dt);
        break;
      case 'selling':
        this.updateSelling(dt);
        break;
    }
  }

  private beginCollecting(): void {
    const { player, grid, simulation } = this.deps;
    const boxes: Array<{ gx: number; gy: number }> = [];

    grid.forEachBuilding((gx, gy, building) => {
      if (building.type === BuildingType.PackingBox && simulation.getBoxCount(gx, gy) > 0) {
        boxes.push({ gx, gy });
      }
    });

    boxes.sort((a, b) => {
      const da = Math.hypot(a.gx + 0.5 - player.x, a.gy + 0.5 - player.y);
      const db = Math.hypot(b.gx + 0.5 - player.x, b.gy + 0.5 - player.y);
      return da - db;
    });

    this.boxQueue = boxes;
    this.state = 'collecting';
    this.advanceToNextBox();
  }

  private advanceToNextBox(): void {
    const next = this.boxQueue.shift();
    if (!next) {
      this.state = 'selling';
      this.currentTarget = null;
      return;
    }
    this.currentTarget = { x: next.gx + 0.5, y: next.gy + 0.5 };
  }

  private updateCollecting(dt: number): void {
    if (!this.currentTarget) {
      this.state = 'selling';
      return;
    }

    const arrived = this.deps.player.moveToward(
      this.currentTarget.x,
      this.currentTarget.y,
      dt,
    );
    if (arrived) {
      this.deps.collectFromBox();
      this.advanceToNextBox();
    }
  }

  private updateSelling(dt: number): void {
    const { x: targetX, y: targetY } = getSellShopCenter();
    const arrived = this.deps.player.moveToward(targetX, targetY, dt);
    if (arrived) {
      this.deps.sellAllHeldCats();
      this.state = 'waiting';
      this.waitElapsed = 0;
      this.currentTarget = null;
    }
  }
}
