/* Shared controls for static and dynamically-created UI. */
(() => {
  const selectControls = new WeakMap();
  class SelectControl {
    constructor(select) {
      this.select = select;
      selectControls.set(select, this);
      select.tabIndex = -1;
      select.dataset.uiSelect = 'true';
      select.classList.add('ui-native-select');
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.className = 'ui-select-trigger';
      this.button.setAttribute('aria-haspopup', 'listbox');
      this.button.setAttribute('aria-expanded', 'false');
      const label = select.closest('label');
      this.label =
        select.getAttribute('aria-label') ||
        label?.firstChild?.textContent?.trim() ||
        'Choose an option';
      this.menu = document.createElement('div');
      this.menu.className = 'ui-select-options';
      this.menu.setAttribute('popover', 'auto');
      this.menu.setAttribute('role', 'listbox');
      this.menu.setAttribute('aria-label', this.label);
      select.after(this.button, this.menu);
      this.button.onclick = () => this.open();
      this.button.onkeydown = (event) => {
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault();
          this.open();
        }
      };
      this.menu.addEventListener('toggle', (event) =>
        this.button.setAttribute('aria-expanded', String(event.newState === 'open')),
      );
      this.menu.onkeydown = (event) => {
        const options = [...this.menu.querySelectorAll('button:not(:disabled)')];
        const index = options.indexOf(document.activeElement);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? options.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
          options[next]?.focus();
        }
      };
      select.addEventListener('change', () => this.refresh());
      select.addEventListener('invalid', (event) => {
        event.preventDefault();
        this.button.focus();
        this.button.setAttribute('aria-invalid', 'true');
      });
      select.form?.addEventListener('reset', () => setTimeout(() => this.refresh()));
      new MutationObserver(() => this.refresh()).observe(select, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      this.refresh();
    }
    refresh() {
      this.button.textContent = this.select.selectedOptions[0]?.textContent || 'Choose';
      this.button.setAttribute('aria-label', this.label + ': ' + this.button.textContent);
      this.button.disabled = this.select.disabled;
      this.button.hidden = this.select.hidden;
      this.button.removeAttribute('aria-invalid');
    }
    open() {
      this.refresh();
      this.menu.replaceChildren();
      [...this.select.options].forEach((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = option.textContent;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(option.selected));
        button.disabled = option.disabled;
        button.onclick = () => {
          this.select.value = option.value;
          this.select.dispatchEvent(new Event('change', { bubbles: true }));
          this.refresh();
          this.menu.hidePopover();
          this.button.focus();
        };
        this.menu.append(button);
      });
      const rect = this.button.getBoundingClientRect();
      this.menu.style.left = Math.max(8, rect.left) + 'px';
      this.menu.style.top = Math.min(rect.bottom + 4, innerHeight - 160) + 'px';
      this.menu.style.width = Math.min(rect.width, innerWidth - 16) + 'px';
      this.menu.style.maxHeight =
        Math.max(140, innerHeight - Math.min(rect.bottom + 4, innerHeight - 160) - 12) + 'px';
      this.menu.showPopover();
      (
        this.menu.querySelector('[aria-selected="true"]:not(:disabled)') ||
        this.menu.querySelector('button:not(:disabled)')
      )?.focus();
    }
  }
  class DialogControl {
    static enhance(button) {
      if (button.dataset.uiClose) return;
      button.dataset.uiClose = 'true';
      button.classList.add('ui-close');
      button.textContent = '';
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = 'close';
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);
      if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Close');
    }
  }
  class MenuControl {
    static enhance(button) {
      button.classList.add('ui-menu-item');
      button.classList.remove('tonal-button');
    }
  }
  function enhance() {
    document
      .querySelectorAll('dialog button[id^="close-"],dialog button[aria-label^="Close"]')
      .forEach(DialogControl.enhance);
    document.querySelectorAll('[role="menu"] button').forEach(MenuControl.enhance);
    document.querySelectorAll('select').forEach((select) => {
      if (selectControls.has(select)) selectControls.get(select).refresh();
      else new SelectControl(select);
    });
  }
  enhance();
  new MutationObserver((records) => {
    if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1)))
      enhance();
  }).observe(document.body, { childList: true, subtree: true });
  window.SMRUI = { SelectControl, DialogControl, MenuControl };
})();
