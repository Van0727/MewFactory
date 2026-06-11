const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export class Hotbar {
  private slots: HTMLElement[] = [];
  private selectedIndex = 0;

  constructor(container: HTMLElement) {
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      slot.dataset.index = String(i);

      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = KEY_LABELS[i];
      slot.appendChild(label);

      container.appendChild(slot);
      this.slots.push(slot);
    }

    this.updateSelection();
  }

  select(index: number): void {
    if (index < 0 || index > 9) {
      return;
    }
    this.selectedIndex = index;
    this.updateSelection();
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  private updateSelection(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].classList.toggle('selected', i === this.selectedIndex);
    }
  }
}
