import { Player } from './Player';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../render/Renderer';
import { Hotbar } from '../ui/Hotbar';

export class Game {
  private player = new Player();
  private input: InputManager;
  private renderer: Renderer;
  private hotbar: Hotbar;
  private lastTime = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    hotbarContainer: HTMLElement,
  ) {
    this.input = new InputManager();
    this.renderer = new Renderer(canvas);
    this.hotbar = new Hotbar(hotbarContainer);

    this.input.onHotbarSelect((index) => {
      this.hotbar.select(index);
    });

    window.addEventListener('resize', this.onResize);
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
    this.renderer.draw(this.player);

    requestAnimationFrame(this.frame);
  };
}
