import {
  BUILDING_SHOP_BASE_PRICE,
  BUILDING_SHOP_MAX_LEVEL,
} from '../config';
import type { BuildingShopKind } from '../game/buildingShopCatalog';
import {
  getBuildingShopItemLabel,
  getBuildingShopTitle,
} from '../game/buildingShopCatalog';
import { createShopBuilding } from '../game/buildingShopItems';
import type { Inventory } from '../game/Inventory';
import type { PlayerGold } from '../game/PlayerGold';

export class BuildingShopPanel {
  private container: HTMLElement;
  private inventory: Inventory;
  private playerGold: PlayerGold;
  private onChange: () => void;
  private titleEl: HTMLElement;
  private itemsEl: HTMLElement;
  private openKind: BuildingShopKind | null = null;

  constructor(
    container: HTMLElement,
    inventory: Inventory,
    playerGold: PlayerGold,
    onChange: () => void,
  ) {
    this.container = container;
    this.inventory = inventory;
    this.playerGold = playerGold;
    this.onChange = onChange;
    this.container.innerHTML = '';
    this.container.className = 'building-shop-panel is-hidden';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'shop-title';
    this.container.appendChild(this.titleEl);

    this.itemsEl = document.createElement('div');
    this.itemsEl.className = 'building-shop-items';
    this.container.appendChild(this.itemsEl);

    this.close();
  }

  open(kind: BuildingShopKind): void {
    if (this.openKind === kind && !this.container.classList.contains('is-hidden')) {
      this.refresh();
      return;
    }
    this.openKind = kind;
    this.container.classList.remove('is-hidden');
    this.renderItems();
  }

  close(): void {
    this.openKind = null;
    this.container.classList.add('is-hidden');
  }

  refresh(): void {
    if (this.openKind === null || this.container.classList.contains('is-hidden')) {
      return;
    }
    this.renderItems();
  }

  private renderItems(): void {
    if (this.openKind === null) {
      return;
    }

    const kind = this.openKind;
    this.titleEl.textContent = getBuildingShopTitle(kind);
    this.itemsEl.innerHTML = '';

    for (let level = 1; level <= BUILDING_SHOP_MAX_LEVEL; level++) {
      const price = getBuildingShopPrice(kind, level);
      const canAfford = this.playerGold.getAmount() >= price;

      const row = document.createElement('div');
      row.className = 'building-shop-row';

      const label = document.createElement('span');
      label.className = 'building-shop-label';
      label.textContent = getBuildingShopItemLabel(kind, level);

      const priceEl = document.createElement('span');
      priceEl.className = 'building-shop-price';
      priceEl.textContent = `${price} 金`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-btn building-shop-buy';
      btn.textContent = '购买';
      btn.disabled = !canAfford;
      btn.classList.toggle('is-affordable', canAfford);
      btn.addEventListener('click', () => {
        this.tryBuy(kind, level, price);
      });

      row.appendChild(label);
      row.appendChild(priceEl);
      row.appendChild(btn);
      this.itemsEl.appendChild(row);
    }
  }

  private tryBuy(kind: BuildingShopKind, level: number, price: number): void {
    if (!this.playerGold.spend(price)) {
      this.refresh();
      return;
    }
    const building = createShopBuilding(kind, level);
    const added = this.inventory.addBuilding(building);
    if (!added) {
      this.playerGold.add(price);
      this.refresh();
      return;
    }
    this.onChange();
    this.refresh();
  }
}

export function getBuildingShopPrice(kind: BuildingShopKind, level: number): number {
  return BUILDING_SHOP_BASE_PRICE[kind] * level;
}
