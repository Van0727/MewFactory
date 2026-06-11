import { InputManager } from '../input/InputManager';
import { Renderer } from '../render/Renderer';
import { ActionButtons } from '../ui/ActionButtons';
import { Hotbar } from '../ui/Hotbar';
import { ShopPanel } from '../ui/ShopPanel';
import {
  BuildingType,
  rotateDirection,
  type Building,
} from './Building';
import { seedDemoPipeline, shouldLoadDemoPipeline } from './demoLayout';
import { Grid } from './Grid';
import { getPlayerCell } from './gridUtils';
import { Inventory, PICKUP_SLOT_INDEX } from './Inventory';
import { canPlaceBuilding } from './placement';
import { Player } from './Player';
import { Simulation } from './Simulation';

type InteractionMode = 'place' | 'pickup';

export class Game {
  private player = new Player();
  private input: InputManager;
  private renderer: Renderer;
  private hotbar: Hotbar;
  private actionButtons: ActionButtons;
  private grid = new Grid();
  private simulation = new Simulation(this.grid);
  private inventory = new Inventory();
  private mode: InteractionMode = 'pickup';
  private heldBuilding: Building | null = null;
  private heldSlotIndex: number | null = null;
  private lastTime = 0;
  private running = false;
  private resizeObserver: ResizeObserver;

