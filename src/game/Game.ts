import { InputManager } from '../input/InputManager';
import { Renderer } from '../render/Renderer';
import { ActionButtons } from '../ui/ActionButtons';
import { GoldBar } from '../ui/GoldBar';
import { GoldSellFx } from '../ui/GoldSellFx';
import { Hotbar } from '../ui/Hotbar';
import { BuildingShopPanel } from '../ui/BuildingShopPanel';
import { RebirthPanel } from '../ui/RebirthPanel';
import { RebirthToast } from '../ui/RebirthToast';
import { HeldCatStackOverlay } from '../ui/HeldCatStackOverlay';
import { StartGamePanel } from '../ui/StartGamePanel';
import {
  BuildingType,
  rotateDirection,
  type Building,
} from './Building';
import { IntroDemo } from './IntroDemo';
import { seedBasicPipeline, seedDemoProductionLines } from './starterLayout';
import { seedFixedShops } from './fixedShops';
import { Grid } from './Grid';
import { getPlayerCell } from './gridUtils';
import { HeldCats } from './HeldCats';
import { Inventory, PICKUP_SLOT_INDEX } from './Inventory';
import { PlayerGold } from './PlayerGold';
import { RebirthState } from './RebirthState';
import { canPlaceBuilding } from './placement';
import { Player } from './Player';
import { Simulation } from './Simulation';

type InteractionMode = 'place' | 'pickup';
type GamePhase = 'intro' | 'playing';

export class Game {
  private player = new Player();
  private input: InputManager;
  private renderer: Renderer;
  private hotbar: Hotbar;
  private actionButtons: ActionButtons;
  private grid = new Grid();
  private simulation = new Simulation(this.grid);
  private inventory = new Inventory();
  private heldCats = new HeldCats();
  private playerGold = new PlayerGold();
  private rebirthState = new RebirthState();
  private goldBar: GoldBar;
  private goldSellFx: GoldSellFx;
  private rebirthPanel: RebirthPanel;
  private rebirthToast: RebirthToast;
  private buildingShopPanel: BuildingShopPanel;
  private heldCatStackOverlay: HeldCatStackOverlay;
  private startGamePanel: StartGamePanel;
  private introDemo: IntroDemo;
  private gamePhase: GamePhase = 'intro';
  private mode: InteractionMode = 'pickup';
  private heldBuilding: Building | null = null;
  private heldSlotIndex: number | null = null;
  private lastPlayerCellKey: string | null = null;
  private lastTime = 0;
  private running = false;
  private resizeObserver: ResizeObserver;
  private gameContainer: HTMLElement;

  constructor(
    canvas: HTMLCanvasElement,
    hotbarContainer: HTMLElement,
    actionButtonsContainer: HTMLElement,
    shopContainer: HTMLElement,
    goldBarContainer: HTMLElement,
    uiOverlay: HTMLElement,
    rebirthPanelContainer: HTMLElement,
    startGamePanelContainer: HTMLElement,
  ) {
    const gameContainer = canvas.closest('#game-container');
    if (!gameContainer) {
      throw new Error('Missing #game-container');
    }
    this.gameContainer = gameContainer as HTMLElement;
    this.gameContainer.classList.add('is-intro');

    this.input = new InputManager();
    this.renderer = new Renderer(canvas);
    this.hotbar = new Hotbar(hotbarContainer, this.inventory, this.heldCats);
    this.actionButtons = new ActionButtons(actionButtonsContainer);
    this.goldBar = new GoldBar(goldBarContainer, this.playerGold);
    this.goldSellFx = new GoldSellFx(canvas, uiOverlay, this.goldBar);
    this.rebirthToast = new RebirthToast(uiOverlay);
    this.rebirthPanel = new RebirthPanel(
      rebirthPanelContainer,
      this.rebirthState,
      this.playerGold,
      () => this.tryRebirth(),
    );
    this.buildingShopPanel = new BuildingShopPanel(
      shopContainer,
      this.inventory,
      this.playerGold,
      () => this.onInventoryChange(),
    );
    this.heldCatStackOverlay = new HeldCatStackOverlay(canvas, uiOverlay);
    this.startGamePanel = new StartGamePanel(startGamePanelContainer, () => this.startGame());
    this.introDemo = new IntroDemo({
      player: this.player,
      grid: this.grid,
      simulation: this.simulation,
      collectFromBox: () => this.autoBagFromBoxUnderPlayer(),
      sellAllHeldCats: () => this.sellAllHeldCats(),
    });

    this.input.setEnabled(false);

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
    this.resizeObserver.observe(this.gameContainer);
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.updateActionButtons();

    this.seedWorld();
  }

  private seedWorld(): void {
    seedDemoProductionLines(this.grid, this.simulation);
    seedFixedShops(this.grid);
  }

