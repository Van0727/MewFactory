export class GmGoldButton {
  constructor(container: HTMLElement, onClick: () => void) {
    container.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gm-gold-btn';
    btn.textContent = 'GM金币+10000';
    btn.addEventListener('click', onClick);
    container.appendChild(btn);
  }
}