  constructor(
    canvas: HTMLCanvasElement,
    hotbarContainer: HTMLElement,
    actionButtonsContainer: HTMLElement,
    shopContainer: HTMLElement,
  ) {
    this.input = new InputManager();
    this.renderer = new Renderer(canvas);
    this.hotbar = new Hotbar(hotbarContainer, this.inventory);
    this.actionButtons = new ActionButtons(actionButtonsContainer);
    new ShopPanel(shopContainer, this.inventory, () => this.onInventoryChange());

    this.input.onHotbarSelect((index) => {
      this.hotbar.select(index);
      this.onSlotSelected(index);
    });

    this.hotbar.onSlotSelect((index) => {
      this.onSlotSelected(index);
    });

    this.actionButtons.onAction((action) => {
      this.handleAction(action);
    });

    this.input.onActionKey((key) => {
      if (key === 'r') {
        this.handleAction('rotate');
        return;
      }
      if (key === 'e') {
        if (this.mode === 'place' && this.heldBuilding) {
          this.handleAction('place');
        } else if (this.mode === 'pickup') {
          this.handleAction('pickup');
        }
      }
    });

    window.addEventListener('resize', this.onResize);
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.updateActionButtons();

    if (shouldLoadDemoPipeline()) {
      seedDemoPipeline(this.grid, this.simulation);
    }
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.renderer.resize();
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  destroy(): void {
    this.running = false;
    this.input.destroy();
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver.disconnect();
  }

  private onResize = (): void => {
    this.renderer.resize();
  };

  private frame = (time: number): void => {
    if (!this.running) {
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.player.update(dt, this.input.getMovement());
    this.updateActionButtons();

    this.simulation.update(dt);

    const inPlaceMode = this.mode === 'place' && this.heldBuilding !== null;
    const previewCell = inPlaceMode ? getPlayerCell(this.player) : null;
    const canPlaceAtPreview =
      inPlaceMode && previewCell && this.heldBuilding
        ? canPlaceBuilding(this.grid, previewCell.gx, previewCell.gy, this.heldBuilding)
        : null;

    this.renderer.draw({
      player: this.player,
      grid: this.grid,
      heldBuilding: this.heldBuilding,
      previewCell,
      canPlaceAtPreview,
      cats: this.simulation.getCats(),
      getBoxCount: (gx, gy) => this.simulation.getBoxCount(gx, gy),
      getBoxDrawScale: (gx, gy) => this.simulation.getBoxDrawScale(gx, gy),
    });

    requestAnimationFrame(this.frame);
  };

  private onSlotSelected(index: number): void {
    if (index === PICKUP_SLOT_INDEX) {
      this.enterPickupMode();
      return;
    }

    if (!this.inventory.hasItems(index)) {
      this.enterPickupMode();
      this.hotbar.select(PICKUP_SLOT_INDEX);
      return;
    }

    this.mode = 'place';
    this.heldSlotIndex = index;
    const slot = this.inventory.getSlot(index);
    this.heldBuilding = slot ? { ...slot.building } : null;
    this.updateActionButtons();
  }

  private enterPickupMode(): void {
    this.mode = 'pickup';
    this.heldBuilding = null;
    this.heldSlotIndex = null;
    this.updateActionButtons();
  }

  private handleAction(action: 'place' | 'rotate' | 'pickup'): void {
    switch (action) {
      case 'place':
        this.placeBuilding();
        break;
      case 'rotate':
        this.rotateHeldBuilding();
        break;
      case 'pickup':
        this.pickupBuilding();
        break;
    }
  }

  private rotateHeldBuilding(): void {
    if (!this.heldBuilding || this.heldBuilding.type === BuildingType.MutationGate) {
      return;
    }
    this.heldBuilding.direction = rotateDirection(this.heldBuilding.direction);
    this.syncHeldDirectionToSlot();
  }

  /** 旋转后的方向写回快捷栏堆叠，放置时与预览一致 */
  private syncHeldDirectionToSlot(): void {
    if (this.heldSlotIndex === null || !this.heldBuilding) {
      return;
    }
    const slot = this.inventory.getSlot(this.heldSlotIndex);
    if (slot) {
      slot.building.direction = this.heldBuilding.direction;
    }
  }

  private placeBuilding(): void {
    if (!this.heldBuilding || this.heldSlotIndex === null) {
      return;
    }

    const { gx, gy } = getPlayerCell(this.player);
    this.syncHeldDirectionToSlot();
    const building = { ...this.heldBuilding };

    if (!canPlaceBuilding(this.grid, gx, gy, building)) {
      return;
    }

    if (building.type === BuildingType.MutationGate) {
      const conveyor = this.grid.get(gx, gy);
      if (!conveyor) {
        return;
      }
      building.direction = rotateDirection(conveyor.direction);
      this.grid.setMutationGate(gx, gy, building);
    } else {
      this.grid.set(gx, gy, building);
    }

    this.simulation.onBuildingPlaced(gx, gy, building);

    const taken = this.inventory.takeOne(this.heldSlotIndex);
    if (!taken) {
      return;
    }

    if (!this.inventory.hasItems(this.heldSlotIndex)) {
      this.heldBuilding = null;
      this.heldSlotIndex = null;
      this.enterPickupMode();
      this.hotbar.select(PICKUP_SLOT_INDEX);
    } else {
      const slot = this.inventory.getSlot(this.heldSlotIndex);
      this.heldBuilding = slot ? { ...slot.building } : null;
    }

    this.hotbar.refresh();
    this.updateActionButtons();
  }

  private pickupBuilding(): void {
    const { gx, gy } = getPlayerCell(this.player);
    const picked = this.grid.remove(gx, gy);
    if (!picked) {
      return;
    }

    this.simulation.onBuildingRemoved(gx, gy);

    this.inventory.addBuilding(picked);
    this.hotbar.refresh();
    this.updateActionButtons();
  }

  private updateActionButtons(): void {
    if (this.mode === 'place' && this.heldBuilding) {
      const isMutationGate = this.heldBuilding.type === BuildingType.MutationGate;
      this.actionButtons.showPlaceMode({
        rotateEnabled: !isMutationGate,
        hint: isMutationGate ? '可放置在传送带上' : '可放置在空地上',
      });
      return;
    }

    if (this.mode === 'pickup') {
      const { gx, gy } = getPlayerCell(this.player);
      if (this.grid.hasPickupTarget(gx, gy)) {
        this.actionButtons.showPickupMode();
        return;
      }
    }

    this.actionButtons.hideAll();
  }

  private onInventoryChange(): void {
    this.hotbar.refresh();

    if (
      this.mode === 'place' &&
      this.heldSlotIndex !== null &&
      !this.inventory.hasItems(this.heldSlotIndex)
    ) {
      this.enterPickupMode();
      this.hotbar.select(PICKUP_SLOT_INDEX);
    }

    this.updateActionButtons();
  }
}
