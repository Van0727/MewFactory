import {

  CHARACTER_ATTRIBUTE_IDS,

  CHARACTER_ATTRIBUTE_LABELS,

  formatCharacterValue,

  type CharacterAttributeId,

} from '../data/character';

import type { CharacterState } from '../game/CharacterState';
import { formatCompactNumber } from '../config';
import type { PlayerRuby } from '../game/PlayerRuby';
import { getRubyUrl } from '../render/assets';



export class AttributeShopPanel {

  private container: HTMLElement;

  private characterState: CharacterState;

  private playerRuby: PlayerRuby;

  private onUpgrade: (attr: CharacterAttributeId) => void;

  private titleEl: HTMLElement;

  private itemsEl: HTMLElement;



  constructor(

    container: HTMLElement,

    characterState: CharacterState,

    playerRuby: PlayerRuby,

    onUpgrade: (attr: CharacterAttributeId) => void,

  ) {

    this.container = container;

    this.characterState = characterState;

    this.playerRuby = playerRuby;

    this.onUpgrade = onUpgrade;

    this.container.innerHTML = '';

    this.container.className = 'attribute-shop-panel is-hidden';



    this.titleEl = document.createElement('div');

    this.titleEl.className = 'shop-title';

    this.titleEl.textContent = '属性商店';

    this.container.appendChild(this.titleEl);



    this.itemsEl = document.createElement('div');

    this.itemsEl.className = 'attribute-shop-items';

    this.container.appendChild(this.itemsEl);



    this.close();

  }



  open(): void {

    this.container.classList.remove('is-hidden');

    this.renderItems();

  }



  close(): void {

    this.container.classList.add('is-hidden');

  }



  refresh(): void {

    if (this.container.classList.contains('is-hidden')) {

      return;

    }

    this.renderItems();

  }



  private renderItems(): void {

    this.itemsEl.innerHTML = '';



    for (const attr of CHARACTER_ATTRIBUTE_IDS) {

      const row = document.createElement('div');

      row.className = 'attribute-shop-row';



      const nameEl = document.createElement('span');

      nameEl.className = 'attribute-shop-name';

      nameEl.textContent = CHARACTER_ATTRIBUTE_LABELS[attr];



      const levelEl = document.createElement('span');

      levelEl.className = 'attribute-shop-level';

      levelEl.textContent = `Lv.${this.characterState.getLevel(attr)}`;



      const currentEl = document.createElement('span');

      currentEl.className = 'attribute-shop-current';

      currentEl.textContent = formatCharacterValue(
        attr,
        this.characterState.getCurrentValue(attr),
      );



      const nextEl = document.createElement('span');

      nextEl.className = 'attribute-shop-next';

      const nextValue = this.characterState.getNextLevelValue(attr);

      if (nextValue === null) {

        nextEl.textContent = '已满级';

      } else {

        nextEl.textContent = `→ ${formatCharacterValue(attr, nextValue)}`;

      }



      const price = this.characterState.getUpgradePrice(attr);

      const canUpgrade = price !== null;

      const canAfford = canUpgrade && this.playerRuby.getAmount() >= price;



      const priceEl = document.createElement('span');

      priceEl.className = 'attribute-shop-price';

      if (canUpgrade) {
        const priceNum = document.createElement('span');
        priceNum.className = 'attribute-shop-price-num';
        priceNum.textContent = formatCompactNumber(price!);
        const priceIcon = document.createElement('img');
        priceIcon.className = 'attribute-shop-price-ruby';
        priceIcon.src = getRubyUrl();
        priceIcon.alt = '';
        priceEl.appendChild(priceNum);
        priceEl.appendChild(priceIcon);
      } else {
        priceEl.textContent = '—';
      }



      const btn = document.createElement('button');

      btn.type = 'button';

      btn.className = 'shop-btn building-shop-buy attribute-shop-upgrade';

      btn.textContent = '升级';

      btn.disabled = !canAfford;

      btn.classList.toggle('is-affordable', canAfford);

      btn.addEventListener('click', () => {

        this.onUpgrade(attr);

      });



      row.appendChild(nameEl);

      row.appendChild(levelEl);

      row.appendChild(currentEl);

      row.appendChild(nextEl);

      row.appendChild(priceEl);

      row.appendChild(btn);

      this.itemsEl.appendChild(row);

    }

  }

}


