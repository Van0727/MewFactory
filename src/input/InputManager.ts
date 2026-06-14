export interface MovementState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const HOTBAR_KEYS: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
  '0': 9,
};

const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const ACTION_KEYS = new Set(['e', 'r']);

export type ActionKey = 'e' | 'r';

export class InputManager {
  private movement: MovementState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private hotbarListeners: Array<(index: number) => void> = [];
  private actionKeyListeners: Array<(key: ActionKey) => void> = [];

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  onHotbarSelect(listener: (index: number) => void): void {
    this.hotbarListeners.push(listener);
  }

  onActionKey(listener: (key: ActionKey) => void): void {
    this.actionKeyListeners.push(listener);
  }

  getMovement(): MovementState {
    return this.movement;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();

    if (MOVEMENT_KEYS.has(key) || ACTION_KEYS.has(key)) {
      e.preventDefault();
    }

    if (ACTION_KEYS.has(key) && !e.repeat) {
      for (const listener of this.actionKeyListeners) {
        listener(key as ActionKey);
      }
      return;
    }

    if (key in HOTBAR_KEYS) {
      const index = HOTBAR_KEYS[key];
      for (const listener of this.hotbarListeners) {
        listener(index);
      }
      return;
    }

    switch (key) {
      case 'w':
      case 'arrowup':
        this.movement.up = true;
        break;
      case 's':
      case 'arrowdown':
        this.movement.down = true;
        break;
      case 'a':
      case 'arrowleft':
        this.movement.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.movement.right = true;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();

    switch (key) {
      case 'w':
      case 'arrowup':
        this.movement.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.movement.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.movement.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.movement.right = false;
        break;
    }
  };
}
