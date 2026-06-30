function makeBtn(className: string, line1: string, line2: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `factory-action-btn ${className}`;
  btn.innerHTML =
    `<span class="factory-action-btn-line">${line1}</span>` +
    `<span class="factory-action-btn-line">${line2}</span>`;
  return btn;
}

export type AutoBuildPreviewResult = {
  canProceed: boolean;
  message: string;
};

export class ClearAllConfirm {
  private modal: HTMLElement;
  private messageEl: HTMLElement;
  private cancelBtn: HTMLButtonElement;
  private confirmBtn: HTMLButtonElement;
  private pendingConfirm: (() => void) | null = null;

  constructor(
    actionsRoot: HTMLElement,
    modalRoot: HTMLElement,
    onClear: () => void,
    onAutoBuildPreview: () => AutoBuildPreviewResult,
    onAutoBuild: () => void,
  ) {
    actionsRoot.innerHTML = '';

    const autoBuildBtn = makeBtn('auto-build-btn', '自动', '搭建');
    autoBuildBtn.addEventListener('click', () => {
      const check = onAutoBuildPreview();
      if (!check.canProceed) {
        this.notify(check.message);
        return;
      }
      this.ask('使用背包内的部件，自动搭建流水线？', onAutoBuild);
    });

    const clearBtn = makeBtn('clear-factory-btn', '清空', '工厂');
    clearBtn.addEventListener('click', () => {
      this.ask('清除工厂内所有流水线？', onClear);
    });

    actionsRoot.appendChild(autoBuildBtn);
    actionsRoot.appendChild(clearBtn);

    this.modal = document.createElement('div');
    this.modal.className = 'confirm-dialog-overlay is-hidden';
    this.modal.innerHTML = `
      <div class="confirm-dialog">
        <p class="confirm-dialog-message"></p>
        <div class="confirm-dialog-actions">
          <button type="button" class="confirm-dialog-btn confirm-dialog-cancel">取消</button>
          <button type="button" class="confirm-dialog-btn confirm-dialog-confirm">确认</button>
        </div>
      </div>
    `;

    this.messageEl = this.modal.querySelector('.confirm-dialog-message')!;
    this.cancelBtn = this.modal.querySelector('.confirm-dialog-cancel')! as HTMLButtonElement;
    this.confirmBtn = this.modal.querySelector('.confirm-dialog-confirm')! as HTMLButtonElement;

    this.cancelBtn.addEventListener('click', () => this.hide());
    this.confirmBtn.addEventListener('click', () => {
      const action = this.pendingConfirm;
      this.hide();
      action?.();
    });
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    modalRoot.appendChild(this.modal);
  }

  notify(message: string): void {
    this.messageEl.textContent = message;
    this.pendingConfirm = null;
    this.cancelBtn.classList.add('is-hidden');
    this.confirmBtn.textContent = '知道了';
    this.modal.classList.remove('is-hidden');
  }

  private ask(message: string, onConfirm: () => void): void {
    this.messageEl.textContent = message;
    this.pendingConfirm = onConfirm;
    this.cancelBtn.classList.remove('is-hidden');
    this.confirmBtn.textContent = '确认';
    this.modal.classList.remove('is-hidden');
  }

  private hide(): void {
    this.pendingConfirm = null;
    this.cancelBtn.classList.remove('is-hidden');
    this.confirmBtn.textContent = '确认';
    this.modal.classList.add('is-hidden');
  }
}
