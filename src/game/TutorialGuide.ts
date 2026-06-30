import { BuildingType } from './Building';
import type { HeldCats } from './HeldCats';
import type { PlayerGold } from './PlayerGold';
import type { Simulation } from './Simulation';
import { TUTORIAL_BOX_GRID_CELL, TUTORIAL_BOX_USER_CELL } from './gridCoords';

export const TUTORIAL_START_GOLD = 190;
export const TUTORIAL_STORAGE_KEY = 'mewfactory_tutorial_done';
export { TUTORIAL_BOX_USER_CELL };

const GATE_LEVEL = 1;
const EXPAND_PIPELINE_DISPLAY_SECONDS = 5;

type TutorialStep =
  | 'buyBox'
  | 'placeBox'
  | 'waitPack'
  | 'collect'
  | 'sell'
  | 'buyGate'
  | 'placeGate'
  | 'expandPipeline'
  | 'done';

export interface TutorialUpdateContext {
  simulation: Simulation;
  playerGold: PlayerGold;
  heldCats: HeldCats;
}

const HINTS: Record<Exclude<TutorialStep, 'done'>, string> = {
  buyBox: '前往包装箱商店，购买纸箱',
  placeBox: '将包装箱放到流水线末端',
  waitPack: '等待流水线运输……',
  collect: '走到纸箱上拿起小猫',
  sell: '前往商店出售小猫',
  buyGate: '前往变异门商店，购买充气门',
  placeGate: '将充气门放置在传送带上',
  expandPipeline: '创建效率更高的流水线吧！',
};

export class TutorialGuide {
  private step: TutorialStep = 'buyBox';
  private active = false;
  private readonly boxGx = TUTORIAL_BOX_GRID_CELL.gx;
  private readonly boxGy = TUTORIAL_BOX_GRID_CELL.gy;
  private hintOverride: string | null = null;
  private expandPipelineElapsed = 0;

  static isCompleted(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  static markCompleted(): void {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }

  start(): void {
    this.active = true;
    this.step = 'buyBox';
    this.hintOverride = null;
    this.expandPipelineElapsed = 0;
  }

  isActive(): boolean {
    return this.active && this.step !== 'done';
  }

  getCurrentHint(): string {
    if (this.hintOverride) {
      return this.hintOverride;
    }
    if (this.step === 'done') {
      return '';
    }
    return HINTS[this.step];
  }

  getHighlightCell(): { gx: number; gy: number } | null {
    if (this.step === 'placeBox') {
      return { gx: this.boxGx, gy: this.boxGy };
    }
    return null;
  }

  /** 引导期间拦截不符合步骤的放置 */
  canPlaceBuilding(type: BuildingType, gx: number, gy: number): boolean {
    if (!this.isActive()) {
      return true;
    }
    if (this.step === 'placeBox' && type === BuildingType.PackingBox) {
      return gx === this.boxGx && gy === this.boxGy;
    }
    return true;
  }

  onBuildingPurchased(type: BuildingType, level: number): void {
    if (!this.isActive()) {
      return;
    }
    if (this.step === 'buyBox' && type === BuildingType.PackingBox && level === 1) {
      this.advanceTo('placeBox');
      return;
    }
    if (this.step === 'buyGate' && type === BuildingType.MutationGate && level === GATE_LEVEL) {
      this.advanceTo('placeGate');
    }
  }

  onBuildingPlaced(type: BuildingType, gx: number, gy: number): void {
    if (!this.isActive()) {
      return;
    }
    if (
      this.step === 'placeBox' &&
      type === BuildingType.PackingBox &&
      gx === this.boxGx &&
      gy === this.boxGy
    ) {
      this.advanceTo('waitPack');
      return;
    }
    if (this.step === 'placeGate' && type === BuildingType.MutationGate) {
      this.advanceTo('expandPipeline');
    }
  }

  onCatsCollected(): void {
    if (!this.isActive()) {
      return;
    }
    if (this.step === 'collect') {
      this.advanceTo('sell');
    }
  }

  onCatsSold(): void {
    if (!this.isActive()) {
      return;
    }
    if (this.step === 'sell') {
      this.advanceTo('buyGate');
    }
  }

  update(dt: number, ctx: TutorialUpdateContext): void {
    if (!this.isActive()) {
      return;
    }

    const boxCount = ctx.simulation.getBoxCount(this.boxGx, this.boxGy);
    const heldCount = ctx.heldCats.getCount();

    switch (this.step) {
      case 'waitPack':
        if (boxCount > 0) {
          this.advanceTo('collect');
        }
        break;
      case 'collect':
        if (heldCount > 0) {
          this.advanceTo('sell');
        }
        break;
      case 'expandPipeline':
        this.expandPipelineElapsed += dt;
        if (this.expandPipelineElapsed >= EXPAND_PIPELINE_DISPLAY_SECONDS) {
          this.finish();
        }
        break;
      default:
        break;
    }
  }

  private advanceTo(step: TutorialStep): void {
    this.step = step;
    this.hintOverride = null;
    if (step === 'expandPipeline') {
      this.expandPipelineElapsed = 0;
    }
  }

  private finish(): void {
    this.step = 'done';
    this.active = false;
    this.hintOverride = null;
    this.expandPipelineElapsed = 0;
    TutorialGuide.markCompleted();
  }
}
