import { getGoldSellCoinCount } from '../config';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../render/Renderer';
import { ActionButtons } from '../ui/ActionButtons';
import { GoldBar } from '../ui/GoldBar';
import { GoldSellFx } from '../ui/GoldSellFx';
import { RubyRewardFx } from '../ui/RubyRewardFx';
import { Hotbar } from '../ui/Hotbar';
import { BuildingShopPanel } from '../ui/BuildingShopPanel';
import { AttributeShopPanel } from '../ui/AttributeShopPanel';
import { RebirthPanel } from '../ui/RebirthPanel';
import { RebirthToast } from '../ui/RebirthToast';
import { AutoSellOverlay } from '../ui/AutoSellOverlay';
import { ClearAllConfirm } from '../ui/ClearAllConfirm';
import { GmGoldButton } from '../ui/GmGoldButton';
import { HeldCatStackOverlay } from '../ui/HeldCatStackOverlay';
import { StartGamePanel } from '../ui/StartGamePanel';
import { TutorialPanel } from '../ui/TutorialPanel';
import { OrderPanel } from '../ui/OrderPanel';
import { RubyBar } from '../ui/RubyBar';
import {
  BuildingType,
  rotateDirection,
  type Building,
} from './Building';
import { AutoSell } from './AutoSell';
import { IntroDemo } from './IntroDemo';
import { autoBuildFromInventory, previewAutoBuild } from './autoBuild';
import { seedRandomProductionLines, seedStarterPipeline } from './starterLayout';
import { seedFixedShops } from './fixedShops';
import { Grid } from './Grid';
import { getPlayerCell } from './gridUtils';
import {
  HeldCats,
  sumHeldCatEntriesCount,
  sumHeldCatEntriesValue,
} from './HeldCats';
import { Inventory, PICKUP_SLOT_INDEX } from './Inventory';
import { PlayerGold } from './PlayerGold';
import { PlayerRuby } from './PlayerRuby';
import { OrderManager } from './OrderManager';
import { matchesOrder, collectOrderUnlockContext } from '../data/orders';
import { RebirthState } from './RebirthState';
import { CharacterState } from './CharacterState';
import type { CharacterAttributeId } from '../data/character';
import { canPlaceBuilding } from './placement';
import { Player } from './Player';
import { Simulation } from './Simulation';
import type { BuildingShopKind } from './buildingShopCatalog';
import {
  TutorialGuide,
  TUTORIAL_BLOCKED_MESSAGE,
  TUTORIAL_START_GOLD,
} from './TutorialGuide';

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
  private playerRuby = new PlayerRuby();
  private rebirthState = new RebirthState();
  private characterState = new CharacterState();
  private orderManager = new OrderManager();
  private goldBar: GoldBar;
  private rubyBar: RubyBar;
  private goldSellFx: GoldSellFx;
  private rubyRewardFx: RubyRewardFx;
  private uiOverlay: HTMLElement;
  private rebirthPanel: RebirthPanel;
  private rebirthToast: RebirthToast;
  private buildingShopPanel: BuildingShopPanel;
  private attributeShopPanel: AttributeShopPanel;
  private heldCatStackOverlay: HeldCatStackOverlay;
  private startGamePanel: StartGamePanel;
  private tutorial = new TutorialGuide();
  private tutorialPanel: TutorialPanel;
  private orderPanel: OrderPanel;
  private autoSell: AutoSell;
  private autoSellOverlay: AutoSellOverlay;
  private factoryActions: ClearAllConfirm;
  private lastTutorialKey = '';
  private purchasedCatNestLevels = new Set<number>([1]);
  private purchasedGateLevels = new Set<number>();
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
    attributeShopContainer: HTMLElement,
    goldBarContainer: HTMLElement,
    rubyBarContainer: HTMLElement,
    gmGoldBtnContainer: HTMLElement,
    uiOverlay: HTMLElement,
    rebirthPanelContainer: HTMLElement,
    startGamePanelContainer: HTMLElement,
    factoryActionsRoot: HTMLElement,
    modalRoot: HTMLElement,
  ) {
    const gameContainer = canvas.closest('#game-container');
    if (!gameContainer) {
      throw new Error('Missing #game-container');
    }
    this.gameContainer = gameContainer as HTMLElement;
    this.gameContainer.classList.add('is-intro');
    this.uiOverlay = uiOverlay;

    this.input = new InputManager();
    this.renderer = new Renderer(canvas);
    this.hotbar = new Hotbar(hotbarContainer, this.inventory, this.heldCats);
    this.actionButtons = new ActionButtons(actionButtonsContainer, uiOverlay, canvas);
    this.goldBar = new GoldBar(goldBarContainer, this.playerGold);
    this.rubyBar = new RubyBar(rubyBarContainer, this.playerRuby);
    new GmGoldButton(gmGoldBtnContainer, () => this.addGmGold(10000));
    this.goldSellFx = new GoldSellFx(canvas, uiOverlay, this.goldBar);
    this.rubyRewardFx = new RubyRewardFx(uiOverlay, this.rubyBar);
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
      (kind, level) => {
        this.recordBuildingPurchase(kind, level);
        this.tutorial.onBuildingPurchased(kind, level);
        this.syncTutorialPanel();
      },
      (kind, level) => this.tutorial.canPurchaseBuilding(kind, level),
    );
    this.attributeShopPanel = new AttributeShopPanel(
      attributeShopContainer,
      this.characterState,
      this.playerRuby,
      (attr) => this.tryUpgradeAttribute(attr),
    );
    this.heldCatStackOverlay = new HeldCatStackOverlay(canvas, uiOverlay);
    this.startGamePanel = new StartGamePanel(startGamePanelContainer, () => this.startGame());
    this.tutorialPanel = new TutorialPanel(uiOverlay);
    this.orderPanel = new OrderPanel(uiOverlay);
    this.orderManager.setListener(() => this.syncOrderPanel());
    this.orderManager.setUnlockContextProvider(() =>
      collectOrderUnlockContext(
        this.grid,
        this.inventory,
        this.purchasedCatNestLevels,
        this.purchasedGateLevels,
      ),
    );
    this.tutorial.onComplete = () => {
      this.orderManager.setRebirthCount(this.rebirthState.getCount());
      this.orderManager.scheduleFirstOrder();
    };
    this.autoSellOverlay = new AutoSellOverlay(uiOverlay);
    this.autoSell = new AutoSell({
      player: this.player,
      getGrid: () => this.grid,
      getSimulation: () => this.simulation,
      getMoveSpeed: () => this.characterState.getMoveSpeed(),
      getHeldCatCount: () => this.heldCats.getCount(),
      collectFromBox: () => this.autoBagFromBoxUnderPlayer(),
      sellAllHeldCats: () => this.sellAllHeldCats(),
    });
    this.factoryActions = new ClearAllConfirm(
      factoryActionsRoot,
      modalRoot,
      () => this.clearAllProductionLines(),
      () => this.toggleAutoSell(),
      () => this.previewAutoBuild(),
      () => this.autoBuildPipeline(),
      () => !this.tutorial.isActive(),
      TUTORIAL_BLOCKED_MESSAGE,
    );
    this.applyCharacterStats();
    this.introDemo = new IntroDemo({
      player: this.player,
      grid: this.grid,
      simulation: this.simulation,
      getMoveSpeed: () => this.characterState.getMoveSpeed(),
      collectFromBox: () => this.autoBagFromBoxUnderPlayer(),
      sellAllHeldCats: () => this.sellAllHeldCats(),
    });

    this.input.setEnabled(false);

    this.input.onMovementPress(() => {
      if (this.autoSell.isEnabled()) {
        this.stopAutoSell();
      }
    });

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
    seedFixedShops(this.grid);
    seedRandomProductionLines(this.grid, this.simulation);
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
    seedFixedShops(this.grid);
    seedStarterPipeline(this.grid, this.simulation);

    this.tutorial.start();
    this.playerGold.setAmount(TUTORIAL_START_GOLD);
    this.playerRuby.setAmount(0);
    this.purchasedCatNestLevels = new Set([1]);
    this.purchasedGateLevels = new Set();
    this.orderManager.reset();
    this.orderPanel.hide();
    this.heldCats.clear();
    this.inventory.clear();
    this.lastTutorialKey = '';
    this.syncTutorialPanel();
    this.enterPickupMode();
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.lastPlayerCellKey = null;
    this.player.resetToSpawn();
    this.applyCharacterStats();
    this.buildingShopPanel.close();
    this.attributeShopPanel.close();
    this.stopAutoSell();
    this.goldBar.refresh();
    this.rubyBar.refresh();
    this.rebirthPanel.refresh();
    this.hotbar.refresh();
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
      const movement = this.input.getMovement();
      this.updateAutoSell(dt);
      if (!this.autoSell.isControllingPlayer()) {
        this.player.update(
          dt,
          movement,
          this.characterState.getMoveSpeed(),
        );
      }
      this.checkShopSell();
      if (!this.autoSell.isControllingPlayer()) {
        this.autoBagFromBoxUnderPlayer();
      }
      this.tutorial.update(dt, {
        simulation: this.simulation,
        playerGold: this.playerGold,
        heldCats: this.heldCats,
      });
      this.syncTutorialPanel();
      this.orderManager.update(dt);
    }

    this.goldSellFx.update(dt);
    this.rubyRewardFx.update(dt);
    this.updateActionButtons();

    if (this.gamePhase === 'playing' && this.mode === 'place' && this.heldBuilding) {
      this.actionButtons.updatePlaceHintPosition(this.player);
    }

    this.simulation.update(dt);

    const inPlaceMode = this.mode === 'place' && this.heldBuilding !== null;
    const playerCell = inPlaceMode ? getPlayerCell(this.player) : null;
    let previewCell = playerCell;
    let canPlaceAtPreview: boolean | null = null;

    if (inPlaceMode && playerCell && this.heldBuilding) {
      if (this.heldBuilding.type === BuildingType.MutationGate) {
        if (this.grid.hasConveyor(playerCell.gx, playerCell.gy)) {
          canPlaceAtPreview = canPlaceBuilding(
            this.grid,
            playerCell.gx,
            playerCell.gy,
            this.heldBuilding,
          );
        } else {
          previewCell = null;
        }
      } else {
        canPlaceAtPreview = canPlaceBuilding(
          this.grid,
          playerCell.gx,
          playerCell.gy,
          this.heldBuilding,
        );
      }
    }

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
      catGoldMultiplier:
        this.gamePhase === 'playing' ? this.rebirthState.getGoldMultiplier() : 1,
      tutorialHighlightCell: this.tutorial.isActive()
        ? this.tutorial.getHighlightCell()
        : null,
    });

    if (this.gamePhase === 'playing') {
      const playerPos = this.renderer.getPlayerClientPosition(this.player);
      this.orderPanel.updatePlayerOcclusion(playerPos.x, playerPos.y);
    }

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

    if (!this.tutorial.canPlaceBuilding(building.type, gx, gy)) {
      return;
    }

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
    this.tutorial.onBuildingPlaced(building.type, gx, gy);
    this.syncTutorialPanel();
  }

  private syncOrderPanel(): void {
    if (this.orderPanel.isCompleteFxActive()) {
      return;
    }

    if (this.tutorial.isActive()) {
      this.orderPanel.hide();
      return;
    }

    if (this.orderManager.isPanelVisible()) {
      this.orderPanel.refresh(this.orderManager.getOrder());
      return;
    }

    this.orderPanel.hide();
  }

  private recordBuildingPurchase(kind: BuildingShopKind, level: number): void {
    if (kind === BuildingType.CatNest) {
      this.purchasedCatNestLevels.add(level);
    }
    if (kind === BuildingType.MutationGate) {
      this.purchasedGateLevels.add(level);
    }
  }

  private syncTutorialPanel(): void {
    if (!this.tutorial.isActive()) {
      if (this.lastTutorialKey) {
        this.tutorialPanel.hide();
        this.lastTutorialKey = '';
      }
      return;
    }

    const hint = this.tutorial.getCurrentHint();
    const step = this.tutorial.getCurrentStepNumber();
    const key = `${step}:${hint}`;
    if (key === this.lastTutorialKey) {
      return;
    }

    this.tutorialPanel.show(step, hint);
    this.lastTutorialKey = key;
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

    if (this.grid.isRecycleDepot(gx, gy)) {
      this.sellAllInventoryBuildings();
    }

    const buildingShop = this.grid.getBuildingShop(gx, gy);
    if (this.grid.isAttributeShop(gx, gy)) {
      this.attributeShopPanel.open();
      this.buildingShopPanel.close();
    } else if (buildingShop) {
      this.buildingShopPanel.open(buildingShop);
      this.attributeShopPanel.close();
    } else {
      this.buildingShopPanel.close();
      this.attributeShopPanel.close();
    }
  }

  private applyCharacterStats(): void {
    this.heldCats.setMaxCount(this.characterState.getCarryLimit());
  }

  private tryUpgradeAttribute(attr: CharacterAttributeId): void {
    const price = this.characterState.getUpgradePrice(attr);
    if (price === null || !this.playerRuby.spend(price)) {
      this.refreshShopPanels();
      return;
    }
    this.characterState.upgrade(attr);
    this.applyCharacterStats();
    this.rubyBar.refresh();
    this.rebirthPanel.refresh();
    this.refreshShopPanels();
  }

  private refreshShopPanels(): void {
    this.buildingShopPanel.refresh();
    this.attributeShopPanel.refresh();
    this.rubyBar.refresh();
  }

  private addGmGold(amount: number): void {
    this.playerGold.add(amount);
    this.goldBar.refresh();
    this.rebirthPanel.refresh();
    this.refreshShopPanels();
  }

  private toggleAutoSell(): void {
    if (this.gamePhase !== 'playing') {
      return;
    }
    if (this.tutorial.isActive()) {
      return;
    }
    if (this.autoSell.isEnabled()) {
      this.stopAutoSell();
      return;
    }
    this.autoSell.start();
    this.autoSellOverlay.show();
    this.autoSell.update(1 / 60);
  }

  private stopAutoSell(): void {
    this.autoSell.stop();
    this.autoSellOverlay.hide();
  }

  private updateAutoSell(dt: number): void {
    if (!this.autoSell.isEnabled()) {
      return;
    }
    this.autoSell.update(dt);
  }

  private previewAutoBuild(): { canProceed: boolean; message: string } {
    if (this.gamePhase !== 'playing') {
      return { canProceed: false, message: '请先开始游戏' };
    }
    return previewAutoBuild(this.grid, this.inventory);
  }

  private autoBuildPipeline(): void {
    if (this.gamePhase !== 'playing') {
      return;
    }
    const result = autoBuildFromInventory(this.grid, this.simulation, this.inventory);
    if (!result.ok) {
      return;
    }
    this.enterPickupMode();
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.hotbar.refresh();
    this.updateActionButtons();
  }

  private clearAllProductionLines(): void {
    if (this.gamePhase !== 'playing') {
      return;
    }

    const { amount, count } = this.grid.clearProductionBuildings();
    this.simulation.clearAll();
    this.enterPickupMode();
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.hotbar.refresh();
    this.buildingShopPanel.close();
    this.attributeShopPanel.close();
    this.updateActionButtons();

    if (amount <= 0) {
      return;
    }

    const { gx, gy } = getPlayerCell(this.player);
    this.goldSellFx.play(gx, gy, amount, () => {
      this.playerGold.add(amount);
      this.goldBar.refresh();
      this.goldBar.pulseReceive();
      this.rebirthPanel.refresh();
      this.refreshShopPanels();
    }, getGoldSellCoinCount(count));
  }

  private sellAllInventoryBuildings(): void {
    const { amount, count } = this.inventory.sellAll();
    if (count <= 0) {
      return;
    }

    this.enterPickupMode();
    this.hotbar.select(PICKUP_SLOT_INDEX);
    this.hotbar.refresh();
    this.updateActionButtons();

    const { gx, gy } = getPlayerCell(this.player);
    this.goldSellFx.play(gx, gy, amount, () => {
      this.playerGold.add(amount);
      this.goldBar.refresh();
      this.goldBar.pulseReceive();
      this.rebirthPanel.refresh();
      this.refreshShopPanels();
    }, getGoldSellCoinCount(count));
  }

  private sellAllHeldCats(): void {
    let orderSoldCount = 0;
    let orderSoldValue = 0;

    const activeOrder = this.orderManager.getOrder();
    if (activeOrder && this.orderManager.hasActiveOrder()) {
      const needed = this.orderManager.getRemainingNeeded();
      const taken = this.heldCats.takeMatching(
        (entry) => matchesOrder(entry, activeOrder),
        needed,
      );
      if (taken.length > 0) {
        orderSoldCount = sumHeldCatEntriesCount(taken);
        orderSoldValue = sumHeldCatEntriesValue(taken);
        const orderSnapshot = { ...activeOrder };
        const { rubyReward } = this.orderManager.deliver(orderSoldCount);
        if (rubyReward > 0) {
          const completedOrder = {
            ...orderSnapshot,
            delivered: orderSnapshot.quantity,
          };
          this.orderPanel.playCompleteEffect(completedOrder, () => {
            const source = this.orderPanel.getFlySource(this.uiOverlay);
            this.rubyRewardFx.play(source.x, source.y, rubyReward, () => {
              this.playerRuby.add(rubyReward);
              this.rubyBar.refresh();
              this.rubyBar.pulseReceive();
            });
          });
        }
      }
    }

    const { count, value } = this.heldCats.takeAll();
    const totalCount = count + orderSoldCount;
    const totalValue = value + orderSoldValue;
    if (totalCount <= 0) {
      return;
    }
    const amount = Math.round(
      totalValue * this.rebirthState.getGoldMultiplier(),
    );
    const { gx, gy } = getPlayerCell(this.player);
    this.hotbar.refresh();
    this.updateActionButtons();
    this.goldSellFx.play(gx, gy, amount, () => {
      this.playerGold.add(amount);
      this.goldBar.refresh();
      this.goldBar.pulseReceive();
      this.rebirthPanel.refresh();
      this.refreshShopPanels();
    }, getGoldSellCoinCount(totalCount));
    this.tutorial.onCatsSold();
    this.syncTutorialPanel();
  }

  private tryRebirth(): void {
    if (this.tutorial.isActive()) {
      this.factoryActions.notify(TUTORIAL_BLOCKED_MESSAGE);
      return;
    }
    const cost = this.rebirthState.getRebirthCost();
    if (!this.playerGold.spend(cost)) {
      this.rebirthPanel.refresh();
      return;
    }

    const newMultiplier = this.rebirthState.getNextGoldMultiplier();
    this.rebirthState.performRebirth();
    this.orderManager.setRebirthCount(this.rebirthState.getCount());
    this.rebirthToast.show(newMultiplier);
    this.goldBar.refresh();
    this.rebirthPanel.refresh();
    this.refreshShopPanels();
  }

  private autoBagFromBoxUnderPlayer(): void {
    const { gx, gy } = getPlayerCell(this.player);
    const space = this.heldCats.getRemainingSpace();
    if (space <= 0) {
      return;
    }
    const { entries } = this.simulation.takeCatsFromBox(gx, gy, space);
    if (entries.length <= 0) {
      return;
    }
    this.heldCats.addEntries(entries);
    this.tutorial.onCatsCollected();
    this.syncTutorialPanel();
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
    this.refreshShopPanels();

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
