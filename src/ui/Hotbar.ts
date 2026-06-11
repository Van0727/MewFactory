import { getUiIconUrl, getUiPickupUrl } from '../render/assets';
import type { Inventory, InventorySlot } from '../game/Inventory';
import { FIRST_INVENTORY_SLOT, INVENTORY_SLOT_COUNT, PICKUP_SLOT_INDEX } from '../game/Inventory';

const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const SLOT_COUNT = INVENTORY_SLOT_COUNT + 1;

export class Hotbar {
  private slots: HTMLElement[] = [];
  private selectedIndex = PICKUP_SLOT_INDEX;
  private slotListeners: Array<(index: number) => void> = [];
  private inventory: Inventory;

  constructor(container: HTMLElement, inventory: Inventory) {
    this.inventory = inventory;
    container.innerHTML = '';

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      slot.dataset.index = String(i);

      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = KEY_LABELS[i];
      slot.appendChild(label);

      const icon = document.createElement('span');
      icon.className = i === PICKUP_SLOT_INDEX ? 'slot-icon pickup-icon' : 'slot-icon building-icon';
      if (i === PICKUP_SLOT_INDEX) {
        icon.style.backgroundImage = `url(${getUiPickupUrl()})`;
      }
      slot.appendChild(icon);

      if (i !== PICKUP_SLOT_INDEX) {
        const badge = document.createElement('span');
        badge.className = 'count-badge';
        badge.style.display = 'none';
        slot.appendChild(badge);
      }

      slot.addEventListener('click', () => {
        this.select(i);
        for (const listener of this.slotListeners) {
          listener(i);
        }
      });

      container.appendChild(slot);
      this.slots.push(slot);
    }

    this.updateSelection();
    this.refresh();
  }

  onSlotSelect(listener: (index: number) => void): void {
    this.slotListeners.push(listener);
  }

  select(index: number): void {
    if (index < 0 || index >= SLOT_COUNT) {
      return;
    }
    this.selectedIndex = index;
    this.updateSelection();
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  refresh(): void {
    for (let i = FIRST_INVENTORY_SLOT; i < SLOT_COUNT; i++) {
      const slotEl = this.slots[i];
      const icon = slotEl.querySelector('.building-icon') as HTMLElement;
      const badge = slotEl.querySelector('.count-badge') as HTMLElement;
      const data = this.inventory.getSlot(i);

      if (data) {
        icon.style.backgroundImage = `url(${getUiIconUrl(data.building.type)})`;
        icon.style.display = '';
        icon.dataset.type = data.building.type;
        badge.textContent = String(data.count);
        badge.style.display = data.count > 1 ? '' : 'none';
      } else {
        icon.style.backgroundImage = '';
        icon.style.display = 'none';
        icon.removeAttribute('data-type');
        badge.style.display = 'none';
      }
    }
  }

  getSlotData(index: number): InventorySlot | null {
    if (index < FIRST_INVENTORY_SLOT) {
      return null;
    }
    return this.inventory.getSlot(index);
  }

  private updateSelection(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].classList.toggle('selected', i === this.selectedIndex);
    }
  }
}
