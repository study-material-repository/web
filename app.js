(() => {
  'use strict';

  const state = {
    token: localStorage.getItem('smr_session_token_v1') || '',
    memberId: localStorage.getItem('smr_member_id_v1') || '',
    member: null,
    snapshot: null,
    query: '',
    schoolChallengeId: '',
    loginChallengeId: '',
    contributionTargetId: '',
    expandedNodeIds: new Set(),
    expansionStateKey: '',
    contextNodeId: '',
    contextDepth: 0
  };
  const tree = document.querySelector('#catalogue-tree');
  const search = document.querySelector('#catalogue-search');
  const emptyState = document.querySelector('#empty-state');
  const syncStatus = document.querySelector('#sync-status');
  const accountButton = document.querySelector('#account-button');
  const dialog = document.querySelector('#account-dialog');
  const formMessage = document.querySelector('#form-message');
  const forms = [...document.querySelectorAll('#account-dialog .auth-form')];
  const toast = document.querySelector('#toast');
  const requestDialog = document.querySelector('#request-dialog');
  const requestSummary = document.querySelector('#request-summary');
  const requestDetail = document.querySelector('#request-detail');
  const requestProgress = document.querySelector('#request-progress');
  const requestProgressMessage = document.querySelector('#request-progress-message');
  const requestCancel = document.querySelector('#cancel-request');
  const requestConfirm = document.querySelector('#confirm-request');
  const contributionDialog = document.querySelector('#contribution-dialog');
  const contributionForm = document.querySelector('#contribution-form');
  const contributionTargetPath = document.querySelector('#contribution-target-path');
  const contributionMessage = document.querySelector('#contribution-message');
  const treeMenu = document.querySelector('#tree-menu');
  const treeMenuToggle = document.querySelector('#tree-menu-toggle');
  const treeMenuRequest = document.querySelector('#tree-menu-request');
  const treeMenuOpen = document.querySelector('#tree-menu-open');
  let toastTimer;
  let resolvePendingRequest = null;
  let requestInFlight = false;

  function apiUrl() {
    const configured = String(window.SMR_API_BASE_URL || '').replace(/\/+$/, '');
    if (!configured) throw new Error('The SMR connection has not been configured yet.');
    return configured + '/api';
  }

  const viewCache = new Map();
  let cacheEpoch = 0, warmingToken = '';
  const cachedReads = new Set(['communityTasks', 'communityReviewQueue', 'memberRequestHistory', 'chatSnapshot', 'communityProfile']);
  function invalidateViews() { cacheEpoch++; viewCache.clear(); }
  async function warmViews() {
    const token = state.token;
    if (!token || warmingToken === token) return;
    warmingToken = token;
    // Two background reads at a time, rather than a burst of Apps Script jobs.
    await Promise.allSettled([callServer('communityTasks'), callServer('communityReviewQueue')]);
    let cursor = 0;
    try {
      // Warm older history too, but bound work for unusually large accounts.
      for (let page = 0; page < 20 && state.token === token; page++) {
        const result = await callServer('memberRequestHistory', cursor);
        if (result.next_cursor == null || result.next_cursor <= cursor) break;
        cursor = result.next_cursor;
      }
    } catch { /* A failed prefetch can be retried without interrupting sign-in. */ }
  }
  async function callServer(name, ...args) {
    if (!cachedReads.has(name)) {
      const result = await sendServer(name, ...args);
      if (['submitCatalogueContribution','reviewContribution','setCommunityYear','fundCommunityTask','voteCommunityTask','proposeCommunityTask','requestCatalogueAccess','sendCoins','sendChatMessage','signOut'].includes(name)) {
        invalidateViews(); warmingToken = '';
        if (name !== 'signOut') queueMicrotask(warmViews);
      }
      return result;
    }
    const token = state.token, epoch = cacheEpoch;
    const key = token + ':' + name + ':' + JSON.stringify(args);
    const cached = viewCache.get(key);
    if (cached && (cached.pending || Date.now() - cached.at < 120000)) return cached.promise;
    const entry = {at:Date.now(), pending:true};
    entry.promise = sendServer(name, ...args).then(value => {
      if (token !== state.token || epoch !== cacheEpoch) throw new Error('Account changed. Please reopen this page.');
      entry.pending = false; entry.at = Date.now(); return value;
    }).catch(error => { if (viewCache.get(key) === entry) viewCache.delete(key); throw error; });
    viewCache.set(key, entry);
    return entry.promise;
  }
  const spinnerMarkup = '<span class="spinner" role="status" aria-label="Please wait"></span>';
  function busy(element) { element.innerHTML = spinnerMarkup; }
  async function sendServer(name, ...args) {
    const requests = {
      getCatalogueSnapshot: ['catalogue_snapshot', { session_token: args[0] || '' }],
      getMemberCatalogueState: ['member_catalogue_state', { session_token: args[0] }],
      memberRequestHistory: ['member_request_history', {session_token:state.token,cursor:args[0] || 0}],
      requestSchoolSignupCode: ['request_school_signup_code', { school_email: args[0] }],
      verifySchoolSignupCode: ['verify_school_signup_code', { challenge_id: args[0], code: args[1] }],
      requestLoginCode: ['request_login_code', { email: args[0] }],
      completeLogin: ['complete_login', { challenge_id: args[0], code: args[1] }],
      passwordLogin: ['password_login', { school_email: args[0], password: args[1] }],
      setPassword: ['set_password', { session_token: args[0], password: args[1] }],
      signOut: ['sign_out', { session_token: args[0] || '' }],
      quoteCatalogueAccess: ['quote_catalogue_access', { session_token: args[0], drive_item_id: args[1] }],
      requestCatalogueAccess: ['request_catalogue_access', { session_token: args[0], drive_item_id: args[1], check_only: args[2] === true, check_token: args[3] || '' }],
      communityTasks: ['community_tasks', {session_token: state.token}],
      proposeCommunityTask: ['propose_community_task', {session_token: state.token, target_drive_item_id: args[0], title: args[1], note: args[2], task_type: args[3] || 'other'}],
      voteCommunityTask: ['vote_community_task', {session_token: state.token, task_id: args[0], support: args[1]}],
      fundCommunityTask: ['fund_community_task', {session_token: state.token, task_id: args[0], coins: args[1], request_id: args[2], withdraw: args[3] === true}],
      communityReviewQueue: ['community_review_queue', {session_token: state.token}],
      setCommunityYear: ['set_community_year', {session_token: state.token, year: args[0]}],
      reviewContribution: ['review_contribution', {session_token: state.token, contribution_id: args[0], decision: args[1], note: args[2] || '', proposed_title: args[3] || ''}],
      submitCatalogueContribution: ['submit_catalogue_contribution', { session_token: args[0], target_drive_item_id: args[1], title: args[2], source_url: args[3], note: args[4], task_id: args.length > 5 ? args[5] : state.contributionTaskId || '' }]
      ,sendCoins: ['send_coins', {session_token:state.token,recipient:args[0],coins:args[1],request_id:args[2]}]
      ,chatSnapshot: ['chat_snapshot', {session_token:state.token,peer:args[0] || ''}]
      ,sendChatMessage: ['send_chat_message', {session_token:state.token,recipient:args[0],body:args[1]}]
      ,communityProfile: ['community_profile', {session_token:state.token}]
    };
    const request = requests[name];
    if (!request) throw new Error('Unsupported SMR action.');
    const response = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: request[0], payload: request[1] })
    });
    const body = await response.json().catch(() => null);
    document.querySelectorAll('#account-dialog form[aria-busy="true"]').forEach(form => {
      form.setAttribute('aria-busy','false');
      form.querySelectorAll('.is-loading').forEach(button => { button.disabled = false; button.classList.remove('is-loading'); });
    });
    if (!body || !body.ok) throw new Error((body && body.error) || 'The SMR service could not complete that request.');
    return body.data;
  }

  function coins(value) { return (Math.round(Number(value || 0) * 100) / 100).toString(); }
  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
  }
  function closeRequestDialog(confirmed) {
    if (requestInFlight) return;
    if (!resolvePendingRequest) return;
    const resolve = resolvePendingRequest;
    resolvePendingRequest = null;
    if (!confirmed) requestDialog.close();
    resolve(confirmed);
  }
  function setRequestProgress(message, busy) {
    requestProgress.hidden = !busy;
    requestProgressMessage.textContent = message || '';
    requestCancel.disabled = Boolean(busy);
    requestConfirm.disabled = Boolean(busy);
    document.querySelector('#close-request-dialog').disabled = Boolean(busy);
    requestDialog.classList.toggle('request-dialog-busy', Boolean(busy));
  }
  function confirmRequest(node) {
    const checkingOwnedFile = Boolean(node.access.is_owned);
    requestSummary.textContent = checkingOwnedFile
      ? node.name + ' — check Drive access'
      : node.name + ' — ' + coins(Number(node.access.price_millis || 0) / 1000) + ' 🪙';
    requestDetail.textContent = checkingOwnedFile
      ? 'We will verify your completed website purchase. No coins are spent for this check.'
      : 'You will receive access to this file in Drive immediately.';
    requestConfirm.textContent = checkingOwnedFile ? 'Check access' : 'Request access';
    setRequestProgress('', false);
    requestDialog.showModal();
    return new Promise(resolve => { resolvePendingRequest = resolve; });
  }
  function setMessage(message) {
    if (message && /…$/.test(message)) busy(formMessage);
    else formMessage.textContent = message || '';
  }
  function showForm(id) {
    forms.forEach(form => { form.hidden = form.id !== id; });
    document.querySelector('#account-home').hidden = Boolean(id) || Boolean(state.member);
    document.querySelector('#signed-in-panel').hidden = !state.member || id === 'password-setup-form';
    setMessage('');
  }
  function updateAccount() {
    const signedIn = Boolean(state.member);
    document.querySelector('#activity-balance').textContent = signedIn ? coins(state.member.balance_coins) + ' 🪙' : '—';
    document.querySelector('#activity-email').textContent = signedIn ? state.member.delivery_email || state.member.school_email || '' : '';
    const treasury = document.querySelector('#treasury-summary');
    treasury.hidden = !signedIn || !state.member.is_admin;
    if (!treasury.hidden) document.querySelector('#treasury-balance').textContent = coins(state.member.treasury_balance_coins) + ' 🪙';
    document.querySelector('#activity-account').textContent = signedIn ? 'Manage account' : 'Sign in or create account';
  }
  async function loadCommunityProfile() {
    let panel = document.querySelector('#community-profile');
    if (!panel) {
      panel = document.createElement('section'); panel.id='community-profile'; panel.className='contributor-profile';
      document.querySelector('#activity .balance-summary').before(panel);
    }
    if (!state.token) { panel.hidden=true; return; }
    panel.hidden=false; busy(panel);
    try {
      const profile=await callServer('communityProfile');
      const next=profile.next_level_points;
      const progress=next ? Math.min(100,Math.round(profile.points/next*100)) : 100;
      panel.innerHTML='<div><p class="eyebrow">Community contributor</p><h2></h2><p class="profile-stats"></p></div><div class="level-progress"><span></span></div><p class="profile-next"></p>';
      panel.querySelector('h2').textContent=profile.label+' · Level '+profile.level;
      panel.querySelector('.profile-stats').textContent=profile.approved_contributions+' contributions · '+profile.reviews+' reviews · '+profile.activated_tasks+' useful tasks';
      panel.querySelector('.level-progress span').style.width=progress+'%';
      panel.querySelector('.profile-next').textContent=next ? (next-profile.points)+' points to Level '+(profile.level+1) : profile.points+' contribution points';
    } catch(error) { panel.textContent=error.message; }
  }
  function getExpansionStateKey() {
    return 'smr_catalogue_expansion_v1:' + (state.member && state.member.member_id ? state.member.member_id : state.memberId || 'guest');
  }
  function rememberMember(member) {
    state.member = member || null;
    state.memberId = state.member && state.member.member_id ? String(state.member.member_id) : '';
    if (state.memberId) localStorage.setItem('smr_member_id_v1', state.memberId);
    else localStorage.removeItem('smr_member_id_v1');
  }
  function loadExpansionState() {
    const key = getExpansionStateKey();
    if (state.expansionStateKey === key) return;
    state.expansionStateKey = key;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      state.expandedNodeIds = new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      state.expandedNodeIds = new Set();
      localStorage.removeItem(key);
    }
  }
  function saveExpansionState() {
    localStorage.setItem(state.expansionStateKey || getExpansionStateKey(), JSON.stringify([...state.expandedNodeIds]));
  }
  function folderById(id) {
    return [...tree.querySelectorAll('.tree-node-folder')].find(element => element.dataset.nodeId === String(id));
  }
  function snapshotNodeById(id) {
    return ((state.snapshot && state.snapshot.nodes) || []).find(node => String(node.id) === String(id)) || null;
  }
  function setFolderOpen(folder, open, save) {
    if (!folder) return;
    folder.dataset.open = String(open);
    folder.setAttribute('aria-expanded', String(open));
    const toggle = folder.querySelector(':scope > .tree-row .tree-toggle');
    if (toggle) toggle.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + (folder.querySelector('.tree-label') || {}).textContent);
    if (open) state.expandedNodeIds.add(folder.dataset.nodeId);
    else state.expandedNodeIds.delete(folder.dataset.nodeId);
    if (save !== false) saveExpansionState();
  }
  function setFoldersAtDepth(depth, open) {
    tree.querySelectorAll('.tree-node-folder').forEach(folder => {
      if (Number(folder.dataset.depth) === depth) setFolderOpen(folder, open, false);
    });
    saveExpansionState();
  }
  function hideTreeMenu() {
    treeMenu.hidden = true;
    state.contextNodeId = '';
  }
  function showTreeMenu(event, nodeElement) {
    event.preventDefault();
    state.contextNodeId = nodeElement.dataset.nodeId;
    state.contextDepth = Number(nodeElement.dataset.depth);
    const isFolder = nodeElement.classList.contains('tree-node-folder');
    const node = snapshotNodeById(state.contextNodeId);
    treeMenuOpen.hidden = !node || isFolder || !node.web_url;
    treeMenuRequest.hidden = !node || isFolder;
    if (!treeMenuRequest.hidden) {
      treeMenuRequest.querySelector('span:last-child').textContent = node.access.mode === 'requestable' ? 'Request this file' : 'Check Drive access';
      treeMenuRequest.querySelector('.material-symbols-outlined').textContent = node.access.is_owned ? 'verified_user' : 'add_shopping_cart';
    }
    document.querySelector('#tree-menu-contribute').hidden = !isFolder;
    document.querySelector('#tree-menu-task').hidden = !isFolder;
    treeMenuToggle.hidden = !isFolder;
    document.querySelector('#tree-menu-collapse-level').hidden = !isFolder;
    document.querySelector('#tree-menu-expand-level').hidden = !isFolder;
    if (isFolder) {
      const isOpen = nodeElement.dataset.open === 'true';
      treeMenuToggle.querySelector('span:last-child').textContent = isOpen ? 'Collapse this folder' : 'Expand this folder';
      treeMenuToggle.querySelector('.material-symbols-outlined').textContent = isOpen ? 'expand_less' : 'expand_more';
    }
    treeMenu.hidden = false;
    const menuRect = treeMenu.getBoundingClientRect();
    treeMenu.style.left = Math.max(12, Math.min(event.clientX, window.innerWidth - menuRect.width - 12)) + 'px';
    treeMenu.style.top = Math.max(12, Math.min(event.clientY, window.innerHeight - menuRect.height - 12)) + 'px';
    (isFolder ? treeMenuToggle : (treeMenuRequest.hidden ? treeMenuOpen : treeMenuRequest)).focus();
  }
  function openAccount() {
    if (state.member) document.querySelector('#signed-in-email').textContent = state.member.delivery_email;
    showForm('');
    dialog.showModal();
  }
  function cataloguePathFor(node) {
    const nodes = (state.snapshot && state.snapshot.nodes) || [];
    const byId = new Map(nodes.map(node => [String(node.id), node]));
    const pathCache = new Map();
    function pathFor(node) {
      if (pathCache.has(String(node.id))) return pathCache.get(String(node.id));
      const parent = byId.get(String(node.parent_id || ''));
      const path = (parent ? pathFor(parent) + ' › ' : '') + node.name;
      pathCache.set(String(node.id), path);
      return path;
    }
    return pathFor(node);
  }
  function openContribution(targetId) {
    if (!state.member) {
      openAccount();
      setMessage('Sign in first, then contribute material.');
      return;
    }
    const target = snapshotNodeById(targetId);
    if (!target || target.kind !== 'folder') {
      showToast('Right-click the destination folder and choose “Contribute here”.');
      return;
    }
    state.contributionTargetId = String(target.id);
    contributionTargetPath.textContent = cataloguePathFor(target);
    contributionMessage.textContent = '';
    contributionDialog.showModal();
  }
  function buildTree(nodes) {
    const byId = new Map(nodes.map(node => [String(node.id), { ...node, children: [] }]));
    const roots = [];
    byId.forEach(node => {
      const parent = byId.get(String(node.parent_id || ''));
      if (parent) parent.children.push(node); else roots.push(node);
    });
    const sortNodes = list => list
      .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }))
      .forEach(node => sortNodes(node.children));
    sortNodes(roots);
    return roots;
  }
  function matches(node) {
    const ownText = [node.name, ...(node.announcements || []).map(item => item.message)].join(' ').toLowerCase();
    return !state.query || ownText.includes(state.query) || node.children.some(matches);
  }
  async function requestAccess(node, checkOnly = false) {
    if (!state.member) {
      openAccount();
      setMessage('Sign in first, then request this item.');
      return;
    }
    try {
      if (checkOnly) {
        requestSummary.textContent = node.name;
        requestDetail.textContent = state.member.delivery_email || state.member.school_email;
        requestDialog.showModal();
      } else if (!(await confirmRequest(node))) return;
      requestInFlight = true;
      setRequestProgress(node.checkToken && !checkOnly ? 'Processing your request…' : 'Checking whether you already have access…', true);
      const result = await callServer('requestCatalogueAccess', state.token, node.id, checkOnly, node.checkToken);
      delete node.checkToken;
      requestInFlight = false;
      setRequestProgress('', false);
      requestDialog.close();
      if (result.status === 'ACCESS_REQUIRED') {
        node.checkToken = result.check_token;
        node.access = { ...node.access, mode: 'requestable', is_owned: false, price_millis: result.price_coins * 1000, purchase_drive_item_id: node.id };
        renderCatalogue();
        // Only spending coins needs confirmation. The initial check is immediate.
        return requestAccess(node);
      }
      if (result.status === 'COMPLETED') showToast('Access granted. It is now available in Drive.');
      else if (result.status === 'REPAIRED_COMPLETED_PURCHASE') showToast('Your completed purchase was delivered to Drive. No additional coins were spent.');
      else if (result.status === 'RECORDED_BUT_NOT_ACCESSIBLE') showToast(result.error);
      else if (result.status === 'ALREADY_OWNED') showToast('Drive access confirmed for ' + (result.delivery_email || state.member.delivery_email) + '. Open Drive with that account.');
      else showToast(result.error || 'The request could not be completed; your held coins were released.');
      await loadCatalogue();
    } catch (error) {
      requestInFlight = false;
      setRequestProgress('', false);
      if (requestDialog.open) requestDialog.close();
      showToast(error.message);
    }
  }
  function ownedFileUrl(node) {
    const driveId = String(node.target_drive_item_id || node.id || '');
    return driveId ? 'https://drive.google.com/open?id=' + encodeURIComponent(driveId) : '';
  }
  async function refreshMemberCatalogueState() {
    if (!state.token || !state.snapshot) return;
    const result = await callServer('getMemberCatalogueState', state.token);
    rememberMember(result.member || null);
    const owned = new Set((result.owned_item_ids || []).map(String));
    state.snapshot.nodes = (state.snapshot.nodes || []).map(node => {
      const baseAccess = node.baseAccess || node.access;
      const baseUrl = node.baseUrl === undefined ? node.web_url : node.baseUrl;
      if (!owned.has(String(node.id))) return {...node, access:baseAccess, web_url:baseUrl, baseAccess, baseUrl};
      return { ...node, baseAccess, baseUrl, access: { ...baseAccess, mode: 'open', is_owned: true }, web_url: ownedFileUrl(node) };
    });
    updateAccount();
    renderCatalogue();
    warmViews();
  }
  function createNode(node, depth) {
    if (!matches(node)) return null;
    const isFolder = node.kind === 'folder';
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node tree-node-' + (isFolder ? 'folder' : 'file');
    wrapper.dataset.nodeId = String(node.id);
    wrapper.dataset.depth = String(depth);
    wrapper.style.setProperty('--depth', depth);
    const shouldOpen = Boolean(state.query) || depth === 0 || state.expandedNodeIds.has(String(node.id));
    wrapper.dataset.open = String(shouldOpen);
    wrapper.setAttribute('role', 'treeitem');
    if (isFolder) wrapper.setAttribute('aria-expanded', String(shouldOpen));
    const row = document.createElement('div');
    row.className = 'tree-row';
    if (isFolder) {
      const toggle = document.createElement('button');
      toggle.className = 'tree-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-label', (shouldOpen ? 'Collapse ' : 'Expand ') + node.name);
      toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span>';
      toggle.addEventListener('click', () => {
        const open = wrapper.dataset.open === 'true';
        setFolderOpen(wrapper, !open);
      });
      row.append(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'tree-toggle';
      spacer.setAttribute('aria-hidden', 'true');
      row.append(spacer);
    }
    const icon = document.createElement('span');
    icon.className = 'tree-icon material-symbols-outlined';
    icon.textContent = isFolder ? 'folder' : 'description';
    icon.setAttribute('aria-hidden', 'true');
    row.append(icon);
    const requiresAccess = node.access.mode === 'requestable' && !isFolder;
    const needsConfiguration = node.access.mode === 'unconfigured';
    const isLockedFolder = node.access.mode === 'locked_folder';
    const isAction = !isFolder || requiresAccess || needsConfiguration;
    const label = document.createElement(isAction ? 'button' : 'span');
    label.className = 'tree-label' + (isAction ? ' tree-link' : '') + ((requiresAccess || needsConfiguration || isLockedFolder) ? ' tree-link-restricted' : '');
    label.textContent = String(node.name).replace(' 🪙', '');
    if (isAction) {
      label.type = 'button';
      label.title = requiresAccess ? 'Request access with coins' : needsConfiguration ? 'This coin-marked material is not configured for website requests yet' : 'Open ' + node.name;
      label.addEventListener('click', () => {
        if (requiresAccess) return requestAccess(node);
        if (needsConfiguration) return showToast('This coin-marked material is not priced for website requests yet.');
        if (!node.web_url) return showToast('Refreshing the latest catalogue…');
        window.open(node.web_url, '_blank', 'noopener');
      });
    }
    row.append(label);
    if (node.coin_marked) {
      const coin = document.createElement('span');
      coin.className = 'tree-coin';
      coin.textContent = '🪙';
      coin.setAttribute('aria-label', 'Coin-marked item');
      row.append(coin);
    }
    wrapper.append(row);
    (node.announcements || []).forEach(item => {
      const note = document.createElement('p');
      note.className = 'tree-note';
      note.textContent = item.message;
      wrapper.append(note);
    });
    if (isFolder && node.children.length) {
      const children = document.createElement('div');
      children.className = 'tree-children';
      children.setAttribute('role', 'group');
      node.children.forEach(child => {
        const childNode = createNode(child, depth + 1);
        if (childNode) children.append(childNode);
      });
      wrapper.append(children);
    }
    return wrapper;
  }
  function renderCatalogue() {
    loadExpansionState();
    tree.replaceChildren();
    const roots = buildTree(state.snapshot.nodes || []);
    let count = 0;
    roots.forEach(node => {
      const element = createNode(node, 0);
      if (element) { tree.append(element); count += 1; }
    });
    emptyState.hidden = count !== 0;
  }
  function loadCachedCatalogue() {
    try {
      const cached = JSON.parse(localStorage.getItem('smr_public_catalogue_v1') || 'null');
      if (!cached || !cached.saved_at || Date.now() - cached.saved_at > 6 * 60 * 60 * 1000) return;
      state.snapshot = cached.snapshot;
      renderCatalogue();
      syncStatus.innerHTML = '<span class="status-dot"></span>Refreshing';
    } catch {
      localStorage.removeItem('smr_public_catalogue_v1');
    }
  }
  function savePublicCatalogue(snapshot) {
    localStorage.setItem('smr_public_catalogue_v1', JSON.stringify({ saved_at: Date.now(), snapshot: { nodes: snapshot.nodes || [] } }));
  }
  async function loadCatalogue() {
    busy(syncStatus);
    try {
      state.snapshot = await callServer('getCatalogueSnapshot', '');
      loadExpansionState();
      savePublicCatalogue(state.snapshot);
      if (state.token) {
        try {
          await refreshMemberCatalogueState();
        } catch (error) {
          state.token = '';
          localStorage.removeItem('smr_session_token_v1');
          rememberMember(null);
          showToast('Your sign-in expired. Please sign in again.');
        }
      }
      updateAccount();
      renderCatalogue();
      syncStatus.innerHTML = state.snapshot.stale ? '<span class="status-dot"></span>Cached' : '<span class="status-dot"></span>Synced';
      syncStatus.title = state.snapshot.stale ? 'Showing the last saved catalogue while Google refreshes it. File access and purchases are still checked separately.' : '';
    } catch (error) {
      tree.innerHTML = '<p class="loading-state">The catalogue could not load. Refresh to try again.</p>';
      syncStatus.textContent = 'Unavailable';
      showToast(error.message);
    }
  }

  if (accountButton) accountButton.addEventListener('click', openAccount);
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  document.querySelector('#close-request-dialog').addEventListener('click', () => closeRequestDialog(false));
  document.querySelector('#cancel-request').addEventListener('click', () => closeRequestDialog(false));
  document.querySelector('#confirm-request').addEventListener('click', () => closeRequestDialog(true));
  requestDialog.addEventListener('cancel', event => { event.preventDefault(); closeRequestDialog(false); });
  document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', () => showForm('')));
  document.querySelector('#show-login').addEventListener('click', () => showForm('login-form'));
  document.querySelector('#show-signup').addEventListener('click', () => showForm('school-form'));
  dialog.addEventListener('submit', event => {
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    if (button) { form.setAttribute('aria-busy','true'); button.disabled = true; button.classList.add('is-loading'); }
  }, true);
  document.querySelector('#contribute-button').addEventListener('click', () => {
    state.contributionTaskId = '';
    chooseFolder(id => openContribution(id));
  });
  document.querySelector('#close-contribution-dialog').addEventListener('click', () => contributionDialog.close());
  document.querySelector('#sign-out').addEventListener('click', async () => {
    try { await callServer('signOut', state.token); } catch { /* Local sign-out still succeeds. */ }
    state.token = '';
    invalidateViews(); warmingToken = '';
    document.querySelector('#history-list').replaceChildren();
    document.querySelector('#review-list').replaceChildren();
    document.querySelector('#submission-list').replaceChildren();
    document.querySelector('#community-list').replaceChildren();
    rememberMember(null);
    localStorage.removeItem('smr_session_token_v1');
    updateAccount();
    dialog.close();
    loadCatalogue();
  });
  search.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    if (state.snapshot) renderCatalogue();
  });
  document.querySelector('#expand-all').addEventListener('click', () => tree.querySelectorAll('.tree-node-folder').forEach(node => {
    setFolderOpen(node, true, false);
  }));
  document.querySelector('#expand-all').addEventListener('click', saveExpansionState);
  tree.addEventListener('contextmenu', event => {
    const row = event.target.closest('.tree-row');
    const nodeElement = row && row.parentElement;
    if (nodeElement) showTreeMenu(event, nodeElement);
  });
  treeMenuRequest.addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node) requestAccess(node, node.access.mode !== 'requestable');
  });
  treeMenuOpen.addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node && node.web_url) window.open(node.web_url, '_blank', 'noopener');
  });
  treeMenuToggle.addEventListener('click', () => {
    const folder = folderById(state.contextNodeId);
    if (folder) setFolderOpen(folder, folder.dataset.open !== 'true');
    hideTreeMenu();
  });
  document.querySelector('#tree-menu-contribute').addEventListener('click', () => {
    state.contributionTaskId = '';
    const targetId = state.contextNodeId;
    hideTreeMenu();
    openContribution(targetId);
  });
  document.querySelector('#tree-menu-collapse-level').addEventListener('click', () => { setFoldersAtDepth(state.contextDepth, false); hideTreeMenu(); });
  document.querySelector('#tree-menu-expand-level').addEventListener('click', () => { setFoldersAtDepth(state.contextDepth, true); hideTreeMenu(); });
  document.addEventListener('pointerdown', event => { if (!treeMenu.hidden && !treeMenu.contains(event.target)) hideTreeMenu(); });
  window.addEventListener('resize', hideTreeMenu);
  window.addEventListener('scroll', hideTreeMenu, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !treeMenu.hidden) hideTreeMenu();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search.focus();
    }
  });

  contributionForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = contributionForm.querySelector('button[type=submit]');
    if (button.disabled) return;
    button.disabled = true; button.classList.add('is-loading');
    contributionMessage.textContent = '';
    try {
      const result = await callServer('submitCatalogueContribution', state.token, state.contributionTargetId, document.querySelector('#contribution-title-input').value, document.querySelector('#contribution-url').value, document.querySelector('#contribution-note').value);
      contributionDialog.close();
      contributionForm.reset();
      loadReviews();
      showToast(result.duplicate ? 'That contribution is already waiting for review.' : 'Submitted for community review.');
    } catch (error) {
      contributionMessage.textContent = error.message;
    } finally { button.disabled = false; button.classList.remove('is-loading'); }
  });

  document.querySelector('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    form.setAttribute('aria-busy', 'true');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.classList.add('is-loading');
    setMessage('');
    try {
      const result = await callServer('passwordLogin', document.querySelector('#login-email').value, document.querySelector('#login-password').value);
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      updateAccount();
      dialog.close();
      warmViews();
      showToast('Signed in.');
      refreshMemberCatalogueState().catch(error => showToast(error.message));
    } catch (error) { setMessage(error.message); }
    finally {
      form.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = 'Sign in';
    }
  });
  document.querySelector('#use-login-code').addEventListener('click', async () => {
    const button = document.querySelector('#use-login-code');
    button.disabled = true; button.classList.add('is-loading'); setMessage('');
    try {
      const result = await callServer('requestLoginCode', document.querySelector('#login-email').value);
      state.loginChallengeId = result.challenge_id || '';
      showForm('login-code-form');
      setMessage('Your code is on the way.');
    } catch (error) { setMessage(error.message); }
    finally { button.disabled = false; button.classList.remove('is-loading'); }
  });
  document.querySelector('#login-code-form').addEventListener('submit', async event => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer('completeLogin', state.loginChallengeId, document.querySelector('#login-code').value);
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      updateAccount();
      showForm('password-setup-form');
      setMessage('Create a password to finish signing in.');
    } catch (error) { setMessage(error.message); }
  });
  document.querySelector('#school-form').addEventListener('submit', async event => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer('requestSchoolSignupCode', document.querySelector('#school-email').value);
      state.schoolChallengeId = result.challenge_id;
      showForm('school-code-form');
      setMessage('A school verification code was sent.');
    } catch (error) { setMessage(error.message); }
  });
  document.querySelector('#school-code-form').addEventListener('submit', async event => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer('verifySchoolSignupCode', state.schoolChallengeId, document.querySelector('#school-code').value);
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      updateAccount();
      showForm('password-setup-form');
      setMessage('Create a password for future sign-ins.');
    } catch (error) { setMessage(error.message); }
  });
  document.querySelector('#password-setup-form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.querySelector('#password-setup').value;
    if (password !== document.querySelector('#password-confirm').value) return setMessage('Those passwords do not match.');
    setMessage('');
    try {
      const result = await callServer('setPassword', state.token, password);
      rememberMember(result.member || state.member);
      updateAccount();
      dialog.close();
      document.querySelector('#password-setup-form').reset();
      showToast('Password saved. You can now sign in without a code.');
      refreshMemberCatalogueState().catch(error => showToast(error.message));
    } catch (error) { setMessage(error.message); }
  });

  const taskDialog = document.querySelector('#task-dialog');
  let taskTargetId = '';
  async function loadCommunityTasks() {
    const status = document.querySelector('#community-status');
    const list = document.querySelector('#community-list');
    busy(status); list.replaceChildren();
    try {
      const result = await callServer('communityTasks');
      status.textContent = result.tasks.length ? '' : 'No tasks yet. Propose something useful for the class.';
      for (const task of result.tasks) {
        const card = document.createElement('article'); card.className = 'community-task';
        const title = document.createElement('h3'); title.textContent = task.title;
        const path = document.createElement('p'); path.className = 'dialog-copy'; path.textContent = task.target_path;
        const note = document.createElement('p'); note.textContent = task.note;
        const vote = document.createElement('button'); vote.type = 'button'; vote.className = 'tonal-button';
        vote.textContent = (task.supported ? 'Supported' : 'Support') + ' · ' + task.votes;
        vote.setAttribute('aria-pressed', String(task.supported));
        vote.addEventListener('click', async () => {
          vote.disabled = true;
          try { await callServer('voteCommunityTask', task.id, !task.supported); await loadCommunityTasks(); }
          catch (error) { status.textContent = error.message; vote.disabled = false; }
        });
        card.append(title, path, note);
        if (task.status === 'proposed') card.append(vote);
        else {
          const reward = document.createElement('p'); reward.textContent = (task.status === 'completed' ? 'Completed · ' : 'Reward · ') + coins(task.reward_coins) + ' coins'; card.append(reward);
          if (task.status === 'open') {
            card.append(actionButton('Add to reward', () => openFunding(task)));
            if (task.my_funding_coins > 0) {
              const requestId = crypto.randomUUID();
              card.append(actionButton('Withdraw my ' + coins(task.my_funding_coins) + ' coins', async () => {
                await callServer('fundCommunityTask', task.id, 0, requestId, true); await refreshMemberCatalogueState(); await loadCommunityTasks();
              }));
            }
            card.append(actionButton('Submit work', () => {
              state.contributionTaskId = task.id;
              if (task.target_drive_item_id) openContribution(task.target_drive_item_id);
              else chooseFolder(id => openContribution(id));
            }));
          }
        }
        list.append(card);
      }
    } catch (error) { status.textContent = error.message; }
  }
  document.querySelector('#propose-task').addEventListener('click', () => {
    if (!state.member) return openAccount();
    taskTargetId = '';
    document.querySelector('#task-form').reset();
    document.querySelector('#task-status').textContent = '';
    document.querySelector('#task-destination').textContent = 'Community-wide task';
    taskDialog.showModal();
  });
  document.querySelector('#close-task').addEventListener('click', () => taskDialog.close());
  document.querySelector('#tree-menu-task').addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId); hideTreeMenu();
    if (!state.member) return openAccount();
    if (!node || node.kind !== 'folder') return;
    taskTargetId = node.id;
    document.querySelector('#task-form').reset();
    document.querySelector('#task-status').textContent = '';
    document.querySelector('#task-destination').textContent = cataloguePathFor(node);
    taskDialog.showModal();
  });
  document.querySelector('#task-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.target.querySelector('button[type=submit]');
    const status = document.querySelector('#task-status');
    button.disabled = true; busy(status);
    try {
      await callServer('proposeCommunityTask', taskTargetId, document.querySelector('#task-name').value, document.querySelector('#task-note').value, document.querySelector('#task-type').value);
      taskDialog.close(); showView('contribute'); await loadCommunityTasks();
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });

  function actionButton(label, action) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'tonal-button'; button.textContent = label;
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true; button.classList.add('is-loading');
      try { await action(); } catch (error) { showToast(error.message); }
      finally { button.disabled = false; button.classList.remove('is-loading'); }
    }); return button;
  }
  function showView(view) {
    if (view === 'tasks') view = 'contribute';
    if (!['top','contribute','lending','chat','activity'].includes(view)) view = 'top';
    for (const id of ['top','contribute','lending','chat','activity']) document.getElementById(id).hidden = id !== view;
    document.getElementById('tasks').hidden = view !== 'contribute';
    document.querySelectorAll('[data-view]').forEach(button => { if (button.dataset.view === view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
    search.closest('label').style.visibility = view === 'top' ? '' : 'hidden';
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    if (view === 'contribute') { loadReviews(); loadCommunityTasks(); }
    if (view === 'activity') { historyCursor = 0; loadHistory(); loadCommunityProfile(); }
    if (view === 'chat') loadChat();
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  document.querySelector('.brand').addEventListener('click', () => showView('top'));
  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
  const picker = document.querySelector('#folder-picker'); let pickerId = '', pickCallback;
  function chooseFolder(callback) {
    if (!state.member) return openAccount();
    pickCallback = callback; pickerId = ''; renderPicker(); picker.showModal();
  }
  function renderPicker() {
    const folders = (state.snapshot?.nodes || []).filter(node => node.kind === 'folder');
    const folderIds = new Set(folders.map(node => String(node.id)));
    const current = snapshotNodeById(pickerId);
    document.querySelector('#picker-path').textContent = current ? cataloguePathFor(current) : 'Browse folders';
    document.querySelector('#picker-use').disabled = !current;
    document.querySelector('#picker-back').disabled = !current;
    const list = document.querySelector('#picker-folders'); list.replaceChildren();
    const children = folders.filter(node => pickerId ? String(node.parent_id) === String(pickerId) : !folderIds.has(String(node.parent_id)));
    children.forEach(node => list.append(actionButton(node.name + ' ›', () => { pickerId = node.id; renderPicker(); })));
  }
  document.querySelector('#picker-back').onclick = () => { pickerId = snapshotNodeById(pickerId)?.parent_id || ''; renderPicker(); };
  document.querySelector('#picker-use').onclick = () => { picker.close(); pickCallback(pickerId); };
  document.querySelector('#close-picker').onclick = () => picker.close();
  const fundDialog = document.querySelector('#fund-dialog'); let fundingTask, fundingRequest;
  function openFunding(task) {
    fundingTask = task; fundingRequest = null;
    document.querySelector('#fund-form').reset(); document.querySelector('#fund-amount').disabled = false;
    document.querySelector('#fund-task').textContent = task.title; document.querySelector('#fund-status').textContent = ''; fundDialog.showModal();
  }
  document.querySelector('#close-fund').onclick = () => fundDialog.close();
  document.querySelector('#fund-form').onsubmit = async event => {
    event.preventDefault(); const button = event.target.querySelector('button'); if (button.disabled) return;
    const input = document.querySelector('#fund-amount');
    // Keep the exact same request reference and amount after an uncertain response.
    fundingRequest ||= {id:crypto.randomUUID(), coins:input.value}; input.disabled = true; button.disabled = true;
    const status = document.querySelector('#fund-status'); busy(status);
    try { await callServer('fundCommunityTask', fundingTask.id, fundingRequest.coins, fundingRequest.id, false); fundDialog.close(); await refreshMemberCatalogueState(); await loadCommunityTasks(); }
    catch (error) { status.textContent = error.message + ' You can retry this same contribution safely.'; }
    finally { button.disabled = false; }
  };
  async function loadReviews() {
    const status = document.querySelector('#review-status'); const list = document.querySelector('#review-list'); const mine = document.querySelector('#submission-list');
    list.replaceChildren(); mine.replaceChildren();
    if (!state.token) { status.textContent = 'Sign in to submit material and review contributions.'; return; }
    busy(status);
    try {
      const data = await callServer('communityReviewQueue');
      document.querySelector('#year-form').hidden = Boolean(data.academic_year);
      status.textContent = data.is_admin ? 'Administrator review · one approval publishes.' : data.academic_year ? 'Year ' + data.academic_year + ' · Two independent approvals are required.' : 'Set your year to see matching review tasks.';
      if (!data.items.length && data.next_review_at) status.textContent = 'Your next community review becomes available ' + new Date(data.next_review_at).toLocaleDateString() + '.';
      if (!data.items.length) list.textContent = 'No matching submissions to review right now.';
      data.items.forEach(item => {
        const card = document.createElement('article'); card.className = 'community-task';
        const title = document.createElement('h3'); title.textContent = item.title;
        const publishedName = document.createElement('input'); publishedName.value = item.title; publishedName.maxLength = 180; publishedName.setAttribute('aria-label','Published file name'); publishedName.className = 'review-name';
        const detail = document.createElement('p'); detail.textContent = item.path + (item.note ? ' — ' + item.note : '');
        if (item.task) detail.textContent += '\nTask: ' + item.task.title + ' — ' + item.task.note;
        if (item.my_decision) detail.textContent += '\nYour review: ' + item.my_decision + '. Waiting for the community; retry your recorded decision if publication was interrupted.';
        const explanation = document.createElement('textarea'); explanation.placeholder = 'What needs fixing? Required when rejecting.'; explanation.maxLength = 1000; explanation.setAttribute('aria-label','Review note');
        card.classList.add('review-card');
        card.append(title,detail,publishedName,actionButton('Open material', async () => {
          const tab = window.open('about:blank','_blank'); if (tab) tab.opener = null;
          try { const result = await callServer('reviewContribution',item.id,'open'); if (tab) tab.location.href = result.url; else showToast('Allow pop-ups to open the review material.'); }
          catch(error) { if(tab) tab.close(); throw error; }
        }),explanation);
        for (const decision of (item.my_decision ? [item.my_decision] : ['approve','reject'])) card.append(actionButton(item.my_decision ? 'Check completion' : decision === 'approve' ? 'Approve' : 'Request changes', async () => {
          const result = await callServer('reviewContribution',item.id,decision,explanation.value,publishedName.value); showToast(result.status === 'pending' ? 'Review recorded. Waiting for another independent reviewer.' : 'Submission ' + result.status + '.'); await loadReviews();
        }));
        list.append(card);
      });
      data.mine.forEach(item => {
        const row = document.createElement('article'); row.className = 'submission-row';
        const title = document.createElement('h3'); title.textContent = item.title;
        const badge = document.createElement('span'); badge.className = 'status-chip'; badge.textContent = item.status;
        row.append(title, badge);
        if (item.source_url && /^https:\/\//i.test(item.source_url)) {
          const link = document.createElement('a'); link.href = item.source_url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'View submitted material'; row.append(link);
        }
        if (item.needs_preparation) row.append(actionButton('Prepare for review', async () => {
          await callServer('submitCatalogueContribution',state.token,item.target_id,item.title,item.source_url,item.note,''); await loadReviews();
        }));
        mine.append(row);
      });
      if (!data.mine.length) mine.textContent = 'Your submissions will appear here.';
    } catch (error) { status.textContent = error.message; }
  }
  document.querySelector('#year-form').onsubmit = async event => {
    event.preventDefault(); const button = event.target.querySelector('button'); button.disabled = true;
    try { await callServer('setCommunityYear',document.querySelector('#review-year').value); await loadReviews(); }
    catch(error) { showToast(error.message); } finally { button.disabled = false; }
  };

  let historyCursor = 0, historyRender = 0;
  async function loadHistory() {
    const status = document.querySelector('#history-status'); const more = document.querySelector('#history-more'); const list = document.querySelector('#history-list');
    const render = ++historyRender, cursor = historyCursor;
    if (!state.token) { status.textContent = 'Sign in to see your balance and requests.'; list.replaceChildren(); more.hidden = true; document.querySelector('#activity-balance').textContent = '—'; document.querySelector('#activity-email').textContent = ''; return; }
    document.querySelector('#activity-balance').textContent = state.member ? coins(state.member.balance_coins) + ' 🪙' : '—';
    document.querySelector('#activity-email').textContent = state.member?.delivery_email || '';
    more.disabled = true; busy(status);
    try {
      const result = await callServer('memberRequestHistory',cursor);
      if (render !== historyRender) return;
      if (!cursor) list.replaceChildren();
      result.items.forEach(item => {
        const card = document.createElement('article'); card.className = 'history-row';
        const title = document.createElement('h3'); title.textContent = item.file;
        const detail = document.createElement('p');
        const date = new Date(item.date); const when = Number.isNaN(date.valueOf()) ? '' : date.toLocaleString();
        detail.textContent = (item.source === 'legacy' ? 'Imported record' : 'Website request') + ' · ' + String(item.status).toLowerCase() + (when ? ' · ' + when : '');
        const amount = document.createElement('span'); amount.className = 'history-amount'; amount.textContent = item.coins == null ? '—' : coins(item.coins) + ' 🪙';
        card.append(title,detail,amount); list.append(card);
      });
      status.textContent = list.children.length ? '' : 'No file requests recorded yet.';
      historyCursor = result.next_cursor; more.hidden = historyCursor === null;
    } catch(error) { status.textContent = error.message; }
    finally { more.disabled = false; }
  }
  document.querySelector('#show-history').onclick = () => { dialog.close(); showView('activity'); };
  document.querySelector('#history-more').onclick = loadHistory;
  document.querySelector('#activity-account').onclick = openAccount;
  document.querySelector('#send-coins-form').onsubmit = async event => {
    event.preventDefault();
    if (!state.token) return openAccount();
    const form = event.currentTarget, button = form.querySelector('button');
    button.disabled = true; button.classList.add('is-loading');
    try {
      const result = await callServer('sendCoins',document.querySelector('#coin-recipient').value,document.querySelector('#coin-amount').value,crypto.randomUUID());
      state.member.balance_coins = result.balance_coins; updateAccount(); form.reset(); showToast('Coins sent to '+result.recipient+'.');
    } catch(error) { showToast(error.message); }
    finally { button.disabled=false; button.classList.remove('is-loading'); }
  };

  let chatPeer = '';
  async function loadChat(peer) {
    const contacts = document.querySelector('#chat-contacts'), messages = document.querySelector('#chat-messages'), form = document.querySelector('#chat-form');
    if (!state.token) { contacts.textContent='Sign in to use chat.'; messages.replaceChildren(); form.hidden=true; return; }
    if (peer !== undefined) chatPeer = peer;
    busy(messages);
    try {
      const data = await callServer('chatSnapshot',chatPeer);
      contacts.replaceChildren();
      data.contacts.forEach(contact => contacts.append(actionButton(contact.label,()=>{chatPeer=contact.id;invalidateViews();return loadChat();})));
      messages.replaceChildren();
      if (!data.peer) { messages.textContent='Choose or open a conversation.'; form.hidden=true; return; }
      chatPeer=data.peer.id; form.hidden=false; form.dataset.peerLabel=data.peer.label;
      data.messages.forEach(message=>{const row=document.createElement('p');row.className='chat-message '+(message.sent_by_me?'mine':'theirs');row.textContent=message.body;messages.append(row);});
      if (!data.messages.length) messages.textContent='No messages yet.';
    } catch(error) { messages.textContent=error.message; form.hidden=true; }
  }
  document.querySelector('#chat-peer-form').onsubmit = async event => { event.preventDefault(); invalidateViews(); await loadChat(document.querySelector('#chat-peer').value); };
  document.querySelector('#chat-form').onsubmit = async event => {
    event.preventDefault(); const button=event.currentTarget.querySelector('button'); button.disabled=true;button.classList.add('is-loading');
    try { await callServer('sendChatMessage',chatPeer,document.querySelector('#chat-body').value); document.querySelector('#chat-body').value=''; invalidateViews(); await loadChat(); }
    catch(error){showToast(error.message);} finally {button.disabled=false;button.classList.remove('is-loading');}
  };
  document.querySelectorAll('.school-input input').forEach(input => input.addEventListener('input', () => { input.nextElementSibling.hidden = input.value.includes('@'); }));
  // Scroll inside the rounded surface, never along its outer edge.
  document.querySelectorAll('dialog.account-dialog').forEach(modal => {
    const body = document.createElement('div'); body.className = 'dialog-scroll';
    while (modal.firstChild) body.append(modal.firstChild);
    modal.append(body);
  });

  loadCachedCatalogue();
  busy(syncStatus);
  if (!state.snapshot) busy(tree);
  warmViews();
  setInterval(() => { if (state.token && document.visibilityState === 'visible') { warmingToken = ''; warmViews(); } }, 120000);
  loadCatalogue();
  showView(location.hash.slice(1));
})();
