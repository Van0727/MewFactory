import { Game } from './game/Game';
import { loadAssets } from './render/assets';
import { Renderer } from './render/Renderer';
import './style.css';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const hotbar = document.getElementById('hotbar') as HTMLElement | null;
const actionButtons = document.getElementById('action-buttons') as HTMLElement | null;
const shopPanel = document.getElementById('shop-panel') as HTMLElement | null;

if (!canvas || !hotbar || !actionButtons || !shopPanel) {
  throw new Error('Missing required DOM elements');
}

const gameCanvas = canvas;
const hotbarEl = hotbar;
const actionButtonsEl = actionButtons;
const shopPanelEl = shopPanel;
const loadingRenderer = new Renderer(gameCanvas);
loadingRenderer.showLoading();

async function bootstrap(): Promise<void> {
  await loadAssets();
  const game = new Game(gameCanvas, hotbarEl, actionButtonsEl, shopPanelEl);
  game.start();
}

bootstrap().catch((err) => {
  console.error(err);
  loadingRenderer.showLoading('Failed to load assets');
});
