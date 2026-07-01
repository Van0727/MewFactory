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
  private enabled = true;
  private movement: MovementState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private hotbarListeners: Array<(index: number) => void> = [];
  private actionKeyListeners: Array<(key: ActionKey) => void> = [];
  private movementPressListeners: Array<() => void> = [];

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.movement.up = false;
      this.movement.down = false;
      this.movement.left = false;
      this.movement.right = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  onHotbarSelect(listener: (index: number) => void): void {
    this.hotbarListeners.push(listener);
  }

  onActionKey(listener: (key: ActionKey) => void): void {
    this.actionKeyListeners.push(listener);
  }

  /** 按下方向键时（非长按重复） */
  onMovementPress(listener: () => void): void {
    this.movementPressListeners.push(listener);
  }

  private notifyMovementPress(): void {
    for (const listener of this.movementPressListeners) {
      listener();
    }
  }

  private setMovementAxis(
    axis: keyof MovementState,
    active: boolean,
    notifyPress: boolean,
  ): void {
    if (active) {
      if (!this.movement[axis]) {
        this.movement[axis] = true;
        if (notifyPress) {
          this.notifyMovementPress();
        }
      }
      return;
    }
    this.movement[axis] = false;
  }

  getMovement(): MovementState {
    if (!this.enabled) {
      return { up: false, down: false, left: false, right: false };
    }
    return this.movement;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) {
      return;
    }
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
        this.setMovementAxis('up', true, !e.repeat);
        break;
      case 's':
      case 'arrowdown':
        this.setMovementAxis('down', true, !e.repeat);
        break;
      case 'a':
      case 'arrowleft':
        this.setMovementAxis('left', true, !e.repeat);
        break;
      case 'd':
      case 'arrowright':
        this.setMovementAxis('right', true, !e.repeat);
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (!this.enabled) {
      return;
    }
    const key = e.key.toLowerCase();

    switch (key) {
      case 'w':
      case 'arrowup':
        this.setMovementAxis('up', false, false);
        break;
      case 's':
      case 'arrowdown':
        this.setMovementAxis('down', false, false);
        break;
      case 'a':
      case 'arrowleft':
        this.setMovementAxis('left', false, false);
        break;
      case 'd':
      case 'arrowright':
        this.setMovementAxis('right', false, false);
        break;
    }
  };
}
