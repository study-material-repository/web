/* Deterministic 7 by 7 pixel portraits: a seed, no uploaded image. */
window.smrAvatar = function (seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return n >>> 0;
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 7 7');
  svg.classList.add('pixel-avatar');
  svg.setAttribute('aria-label', 'Generated avatar');
  svg.setAttribute('role', 'img');
  const colors = ['#1967d2', '#5f6368', '#8ab4f8'];
  const color = colors[next() % colors.length];
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 4; x++)
      if (next() % 2) {
        for (const col of new Set([x, 6 - x])) {
          const r = document.createElementNS(svg.namespaceURI, 'rect');
          r.setAttribute('x', col);
          r.setAttribute('y', y);
          r.setAttribute('width', 1);
          r.setAttribute('height', 1);
          r.setAttribute('fill', color);
          svg.append(r);
        }
      }
  return svg;
};
window.setupWebsiteExtras = function ({ state, callServer, requestAccess }) {
  const account = document.querySelector('#activity'),
    summary = document.createElement('section');
  summary.className = 'account-insights';
  account.querySelector('.balance-summary').after(summary);
  const catalogue = document.querySelector('.catalogue-card');
  const lists = document.createElement('section');
  lists.className = 'catalogue-extras';
  catalogue.after(lists);
  let data = null,
    token = '',
    loading = null;
  function render() {
    if (!data) return;
    summary.replaceChildren();
    const portrait = document.createElement('div');
    portrait.className = 'avatar-settings';
    portrait.append(smrAvatar(data.avatar_seed));
    const change = document.createElement('button');
    change.className = 'tonal-button';
    change.textContent = 'Change avatar';
    change.onclick = async () => {
      change.disabled = true;
      try {
        data = await callServer('websiteData', { operation: 'avatar', seed: crypto.randomUUID() });
        render();
      } finally {
        change.disabled = false;
      }
    };
    portrait.append(change);
    summary.append(portrait);
    const grid = document.createElement('dl');
    grid.className = 'stats-grid';
    const stats = data.stats;
    for (const [label, value] of [
      ['Balance rank', data.coin_rank],
      ['Tasks proposed', stats?.tasks_proposed],
      ['Proposals activated', stats?.tasks_approved],
      ['Files contributed', stats?.contributions],
      ['Reviews', stats?.reviews],
      ['Verified restricted files', data.verified_files],
    ]) {
      const box = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value ?? '—';
      box.append(dt, dd);
      grid.append(box);
    }
    summary.append(grid);
    if (data.admin) {
      const manage = document.createElement('button');
      manage.className = 'tonal-button';
      manage.textContent = 'External resources';
      manage.onclick = manageResources;
      summary.append(manage);
      const admin = document.createElement('details');
      const title = document.createElement('summary');
      title.textContent = 'Site activity';
      admin.append(title);
      const p = document.createElement('p');
      p.textContent = `${data.admin.members} members · ${data.admin.active_7_days} active in 7 days · ${data.admin.visits} visits · ${data.admin.messages} messages`;
      admin.append(p);
      summary.append(admin);
    }
    const expanded = new Set(
      [...lists.querySelectorAll('details[open]')].map((x) => x.dataset.list),
    );
    lists.replaceChildren();
    for (const [key, title] of [
      ['recent', 'Recently opened'],
      ['additions', 'New additions'],
    ]) {
      const details = document.createElement('details');
      details.dataset.list = key;
      details.open = expanded.has(key);
      const heading = document.createElement('summary');
      heading.textContent = title;
      details.append(heading);
      for (const node of data[key] || []) {
        const a = document.createElement('a');
        a.href = node.web_url || 'https://drive.google.com/open?id=' + encodeURIComponent(node.id);
        a.textContent = node.name;
        a.onclick = (e) => {
          e.preventDefault();
          requestAccess(node, true);
        };
        details.append(a);
      }
      if (!data[key]?.length) {
        const p = document.createElement('p');
        p.textContent =
          key === 'recent'
            ? 'Files you open will appear here.'
            : 'No new files since tracking began.';
        details.append(p);
      }
      lists.append(details);
    }
  }
  async function manageResources() {
    const modal = document.createElement('dialog');
    modal.className = 'account-dialog';
    modal.innerHTML =
      '<div class="dialog-scroll"><div class="dialog-header"><h2>External resources</h2><button aria-label="Close" class="icon-button">×</button></div><form class="task-form"><label>Name<input name="name" required maxlength="120"></label><label>Find destination<input name="search" type="search"></label><label>Destination<select name="parent" required></select></label><label>Playlist or Drive folder link<input name="url" type="url" required></label><button class="tonal-button">Add resource</button></form><p role="status"></p><div class="resource-list"></div></div>';
    document.body.append(modal);
    modal.querySelector('[aria-label=Close]').onclick = () => modal.close();
    modal.addEventListener('close', () => modal.remove());
    modal.showModal();
    const form = modal.querySelector('form'),
      status = modal.querySelector('[role=status]'),
      list = modal.querySelector('.resource-list');
    function folders() {
      const query = form.elements.search.value.toLowerCase();
      form.elements.parent.replaceChildren();
      for (const n of state.snapshot?.nodes || [])
        if (n.kind === 'folder' && !n.external && n.name.toLowerCase().includes(query)) {
          const o = document.createElement('option');
          o.value = n.id;
          o.textContent = n.name;
          form.elements.parent.append(o);
        }
    }
    folders();
    form.elements.search.oninput = folders;
    function rows(items) {
      list.replaceChildren();
      for (const item of items) {
        const d = document.createElement('details'),
          h = document.createElement('summary'),
          p = document.createElement('p'),
          remove = document.createElement('button');
        h.textContent = item.name;
        p.textContent =
          item.error ||
          'Last checked: ' + (item.checked ? new Date(item.checked).toLocaleString() : 'Pending');
        remove.textContent = 'Remove';
        remove.className = 'text-button';
        remove.onclick = async () => {
          if (confirm('Remove this resource from the website?')) {
            try {
              rows(await callServer('externalResources', { operation: 'remove', id: item.id }));
            } catch (e) {
              status.textContent = e.message;
            }
          }
        };
        d.append(h, p, remove);
        list.append(d);
      }
    }
    try {
      rows(await callServer('externalResources', {}));
    } catch (e) {
      status.textContent = e.message;
    }
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submit = form.querySelector('button');
      submit.disabled = true;
      try {
        rows(
          await callServer('externalResources', {
            operation: 'add',
            name: form.elements.name.value,
            parent_id: form.elements.parent.value,
            url: form.elements.url.value,
          }),
        );
        status.textContent =
          'Added. Refresh the catalogue to see it; source contents refresh in the background.';
        form.elements.name.value = '';
        form.elements.url.value = '';
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };
  }
  async function load() {
    if (token !== state.token) {
      token = state.token;
      data = null;
      summary.replaceChildren();
      lists.replaceChildren();
    }
    if (!token) return;
    if (loading) return loading;
    const current = token;
    loading = callServer('websiteData', {})
      .then((result) => {
        if (current === state.token) {
          data = result;
          render();
        }
      })
      .catch(() => {})
      .finally(() => (loading = null));
    return loading;
  }
  function opened(node) {
    if (!state.token) return;
    const current = state.token;
    callServer('websiteData', { operation: 'opened', file_id: node.id })
      .then((result) => {
        if (current === state.token) {
          data = result;
          render();
        }
      })
      .catch(() => {});
  }
  document.addEventListener('smr-view', () => {
    lists.hidden = document.querySelector('#top').hidden;
  });
  return { load, opened };
};
