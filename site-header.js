(() => {
  const api = window.SMRApp;
  const header = document.querySelector('.top-bar');
  const search = document.querySelector('label.search');
  const tip = document.createElement('p');
  tip.className = 'mascot-tip';
  tip.setAttribute('aria-live', 'off');
  search.before(tip);
  const toggle = document.createElement('button');
  toggle.className = 'icon-button header-search-toggle';
  toggle.type = 'button';
  toggle.title = 'Search materials';
  toggle.setAttribute('aria-label', 'Search materials');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">search</span>';
  header.append(toggle);
  const closeSearch = () => {
    header.classList.remove('search-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.onclick = () => {
    const opened = header.classList.toggle('search-open');
    toggle.setAttribute('aria-expanded', String(opened));
    if (opened) search.querySelector('input').focus();
  };
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      toggle.focus();
    }
  });
  document.addEventListener('smr-view', (event) => {
    toggle.hidden = event.detail.view !== 'top';
    closeSearch();
  });
  toggle.hidden = !['', '#top'].includes(location.hash);
  let data = { tips: [], interval_minutes: 60 },
    lastTip = '';
  let offset = 0;
  try {
    let seed = localStorage.getItem('smr_tip_seed');
    if (!seed) {
      seed = String(Math.floor(Math.random() * 1000000));
      localStorage.setItem('smr_tip_seed', seed);
    }
    offset = Number(seed) || 0;
  } catch {}
  function render() {
    const active = data.tips.filter((item) => item.enabled !== false);
    const item =
      active[(Math.floor(Date.now() / (data.interval_minutes * 60000)) + offset) % active.length];
    const signature = JSON.stringify(item);
    if (signature === lastTip) return;
    lastTip = signature;
    tip.replaceChildren();
    if (!item) return;
    const matches = [];
    for (const link of item.links || []) {
      const start = item.text.indexOf(link.text);
      if (
        start >= 0 &&
        !matches.some((match) => start < match.end && start + link.text.length > match.start)
      )
        matches.push({ ...link, start, end: start + link.text.length });
    }
    matches.sort((a, b) => a.start - b.start);
    let cursor = 0;
    for (const link of matches) {
      tip.append(document.createTextNode(item.text.slice(cursor, link.start)));
      const a = document.createElement('a');
      a.textContent = link.text;
      a.href = link.url;
      if (link.url.startsWith('https://')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      tip.append(a);
      cursor = link.end;
    }
    tip.append(document.createTextNode(item.text.slice(cursor)));
  }
  async function load() {
    try {
      data = await api.callServer('siteTips');
      localStorage.setItem('smr_tips', JSON.stringify(data));
      render();
    } catch {
      /* Keep the saved tip when offline. */
    }
  }
  try {
    const saved = JSON.parse(localStorage.getItem('smr_tips'));
    if (saved?.tips) {
      data = saved;
      render();
    }
  } catch {}
  document.querySelector('.brand').addEventListener('click', (event) => {
    if (['', '#top'].includes(location.hash)) {
      event.preventDefault();
      offset++;
      lastTip = '';
      render();
    }
  });
  load();
  setInterval(render, 30000);
  setInterval(load, 300000);
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'tonal-button';
  edit.textContent = 'Manage tips';
  document.querySelector('#activity .workspace-heading').append(edit);
  const auth = () => {
    edit.hidden = !api.isAdmin();
  };
  auth();
  document.addEventListener('smr-account', auth);
  function input(label, value, type = 'text') {
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    const field = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') field.type = type;
    field.value = value;
    wrapper.append(field);
    return { wrapper, field };
  }
  edit.onclick = async () => {
    const modal = document.createElement('dialog');
    modal.className = 'account-dialog tips-editor';
    const heading = document.createElement('div');
    heading.className = 'dialog-heading';
    const title = document.createElement('h2');
    title.textContent = 'Tips from the mascot';
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close tips');
    close.onclick = () => modal.close();
    heading.append(title, close);
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.innerHTML = '<span class="spinner" aria-label="Loading tips"></span>';
    modal.append(heading, status);
    document.body.append(modal);
    modal.showModal();
    modal.onclose = () => modal.remove();
    let settings;
    try {
      settings = await api.callServer('adminSiteTips', { operation: 'get' });
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    status.textContent = '';
    const form = document.createElement('form');
    const interval = input('Change tip every (minutes)', settings.interval_minutes, 'number');
    interval.field.min = 1;
    interval.field.max = 10080;
    interval.field.required = true;
    form.append(interval.wrapper);
    const list = document.createElement('div');
    list.className = 'tips-editor-list';
    form.append(list);
    const rows = [];
    function addTip(item = { id: crypto.randomUUID(), text: '', enabled: true, links: [] }) {
      const row = document.createElement('details');
      row.className = 'tip-editor-row';
      const summary = document.createElement('summary');
      summary.textContent = item.text || 'New tip';
      row.append(summary);
      if (!item.text) row.open = true;
      const text = input('Sentence', item.text, 'textarea');
      text.field.required = true;
      text.field.maxLength = 500;
      text.field.addEventListener(
        'input',
        () => (summary.textContent = text.field.value || 'New tip'),
      );
      const enabled = document.createElement('input');
      enabled.type = 'checkbox';
      enabled.checked = item.enabled;
      const enabledLabel = document.createElement('label');
      enabledLabel.className = 'tip-enabled';
      enabledLabel.append(enabled, document.createTextNode('Show this tip'));
      const links = document.createElement('div');
      links.className = 'tip-links';
      const linkRows = [];
      const button = (label, run) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'text-button';
        b.textContent = label;
        b.onclick = run;
        return b;
      };
      function addLink(value = { text: '', url: '' }) {
        const box = document.createElement('div');
        box.className = 'tip-link-row';
        const label = input('Linked words', value.text),
          url = input('URL or app page (#chat, #contribute, #activity)', value.url);
        label.field.required = true;
        url.field.required = true;
        box.append(
          label.wrapper,
          url.wrapper,
          button('Remove link', () => box.remove()),
        );
        links.append(box);
        linkRows.push({ box, label, url });
      }
      const body = document.createElement('div');
      body.className = 'tip-editor-body';
      body.append(
        enabledLabel,
        text.wrapper,
        links,
        button('Add link', () => addLink()),
        button('Remove tip', () => row.remove()),
      );
      row.append(body);
      list.append(row);
      item.links.forEach(addLink);
      rows.push({ row, item, text, enabled, linkRows });
    }
    settings.tips.forEach(addTip);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'tonal-button';
    add.textContent = 'Add tip';
    add.onclick = () => addTip();
    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'tonal-button';
    save.textContent = 'Save tips';
    form.append(add, save);
    modal.append(form);
    form.onsubmit = async (event) => {
      event.preventDefault();
      save.disabled = true;
      status.innerHTML = '<span class="spinner" aria-label="Saving tips"></span>';
      try {
        const result = await api.callServer('adminSiteTips', {
          operation: 'save',
          version: settings.version,
          interval_minutes: Number(interval.field.value),
          tips: rows
            .filter((r) => r.row.isConnected)
            .map((r) => ({
              id: r.item.id,
              text: r.text.field.value,
              enabled: r.enabled.checked,
              links: r.linkRows
                .filter((l) => l.box.isConnected)
                .map((l) => ({ text: l.label.field.value, url: l.url.field.value })),
            })),
        });
        data = result;
        localStorage.setItem('smr_tips', JSON.stringify(data));
        render();
        modal.close();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    };
  };
})();
