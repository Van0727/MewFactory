import { Game } from './game/Game';
import { loadAssets } from './render/assets';
import { Renderer } from './render/Renderer';
import './style.css';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const hotbar = document.getElementById('hotbar-slots') as HTMLElement | null;
const rebirthPanel = document.getElementById('rebirth-panel') as HTMLElement | null;
const actionButtons = document.getElementById('action-buttons') as HTMLElement | null;
const buildingShopPanel = document.getElementById('building-shop-panel') as HTMLElement | null;
const attributeShopPanel = document.getElementById('attribute-shop-panel') as HTMLElement | null;
const goldBar = document.getElementById('gold-bar') as HTMLElement | null;
const rubyBar = document.getElementById('ruby-bar') as HTMLElement | null;
const gmGoldBtn = document.getElementById('gm-gold-btn') as HTMLElement | null;
const uiOverlay = document.getElementById('ui-overlay') as HTMLElement | null;
const startGamePanel = document.getElementById('start-game-panel') as HTMLElement | null;
const factoryActions = document.getElementById('factory-actions') as HTMLElement | null;
const gameContainer = document.getElementById('game-container') as HTMLElement | null;

if (
  !canvas ||
  !hotbar ||
  !rebirthPanel ||
  !actionButtons ||
  !buildingShopPanel ||
  !attributeShopPanel ||
  !goldBar ||
  !rubyBar ||
  !gmGoldBtn ||
  !uiOverlay ||
  !startGamePanel ||
  !factoryActions ||
  !gameContainer
) {
  throw new Error('Missing required DOM elements');
}

const gameCanvas = canvas;
const hotbarEl = hotbar;
const rebirthPanelEl = rebirthPanel;
const actionButtonsEl = actionButtons;
const buildingShopPanelEl = buildingShopPanel;
const attributeShopPanelEl = attributeShopPanel;
const goldBarEl = goldBar;
const rubyBarEl = rubyBar;
const gmGoldBtnEl = gmGoldBtn;
const uiOverlayEl = uiOverlay;
const startGamePanelEl = startGamePanel;
const factoryActionsEl = factoryActions;
const gameContainerEl = gameContainer;
const loadingRenderer = new Renderer(gameCanvas);
loadingRenderer.showLoading();

async function bootstrap(): Promise<void> {
  await loadAssets();
  const game = new Game(
    gameCanvas,
    hotbarEl,
    actionButtonsEl,
    buildingShopPanelEl,
    attributeShopPanelEl,
    goldBarEl,
    rubyBarEl,
    gmGoldBtnEl,
    uiOverlayEl,
    rebirthPanelEl,
    startGamePanelEl,
    factoryActionsEl,
    gameContainerEl,
  );
  game.start();
}

bootstrap().catch((err) => {
  console.error(err);
  loadingRenderer.showLoading('Failed to load assets');
});
