import type { Building } from './Building';
import { buildingStackKey } from './Building';
import { getBuildingPrice } from '../data/buildings';

export interface InventorySlot {
  building: Building;
  count: number;
}

export const INVENTORY_SLOT_COUNT = 9;
export const PICKUP_SLOT_INDEX = 0;
export const FIRST_INVENTORY_SLOT = 1;

export class Inventory {
  private slots: (InventorySlot | null)[];

  constructor() {
    this.slots = Array.from({ length: INVENTORY_SLOT_COUNT }, () => null);
  }

  getSlot(index: number): InventorySlot | null {
    if (index < FIRST_INVENTORY_SLOT || index >= INVENTORY_SLOT_COUNT + FIRST_INVENTORY_SLOT) {
      return null;
    }
    return this.slots[index - FIRST_INVENTORY_SLOT];
  }

  getAllSlots(): (InventorySlot | null)[] {
    return [...this.slots];
  }

  addBuilding(building: Building): boolean {
    const key = buildingStackKey(building);

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot && buildingStackKey(slot.building) === key) {
        slot.count += 1;
        return true;
      }
    }

    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = { building: { ...building }, count: 1 };
        return true;
      }
    }

    return false;
  }

  takeOne(slotIndex: number): Building | null {
    const invIndex = slotIndex - FIRST_INVENTORY_SLOT;
    if (invIndex < 0 || invIndex >= this.slots.length) {
      return null;
    }

    const slot = this.slots[invIndex];
    if (!slot || slot.count <= 0) {
      return null;
    }

    const building = { ...slot.building };
    slot.count -= 1;
    if (slot.count <= 0) {
      this.slots[invIndex] = null;
    }
    return building;
  }

  hasItems(slotIndex: number): boolean {
    const slot = this.getSlot(slotIndex);
    return slot !== null && slot.count > 0;
  }

  /** 展开背包内全部建筑（不含 0 号拾取格） */
  flattenProductionParts(): Building[] {
    const parts: Building[] = [];
    for (const slot of this.slots) {
      if (!slot) {
        continue;
      }
      for (let i = 0; i < slot.count; i++) {
        parts.push({ ...slot.building });
      }
    }
    return parts;
  }

  /** 按堆叠键精确扣除 1 个建筑 */
  removeOne(building: Building): boolean {
    const key = buildingStackKey(building);
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot || buildingStackKey(slot.building) !== key) {
        continue;
      }
      slot.count -= 1;
      if (slot.count <= 0) {
        this.slots[i] = null;
      }
      return true;
    }
    return false;
  }

  clear(): void {
    this.slots = Array.from({ length: INVENTORY_SLOT_COUNT }, () => null);
  }

  /** 按购买原价回收全部堆叠建筑 */
  sellAll(): { amount: number; count: number } {
    let amount = 0;
    let count = 0;

    for (const slot of this.slots) {
      if (!slot) {
        continue;
      }
      const unitPrice = getBuildingPrice(slot.building.type, slot.building.level);
      amount += unitPrice * slot.count;
      count += slot.count;
    }

    this.clear();
    return { amount, count };
  }
}