  startGame(): void {
    if (this.gamePhase === 'playing') {
      return;
    }

    this.introDemo.stop();
    this.gamePhase = 'playing';
    this.gameContainer.classList.remove('is-intro');
    this.input.setEnabled(true);
    this.startGamePanel.hide();

    this.grid = new Grid();
    this.simulation = new Simulation(this.grid);
    seedBasicPipeline(this.grid, this.simulation);
    seedFixedShops(this.grid);

    this.playerGold.setAmount(0);
    this.heldCats.clear();
    this.inventory.clear();
    this.enterPickupMode();
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.lastPlayerCellKey = null;
    this.player.resetToCenter();
    this.buildingShopPanel.close();
    this.goldBar.refresh();
    this.rebirthPanel.refresh();
    this.updateActionButtons();
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
    this.heldCatStackOverlay.destroy();
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver.disconnect();
  }

  private onResize = (): void => {
    this.renderer.resize();
    this.heldCatStackOverlay.update(this.player, this.heldCats.getStack());
  };

  private frame = (time: number): void => {
    if (!this.running) {
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (this.gamePhase === 'intro') {
      this.introDemo.update(dt);
    } else {
      this.player.update(dt, this.input.getMovement());
      this.checkShopSell();
      this.autoBagFromBoxUnderPlayer();
    }

    this.goldSellFx.update(dt);
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
      heldCatCount: this.heldCats.getCount(),
      previewCell,
      canPlaceAtPreview,
      cats: this.simulation.getCats(),
      getBoxCount: (gx, gy) => this.simulation.getBoxCount(gx, gy),
      getBoxDrawScale: (gx, gy) => this.simulation.getBoxDrawScale(gx, gy),
      getNestSpawnCountdown: (gx, gy) => this.simulation.getNestSpawnCountdown(gx, gy),
    });

    this.heldCatStackOverlay.update(this.player, this.heldCats.getStack());

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
      building.direction = conveyor.direction;
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

  private checkShopSell(): void {
    const { gx, gy } = getPlayerCell(this.player);
    const key = `${gx},${gy}`;
    if (key === this.lastPlayerCellKey) {
      return;
    }
    this.lastPlayerCellKey = key;

    if (this.grid.isShop(gx, gy)) {
      this.sellAllHeldCats();
    }

    const buildingShop = this.grid.getBuildingShop(gx, gy);
    if (buildingShop) {
      this.buildingShopPanel.open(buildingShop);
    } else {
      this.buildingShopPanel.close();
    }
  }

  private sellAllHeldCats(): void {
    const { count, value } = this.heldCats.takeAll();
    if (count <= 0) {
      return;
    }
    const amount = Math.round(
      value * this.rebirthState.getGoldMultiplier(),
    );
    const { gx, gy } = getPlayerCell(this.player);
    this.hotbar.refresh();
    this.updateActionButtons();
    this.goldSellFx.play(gx, gy, amount, () => {
      this.playerGold.add(amount);
      this.goldBar.refresh();
      this.goldBar.pulseReceive();
      this.rebirthPanel.refresh();
      this.buildingShopPanel.refresh();
    });
  }

  private tryRebirth(): void {
    const cost = this.rebirthState.getRebirthCost();
    if (!this.playerGold.spend(cost)) {
      this.rebirthPanel.refresh();
      return;
    }

    const newMultiplier = this.rebirthState.getNextGoldMultiplier();
    this.rebirthState.performRebirth();
    this.rebirthToast.show(newMultiplier);
    this.goldBar.refresh();
    this.rebirthPanel.refresh();
    this.buildingShopPanel.refresh();
  }

  private autoBagFromBoxUnderPlayer(): void {
    const { gx, gy } = getPlayerCell(this.player);
    const { entries } = this.simulation.takeAllCatsFromBox(gx, gy);
    if (entries.length <= 0) {
      return;
    }
    this.heldCats.addEntries(entries);
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
    if (this.gamePhase === 'intro') {
      this.actionButtons.hideAll();
      return;
    }

    const { gx, gy } = getPlayerCell(this.player);

    if (this.mode === 'place' && this.heldBuilding) {
      const isMutationGate = this.heldBuilding.type === BuildingType.MutationGate;
      this.actionButtons.showPlaceMode({
        rotateEnabled: !isMutationGate,
        hint: isMutationGate ? '可放置在传送带上' : '可放置在空地上',
      });
      return;
    }

    if (this.mode === 'pickup') {
      if (this.grid.hasPickupTarget(gx, gy)) {
        this.actionButtons.showPickupMode();
        return;
      }
    }

    this.actionButtons.hideAll();
  }

  private onInventoryChange(): void {
    this.hotbar.refresh();
    this.goldBar.refresh();
    this.rebirthPanel.refresh();
    this.buildingShopPanel.refresh();

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
