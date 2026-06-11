import { BuildingType, createBuilding, getBuildingLabel } from '../game/Building';
import type { Inventory } from '../game/Inventory';

const SHOP_ITEMS: { type: BuildingType; label: string }[] = [
  { type: BuildingType.CatNest, label: '猫窝' },
  { type: BuildingType.Conveyor, label: '传送带' },
  { type: BuildingType.PackingBox, label: '包装箱' },
  { type: BuildingType.MutationGate, label: '变异门' },
];

export class ShopPanel {
  private container: HTMLElement;
  private inventory: Inventory;
  private onChange: () => void;

  constructor(container: HTMLElement, inventory: Inventory, onChange: () => void) {
    this.container = container;
    this.inventory = inventory;
    this.onChange = onChange;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'shop-title';
    title.textContent = '购买';
    this.container.appendChild(title);

    for (const item of SHOP_ITEMS) {
      const btn = document.createElement('button');
      btn.className = 'shop-btn';
      btn.textContent = item.label;
      btn.title = getBuildingLabel(item.type);
      btn.addEventListener('click', () => {
        const added = this.inventory.addBuilding(createBuilding(item.type));
        if (added) {
          this.onChange();
        }
      });
      this.container.appendChild(btn);
    }
  }
}
