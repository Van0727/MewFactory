import { Game } from './game/Game';
import './style.css';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const hotbar = document.getElementById('hotbar') as HTMLElement | null;
const actionButtons = document.getElementById('action-buttons') as HTMLElement | null;
const shopPanel = document.getElementById('shop-panel') as HTMLElement | null;

if (!canvas || !hotbar || !actionButtons || !shopPanel) {
  throw new Error('Missing required DOM elements');
}

const game = new Game(canvas, hotbar, actionButtons, shopPanel);
game.start();
