import { Game } from './game/Game';
import './style.css';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const hotbar = document.getElementById('hotbar') as HTMLElement | null;

if (!canvas || !hotbar) {
  throw new Error('Missing #game canvas or #hotbar container');
}

const game = new Game(canvas, hotbar);
game.start();
