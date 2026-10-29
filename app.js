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
    collapsedNodeIds: new Set(),
    expansionStateKey: '',
    contextNodeId: '',
    contextDepth: 0,
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
  const confirmedAccess = new Set();
  const accessKey = (node) =>
    [
      state.member?.member_id,
      state.member?.delivery_email || state.member?.school_email,
      node.target_drive_item_id || node.id,
    ].join('|');

  function apiUrl() {
    const configured = String(window.SMR_API_BASE_URL || '').replace(/\/+$/, '');
    if (!configured) throw new Error('The SMR connection has not been configured yet.');
    return configured + '/api';
  }

  const viewCache = new Map();
  let cacheEpoch = 0,
    warmingToken = '';
  const cachedReads = new Set([
    'communityTasks',
    'communityReviewQueue',
    'memberRequestHistory',
    'chatSnapshot',
    'communityProfile',
    'getCoinflips',
  ]);
  function invalidateViews() {
    cacheEpoch++;
    viewCache.clear();
    renderedViews.clear();
  }
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
    } catch {
      /* A failed prefetch can be retried without interrupting sign-in. */
    }
  }
  async function callServer(name, ...args) {
    if (!cachedReads.has(name)) {
      const result = await sendServer(name, ...args);
      if (
        [
          'submitCatalogueContribution',
          'reviewContribution',
          'setCommunityYear',
          'fundCommunityTask',
          'voteCommunityTask',
          'activateImportedTask',
          'proposeCommunityTask',
          'requestCatalogueAccess',
          'sendCoins',
          'sendChatMessage',
          'createCoinflip',
          'cancelCoinflip',
          'acceptCoinflip',
          'signOut',
        ].includes(name)
      ) {
        invalidateViews();
        warmingToken = '';
        if (name !== 'signOut') queueMicrotask(warmViews);
      }
      return result;
    }
    const token = state.token,
      epoch = cacheEpoch;
    const key = token + ':' + name + ':' + JSON.stringify(args);
    const cached = viewCache.get(key);
    if (cached && (cached.pending || Date.now() - cached.at < 120000)) return cached.promise;
    const entry = { at: Date.now(), pending: true };
    entry.promise = sendServer(name, ...args)
      .then((value) => {
        if (token !== state.token || epoch !== cacheEpoch)
          throw new Error('Account changed. Please reopen this page.');
        entry.pending = false;
        entry.at = Date.now();
        return value;
      })
      .catch((error) => {
        if (viewCache.get(key) === entry) viewCache.delete(key);
        throw error;
      });
    viewCache.set(key, entry);
    return entry.promise;
  }
  const spinnerMarkup = '<span class="spinner" role="status" aria-label="Please wait"></span>';
  function busy(element, label) {
    const labels = {
      'community-status': 'Fetching tasks…',
      'review-status': 'Finding your reviews…',
      'form-message': 'Connecting to your account…',
    };
    element.innerHTML = spinnerMarkup;
    const text = label || labels[element.id];
    if (text) {
      const caption = document.createElement('span');
      caption.className = 'loading-wave';
      caption.textContent = text;
      element.append(caption);
    }
  }
  async function sendServer(name, ...args) {
    window.SMRProgress?.start();
    try {
      return await sendServerRequest(name, ...args);
    } finally {
      window.SMRProgress?.end();
    }
  }
  async function sendServerRequest(name, ...args) {
    const requests = {
      siteTips: ['site_tips', {}],
      adminSiteTips: ['admin_site_tips', { ...args[0], session_token: state.token }],
      getCatalogueSnapshot: ['catalogue_snapshot', { session_token: args[0] || '' }],
      getMemberCatalogueState: ['member_catalogue_state', { session_token: args[0] }],
      memberRequestHistory: [
        'member_request_history',
        { session_token: state.token, cursor: args[0] || 0 },
      ],
      requestSchoolSignupCode: ['request_school_signup_code', { school_email: args[0] }],
      verifySchoolSignupCode: [
        'verify_school_signup_code',
        { challenge_id: args[0], code: args[1] },
      ],
      requestLoginCode: ['request_login_code', { email: args[0] }],
      completeLogin: ['complete_login', { challenge_id: args[0], code: args[1] }],
      passwordLogin: ['password_login', { school_email: args[0], password: args[1] }],
      setPassword: ['set_password', { session_token: args[0], password: args[1] }],
      signOut: ['sign_out', { session_token: args[0] || '' }],
      quoteCatalogueAccess: [
        'quote_catalogue_access',
        { session_token: args[0], drive_item_id: args[1] },
      ],
      requestCatalogueAccess: [
        'request_catalogue_access',
        {
          session_token: args[0],
          drive_item_id: args[1],
          check_only: args[2] === true,
          check_token: args[3] || '',
        },
      ],
      communityTasks: ['community_tasks', { session_token: state.token }],
      adminEditTask: ['admin_edit_task', { session_token: state.token, ...args[0] }],
      activateImportedTask: [
        'activate_imported_task',
        { session_token: state.token, task_id: args[0] },
      ],
      proposeCommunityTask: [
        'propose_community_task',
        {
          session_token: state.token,
          target_drive_item_id: args[0],
          title: args[1],
          note: args[2],
          task_type: args[3] || 'other',
        },
      ],
      voteCommunityTask: [
        'vote_community_task',
        { session_token: state.token, task_id: args[0], support: args[1] },
      ],
      fundCommunityTask: [
        'fund_community_task',
        {
          session_token: state.token,
          task_id: args[0],
          coins: args[1],
          request_id: args[2],
          withdraw: args[3] === true,
        },
      ],
      communityReviewQueue: ['community_review_queue', { session_token: state.token }],
      setCommunityYear: ['set_community_year', { session_token: state.token, year: args[0] }],
      reviewContribution: [
        'review_contribution',
        {
          session_token: state.token,
          contribution_id: args[0],
          decision: args[1],
          note: args[2] || '',
          proposed_title: args[3] || '',
        },
      ],
      submitCatalogueContribution: [
        'submit_catalogue_contribution',
        {
          session_token: args[0],
          target_drive_item_id: args[1],
          title: args[2],
          source_url: args[3],
          note: args[4],
          task_id: args.length > 5 ? args[5] : state.contributionTaskId || '',
        },
      ],
      sendCoins: [
        'send_coins',
        {
          session_token: state.token,
          recipient: args[0],
          coins: args[1],
          request_id: args[2],
        },
      ],
      chatSnapshot: ['chat_snapshot', { session_token: state.token, peer: args[0] || '' }],
      sendChatMessage: [
        'send_chat_message',
        { session_token: state.token, recipient: args[0], body: args[1] },
      ],
      communityProfile: ['community_profile', { session_token: state.token }],
      adminRefreshCatalogue: ['admin_refresh_catalogue', { session_token: state.token }],
      getCoinflips: ['get_coinflips', { session_token: state.token }],
      createCoinflip: [
        'create_coinflip',
        {
          session_token: state.token,
          coins: args[0],
          chosen_side: args[1],
          request_id: args[2],
        },
      ],
      cancelCoinflip: ['cancel_coinflip', { session_token: state.token, lobby_id: args[0] }],
      acceptCoinflip: ['accept_coinflip', { session_token: state.token, lobby_id: args[0] }],
      updateMemberPrivacy: [
        'update_member_privacy',
        { session_token: state.token, settings: args[0] || {} },
      ],
      memberProfileSummary: [
        'member_profile_summary',
        { session_token: state.token, address: args[0] },
      ],
      adminDriveAction: [
        'admin_drive_action',
        {
          session_token: state.token,
          action_name: args[0],
          drive_item_id: args[1],
          name: args[2] || '',
          email: args[3] || '',
          role: args[4] || '',
          source_drive_item_id: args[5] || '',
        },
      ],
      adminPaste: [
        'admin_drive_action',
        {
          session_token: state.token,
          action_name: 'paste',
          drive_item_id: args[0],
          source_drive_item_id: args[1],
          mode: args[2],
        },
      ],
      adminCascade: [
        'admin_drive_action',
        {
          session_token: state.token,
          action_name: 'cascade',
          drive_item_id: args[0],
          enabled: args[1],
        },
      ],
      chatHub: ['chat_hub', { ...args[0], session_token: state.token }],
      chatSpace: ['chat_space', { ...args[0], session_token: state.token }],
      chatSend: ['chat_send', { ...args[0], session_token: state.token }],
    };
    const request = requests[name];
    if (!request) throw new Error('Unsupported SMR action.');
    let body = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(apiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: request[0], payload: request[1] }),
      });
      body = await response.json().catch(() => null);
      if (!body || body.ok || body.error !== 'SERVICE_BUSY' || attempt === 2) break;
      showToast('Server busy, retrying momentarily…');
      await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
    }
    document.querySelectorAll('#account-dialog form[aria-busy="true"]').forEach((form) => {
      form.setAttribute('aria-busy', 'false');
      form.querySelectorAll('.is-loading').forEach((button) => {
        button.disabled = false;
        button.classList.remove('is-loading');
      });
    });
    if (!body || !body.ok)
      throw new Error((body && body.error) || 'The SMR service could not complete that request.');
    return body.data;
  }

  function coins(value) {
    return (Math.round(Number(value || 0) * 100) / 100).toString();
  }
  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 5000);
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
      : 'Request access for the price shown.';
    requestConfirm.textContent = checkingOwnedFile ? 'Check access' : 'Request access';
    setRequestProgress('', false);
    requestDialog.showModal();
    return new Promise((resolve) => {
      resolvePendingRequest = resolve;
    });
  }
  function setMessage(message) {
    if (message && /…$/.test(message)) busy(formMessage);
    else formMessage.textContent = message || '';
  }
  function showForm(id) {
    forms.forEach((form) => {
      form.hidden = form.id !== id;
    });
    document.querySelector('#account-home').hidden = Boolean(id) || Boolean(state.member);
    document.querySelector('#signed-in-panel').hidden =
      !state.member || id === 'password-setup-form';
    setMessage('');
  }
  function updateAccount() {
    document.dispatchEvent(
      new CustomEvent('smr-account', { detail: { isAdmin: !!state.member?.is_admin } }),
    );
    const signedIn = Boolean(state.member);
    document.querySelector('#activity-balance').textContent = signedIn
      ? coins(state.member.balance_coins) + ' 🪙'
      : '—';
    document.querySelector('#activity-email').textContent = signedIn
      ? state.member.delivery_email || state.member.school_email || ''
      : '';
    const treasury = document.querySelector('#treasury-summary');
    treasury.hidden = !signedIn || !state.member.is_admin;
    if (!treasury.hidden)
      document.querySelector('#treasury-balance').textContent =
        coins(state.member.treasury_balance_coins) + ' 🪙';
    document.querySelector('#activity-account').textContent = signedIn
      ? 'Manage account'
      : 'Sign in or create account';
    let refresh = document.querySelector('#admin-refresh-catalogue');
    if (signedIn && state.member.is_admin && !refresh) {
      refresh = document.createElement('button');
      refresh.id = 'admin-refresh-catalogue';
      refresh.className = 'tonal-button';
      refresh.textContent = 'Refresh Drive catalogue';
      document.querySelector('#activity .workspace-heading').append(refresh);
      refresh.onclick = async () => {
        refresh.disabled = true;
        refresh.classList.add('is-loading');
        try {
          await callServer('adminRefreshCatalogue');
          showToast('A full Drive reconciliation has started.');
        } catch (error) {
          showToast(error.message);
        } finally {
          refresh.disabled = false;
          refresh.classList.remove('is-loading');
        }
      };
    }
    if (refresh) refresh.hidden = !signedIn || !state.member.is_admin;
  }
  async function loadCommunityProfile() {
    let panel = document.querySelector('#community-profile');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'community-profile';
      panel.className = 'contributor-profile';
      document.querySelector('#activity .balance-summary').before(panel);
    }
    if (!state.token) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    busy(panel);
    try {
      const profile = await callServer('communityProfile');
      const next = profile.next_level_points;
      const progress = next ? Math.min(100, Math.round((profile.points / next) * 100)) : 100;
      panel.innerHTML =
        '<div><p class="eyebrow">Community contributor</p><h2></h2><p class="profile-stats"></p></div><div class="level-progress"><span></span></div><p class="profile-next"></p>';
      panel.querySelector('h2').textContent = profile.label + ' · Level ' + profile.level;
      panel.querySelector('.profile-stats').textContent =
        profile.approved_contributions +
        ' contributions · ' +
        profile.reviews +
        ' reviews · ' +
        profile.activated_tasks +
        ' useful tasks';
      panel.querySelector('.level-progress span').style.width = progress + '%';
      panel.querySelector('.profile-next').textContent = next
        ? next - profile.points + ' points to Level ' + (profile.level + 1)
        : profile.points + ' contribution points';
    } catch (error) {
      panel.textContent = error.message;
    }
  }
  function getExpansionStateKey() {
    return (
      'smr_catalogue_expansion_v1:' +
      (state.member && state.member.member_id ? state.member.member_id : state.memberId || 'guest')
    );
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
      state.expandedNodeIds = new Set(
        Array.isArray(saved) ? saved.map(String) : (saved.open || []).map(String),
      );
      state.collapsedNodeIds = new Set(
        Array.isArray(saved) ? [] : (saved.closed || []).map(String),
      );
    } catch {
      state.expandedNodeIds = new Set();
      state.collapsedNodeIds = new Set();
      localStorage.removeItem(key);
    }
  }
  function saveExpansionState() {
    localStorage.setItem(
      state.expansionStateKey || getExpansionStateKey(),
      JSON.stringify({
        open: [...state.expandedNodeIds],
        closed: [...state.collapsedNodeIds],
      }),
    );
  }
  function folderById(id) {
    return [...tree.querySelectorAll('.tree-node-folder')].find(
      (element) => element.dataset.nodeId === String(id),
    );
  }
  function snapshotNodeById(id) {
    return (
      ((state.snapshot && state.snapshot.nodes) || []).find(
        (node) => String(node.id) === String(id),
      ) || null
    );
  }
  function setFolderOpen(folder, open, save, explicit) {
    if (!folder) return;
    folder.dataset.open = String(open);
    folder.setAttribute('aria-expanded', String(open));
    const toggle = folder.querySelector(':scope > .tree-row .tree-toggle');
    if (toggle)
      toggle.setAttribute(
        'aria-label',
        (open ? 'Collapse ' : 'Expand ') + (folder.querySelector('.tree-label') || {}).textContent,
      );
    if (open) {
      state.expandedNodeIds.add(folder.dataset.nodeId);
      if (explicit) state.collapsedNodeIds.delete(folder.dataset.nodeId);
    } else {
      state.expandedNodeIds.delete(folder.dataset.nodeId);
      if (explicit) state.collapsedNodeIds.add(folder.dataset.nodeId);
    }
    if (open && explicit && folder.dataset.unit === 'true') {
      tree.querySelectorAll('.tree-node-folder').forEach((child) => {
        if (
          child.dataset.parentId === folder.dataset.nodeId &&
          !state.collapsedNodeIds.has(child.dataset.nodeId)
        )
          setFolderOpen(child, true, false, false);
      });
    }
    if (open && explicit && snapshotNodeById(folder.dataset.nodeId)?.expand_descendants) {
      folder
        .querySelectorAll('.tree-node-folder')
        .forEach((child) => setFolderOpen(child, true, false, false));
    }
    if (save !== false) saveExpansionState();
  }
  function setFoldersAtDepth(depth, open) {
    tree.querySelectorAll('.tree-node-folder').forEach((folder) => {
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
    state.selectedNodeId = state.contextNodeId;
    treeMenuOpen.hidden = true;
    treeMenuRequest.hidden = !node || isFolder;
    if (!treeMenuRequest.hidden) {
      treeMenuRequest.querySelector('span:last-child').textContent = 'Open file';
      treeMenuRequest.querySelector('.material-symbols-outlined').textContent = 'open_in_new';
    }
    document.querySelector('#tree-menu-contribute').hidden = !isFolder;
    document.querySelector('#tree-menu-task').hidden = !isFolder;
    treeMenuToggle.hidden = !isFolder;
    document.querySelector('#tree-menu-collapse-level').hidden = !isFolder;
    document.querySelector('#tree-menu-expand-level').hidden = !isFolder;
    const adminManage = document.querySelector('#tree-menu-admin');
    adminManage.hidden = true;
    treeMenu.querySelectorAll('[data-admin-action]').forEach((button) => {
      button.hidden =
        !state.member?.is_admin || !node || (button.dataset.adminAction === 'create' && !isFolder);
    });
    updateDriveMenu(node);
    if (isFolder) {
      const isOpen = nodeElement.dataset.open === 'true';
      treeMenuToggle.querySelector('span:last-child').textContent = isOpen
        ? 'Collapse this folder'
        : 'Expand this folder';
      treeMenuToggle.querySelector('.material-symbols-outlined').textContent = isOpen
        ? 'expand_less'
        : 'expand_more';
    }
    treeMenu.hidden = false;
    const menuRect = treeMenu.getBoundingClientRect();
    treeMenu.style.left =
      Math.max(12, Math.min(event.clientX, window.innerWidth - menuRect.width - 12)) + 'px';
    treeMenu.style.top =
      Math.max(12, Math.min(event.clientY, window.innerHeight - menuRect.height - 12)) + 'px';
    (isFolder ? treeMenuToggle : treeMenuRequest.hidden ? treeMenuOpen : treeMenuRequest).focus();
  }
  function openAccount() {
    if (state.member)
      document.querySelector('#signed-in-email').textContent = state.member.delivery_email;
    showForm('');
    dialog.showModal();
  }
  let pathNodes,
    pathIndex = new Map(),
    cataloguePaths = new Map();
  function cataloguePathFor(node) {
    const nodes = (state.snapshot && state.snapshot.nodes) || [];
    if (pathNodes !== nodes) {
      pathNodes = nodes;
      pathIndex = new Map(nodes.map((node) => [String(node.id), node]));
      cataloguePaths = new Map();
    }
    const byId = pathIndex,
      pathCache = cataloguePaths,
      visiting = new Set();
    function pathFor(node) {
      if (pathCache.has(String(node.id))) return pathCache.get(String(node.id));
      if (visiting.has(String(node.id))) return String(node.name);
      visiting.add(String(node.id));
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
    const byId = new Map(nodes.map((node) => [String(node.id), { ...node, children: [] }]));
    const roots = [];
    byId.forEach((node) => {
      const parent = byId.get(String(node.parent_id || ''));
      if (parent) parent.children.push(node);
      else roots.push(node);
    });
    const sortNodes = (list) =>
      list
        .sort((a, b) =>
          String(a.name).localeCompare(String(b.name), undefined, {
            numeric: true,
          }),
        )
        .forEach((node) => sortNodes(node.children));
    sortNodes(roots);
    return roots;
  }
  function matches(node) {
    const ownText = [node.name, ...(node.announcements || []).map((item) => item.message)]
      .join(' ')
      .toLowerCase();
    return !state.query || ownText.includes(state.query) || node.children.some(matches);
  }
  const searchPanel = document.createElement('section');
  searchPanel.className = 'search-results';
  searchPanel.hidden = true;
  searchPanel.setAttribute('aria-label', 'Search results');
  searchPanel.setAttribute('aria-live', 'polite');
  document.querySelector('#top').prepend(searchPanel);
  let searchKind = 'all';
  function renderSearch() {
    const query = search.value.trim();
    searchPanel.hidden = !query;
    document.querySelector('.catalogue-card').hidden = Boolean(query);
    if (!query) return;
    searchPanel.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'workspace-heading';
    const title = document.createElement('h1');
    title.textContent = 'Search results';
    heading.append(
      title,
      actionButton('Clear', () => {
        search.value = '';
        renderSearch();
        search.focus();
      }),
    );
    searchPanel.append(heading);
    const filters = document.createElement('div');
    filters.className = 'search-filters';
    ['all', 'file', 'folder'].forEach((kind) => {
      const button = actionButton(
        kind === 'all' ? 'All' : kind === 'file' ? 'Files' : 'Folders',
        () => {
          searchKind = kind;
          renderSearch();
        },
      );
      button.setAttribute('aria-pressed', String(searchKind === kind));
      filters.append(button);
    });
    searchPanel.append(filters);
    const nodes = (state.snapshot?.nodes || []).filter(
      (node) =>
        searchKind === 'all' ||
        (searchKind === 'folder' ? node.kind === 'folder' : node.kind !== 'folder'),
    );
    SmrSearch.queries(query)
      .slice(0, 30)
      .forEach((part) => {
        const group = document.createElement('section');
        group.className = 'search-group';
        const subtitle = document.createElement('h2');
        subtitle.textContent = part;
        group.append(subtitle);
        const results = SmrSearch.rank(nodes, part, cataloguePathFor);
        if (!results.length) {
          const empty = document.createElement('p');
          empty.textContent =
            'No matching material. Try the course name or code with a different date.';
          group.append(empty);
        }
        results.forEach(({ node, path }) => {
          const card = document.createElement('article');
          card.className = 'search-result';
          const name = document.createElement('h3');
          name.textContent = node.name;
          const detail = document.createElement('p');
          detail.textContent = path;
          card.append(name, detail);
          card.append(
            actionButton(node.kind === 'folder' ? 'Browse folder' : 'Open file', () => {
              if (node.kind === 'folder') return browseSearchFolder(node);
              return requestAccess(node, true);
            }),
          );
          group.append(card);
        });
        searchPanel.append(group);
      });
  }
  function browseSearchFolder(folder) {
    searchPanel.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'workspace-heading';
    const title = document.createElement('h2');
    title.textContent = folder.name;
    heading.append(title, actionButton('Back to results', renderSearch));
    searchPanel.append(heading);
    const children = state.snapshot.nodes.filter(
      (node) => String(node.parent_id) === String(folder.id),
    );
    if (!children.length) {
      const empty = document.createElement('p');
      empty.textContent = 'This folder is empty.';
      searchPanel.append(empty);
    }
    children.forEach((node) => {
      const card = document.createElement('article');
      card.className = 'search-result';
      const title = document.createElement('h3');
      title.textContent = node.name;
      card.append(
        title,
        actionButton(node.kind === 'folder' ? 'Browse folder' : 'Open file', () => {
          if (node.kind === 'folder') browseSearchFolder(node);
          else requestAccess(node, true);
        }),
      );
      searchPanel.append(card);
    });
  }
  function isCoinRestricted(node) {
    const seen = new Set();
    while (node && !seen.has(String(node.id))) {
      seen.add(String(node.id));
      if (node.kind === 'folder' && (String(node.name).includes('🪙') || node.coin_marked === true))
        return true;
      node = snapshotNodeById(node.parent_id);
    }
    return false;
  }
  async function requestAccess(node, checkOnly = false) {
    if (
      (!isCoinRestricted(node) || confirmedAccess.has(accessKey(node))) &&
      node.checkToken !== 'force'
    ) {
      window.open(
        node.web_url ||
          'https://drive.google.com/open?id=' +
            encodeURIComponent(node.target_drive_item_id || node.id),
        '_blank',
        'noopener',
      );
      return;
    }
    if (requestInFlight || resolvePendingRequest) return;
    if (!state.member) {
      if (node.access?.mode === 'open' && node.web_url) {
        window.open(node.web_url, '_blank', 'noopener');
        return;
      }
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
      setRequestProgress(
        node.checkToken && !checkOnly
          ? 'Processing your request…'
          : 'Checking whether you already have access…',
        true,
      );
      const result = await callServer(
        'requestCatalogueAccess',
        state.token,
        node.id,
        checkOnly,
        node.checkToken,
      );
      delete node.checkToken;
      requestInFlight = false;
      setRequestProgress('', false);
      requestDialog.close();
      if (result.status === 'ACCESS_REQUIRED') {
        node.checkToken = result.check_token;
        node.access = {
          ...node.access,
          mode: 'requestable',
          is_owned: false,
          price_millis: result.price_coins * 1000,
          purchase_drive_item_id: node.id,
        };
        renderCatalogue();
        // Only spending coins needs confirmation. The initial check is immediate.
        return requestAccess(node);
      }
      if (result.status === 'COMPLETED') showToast('Access granted. It is now available in Drive.');
      else if (result.status === 'HELD')
        showToast(
          'Drive access is still pending. Your request is saved; retrying will not charge you again.',
        );
      else if (result.status === 'REPAIRED_COMPLETED_PURCHASE')
        showToast(
          'Your completed purchase was delivered to Drive. No additional coins were spent.',
        );
      else if (result.status === 'RECORDED_BUT_NOT_ACCESSIBLE') showToast(result.error);
      else if (result.status === 'ALREADY_OWNED')
        showToast(
          'Drive access confirmed for ' +
            (result.delivery_email || state.member.delivery_email) +
            '. Open Drive with that account.',
        );
      else
        showToast(
          result.error ||
            'The request could not be completed. Check your request history before trying again.',
        );
      if (['COMPLETED', 'ALREADY_OWNED', 'REPAIRED_COMPLETED_PURCHASE'].includes(result.status)) {
        confirmedAccess.add(accessKey(node));
        node.web_url = ownedFileUrl(node);
        requestSummary.textContent = node.name;
        requestDetail.textContent =
          'Access confirmed for ' + (result.delivery_email || state.member.delivery_email) + '.';
        requestConfirm.textContent = 'Open file';
        requestCancel.textContent = 'Close';
        requestDialog.showModal();
        const open = await new Promise((resolve) => {
          resolvePendingRequest = resolve;
        });
        requestDialog.close();
        requestCancel.textContent = 'Cancel';
        if (open) window.open(node.web_url, '_blank', 'noopener');
      }
      refreshMemberCatalogueState().catch(() => {});
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
    (result.verified_access_ids || []).forEach((id) => confirmedAccess.add(accessKey({ id })));
    const owned = new Set((result.owned_item_ids || []).map(String));
    state.snapshot.nodes = (state.snapshot.nodes || []).map((node) => {
      const baseAccess = node.baseAccess || node.access;
      const baseUrl = node.baseUrl === undefined ? node.web_url : node.baseUrl;
      if (!owned.has(String(node.id)))
        return {
          ...node,
          access: baseAccess,
          web_url: baseUrl,
          baseAccess,
          baseUrl,
        };
      return {
        ...node,
        baseAccess,
        baseUrl,
        access: { ...baseAccess, mode: 'open', is_owned: true },
        web_url: ownedFileUrl(node),
      };
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
    wrapper.dataset.parentId = String(node.parent_id || '');
    wrapper.dataset.unit = String(
      isFolder && /\b(?:CSC|SCS|ICT)\s*\d{3}\b/i.test(String(node.name)),
    );
    wrapper.style.setProperty('--depth', depth);
    const shouldOpen = Boolean(state.query) || state.expandedNodeIds.has(String(node.id));
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
      toggle.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span>';
      toggle.addEventListener('click', () => {
        const open = wrapper.dataset.open === 'true';
        setFolderOpen(wrapper, !open, true, true);
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
    const requiresAccess = node.access?.mode === 'requestable' && !isFolder;
    const needsConfiguration = node.access?.mode === 'unconfigured';
    const isLockedFolder = node.access?.mode === 'locked_folder';
    const isAction = !isFolder || requiresAccess || needsConfiguration;
    const label = document.createElement(isAction ? 'button' : 'span');
    label.className = 'tree-label' + (isAction ? ' tree-link' : '');
    label.textContent = String(node.name).replace(' 🪙', '');
    if (isAction) {
      label.type = 'button';
      label.title = requiresAccess
        ? 'Request access with coins'
        : needsConfiguration
          ? 'This coin-marked material is not configured for website requests yet'
          : 'Open ' + node.name;
      label.addEventListener('click', () => {
        return requestAccess(node, true);
      });
    }
    row.append(label);
    row.addEventListener('click', () => {
      state.selectedNodeId = String(node.id);
    });
    let holdTimer,
      held = false;
    row.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      held = false;
      holdTimer = setTimeout(() => {
        held = true;
        showTreeMenu(event, wrapper);
      }, 550);
    });
    ['pointerup', 'pointercancel', 'pointermove'].forEach((type) =>
      row.addEventListener(type, () => clearTimeout(holdTimer)),
    );
    row.addEventListener(
      'click',
      (event) => {
        if (held) {
          event.preventDefault();
          event.stopImmediatePropagation();
          held = false;
        }
      },
      true,
    );
    row.addEventListener('keydown', (event) => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
        const rect = row.getBoundingClientRect();
        event.preventDefault();
        showTreeMenu({ preventDefault() {}, clientX: rect.left, clientY: rect.bottom }, wrapper);
      }
    });
    if (node.coin_marked) {
      const coin = document.createElement('span');
      coin.className = 'tree-coin';
      coin.textContent = '🪙';
      coin.setAttribute('aria-label', 'Coin-marked item');
      row.append(coin);
    }
    wrapper.append(row);
    (node.announcements || []).forEach((item) => {
      const note = document.createElement('p');
      note.className = 'tree-note';
      note.textContent = item.message;
      wrapper.append(note);
    });
    if (isFolder && node.children.length) {
      const children = document.createElement('div');
      children.className = 'tree-children';
      children.setAttribute('role', 'group');
      node.children.forEach((child) => {
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
    const built = buildTree(state.snapshot.nodes || []);
    const roots = built.length === 1 && built[0].kind === 'folder' ? built[0].children : built;
    document.querySelector('#catalogue-mode')?.remove();
    const all = new Map();
    const visit = (nodes, trail = []) =>
      nodes.forEach((node) => {
        all.set(String(node.id), { node, trail });
        visit(node.children || [], [...trail, node]);
      });
    visit(roots);
    const key = 'smr_catalogue_location_v2';
    if (tree.dataset.folder === undefined) {
      try {
        tree.dataset.folder = localStorage.getItem(key) || '';
      } catch {
        tree.dataset.folder = '';
      }
    }
    const selected = all.get(tree.dataset.folder);
    const current = selected?.node;
    const trail = selected ? [...selected.trail, current] : [];
    const navigate = (id) => {
      tree.dataset.folder = String(id || '');
      try {
        localStorage.setItem(key, tree.dataset.folder);
      } catch {}
      renderCatalogue();
    };
    const navigation = document.createElement('nav');
    navigation.className = 'catalogue-location';
    navigation.setAttribute('aria-label', 'Catalogue location');
    if (current) {
      const back = actionButton('← Back', () => navigate(selected.trail.at(-1)?.id));
      back.className = 'catalogue-back icon-button';
      back.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>';
      back.setAttribute('aria-label', 'Back');
      back.title = 'Back';
      navigation.append(back);
      const home = actionButton('Years', () => navigate(''));
      home.className = 'catalogue-crumb';
      navigation.append(home);
      trail.slice(0, -1).forEach((node, index) => {
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        separator.setAttribute('aria-hidden', 'true');
        const crumb = actionButton(node.name, () => navigate(node.id));
        crumb.className = 'catalogue-crumb';
        if (index === trail.length - 1) crumb.setAttribute('aria-current', 'page');
        navigation.append(separator, crumb);
      });
      const trailingSeparator = document.createElement('span');
      trailingSeparator.textContent = ' / ';
      trailingSeparator.setAttribute('aria-hidden', 'true');
      navigation.append(trailingSeparator);
      tree.append(navigation);
    }
    const contents = current ? current.children : roots;
    const inUnit = trail.length >= 3;
    tree.classList.toggle('unit-content', inUnit);
    const heading = document.createElement('h2');
    heading.className = 'catalogue-section-title';
    heading.textContent = current ? current.name : 'Years';
    tree.append(heading);
    if (inUnit) {
      const expand = (nodes) =>
        nodes.forEach((node) => {
          if (node.kind === 'folder' && !state.collapsedNodeIds.has(String(node.id)))
            state.expandedNodeIds.add(String(node.id));
          expand(node.children || []);
        });
      expand(contents);
      contents.forEach((node) => {
        const element = createNode(node, 0);
        if (element) tree.append(element);
      });
    } else {
      const grid = document.createElement('div');
      grid.className = 'catalogue-card-grid';
      contents.forEach((node, index) => {
        if (node.kind !== 'folder') {
          const element = createNode(node, 0);
          if (element) grid.append(element);
          return;
        }
        const card = actionButton(node.name, () => navigate(node.id));
        const course =
          trail.length === 2 &&
          String(node.name).match(/^([A-Z]{2,8}\s*\d{3,5})\s*[-–—:]\s*(.+)$/i);
        if (course) {
          card.textContent = course[2];
          const code = document.createElement('small');
          code.className = 'course-code';
          code.textContent = course[1];
          card.append(code);
        }
        card.className = 'classroom-card';
        card.setAttribute('aria-label', node.name);
        card.dataset.tone = String(index % 6);
        const caption = document.createElement('span');
        caption.className = 'classroom-card-caption';
        caption.textContent =
          trail.length === 0
            ? 'Explore semesters →'
            : trail.length === 1
              ? 'Explore units →'
              : 'View materials →';
        card.append(caption);
        grid.append(card);
      });
      tree.append(grid);
    }
    updateExpandControl();
    syncStatus.title = state.snapshot.generated_at
      ? 'Catalogue refreshed ' + new Date(state.snapshot.generated_at).toLocaleString()
      : 'Refresh time unavailable for this saved catalogue';
    emptyState.hidden = contents.length !== 0;
    renderSearch();
  }

  function loadCachedCatalogue() {
    try {
      const cached = JSON.parse(localStorage.getItem('smr_public_catalogue_v1') || 'null');
      if (!cached || !cached.saved_at || !Array.isArray(cached.snapshot?.nodes)) return;
      state.snapshot = cached.snapshot;
      renderCatalogue();
      syncStatus.innerHTML = '<span class="status-dot"></span>Refreshing';
    } catch {
      localStorage.removeItem('smr_public_catalogue_v1');
    }
  }
  function savePublicCatalogue(snapshot) {
    try {
      localStorage.setItem(
        'smr_public_catalogue_v1',
        JSON.stringify({
          saved_at: Date.now(),
          snapshot: { nodes: snapshot.nodes || [] },
        }),
      );
    } catch {
      /* Browsing still works when browser storage is full or disabled. */
    }
  }
  async function loadCatalogue() {
    busy(syncStatus);
    if (!state.snapshot?.nodes?.length)
      fetch('./catalogue-fallback.json')
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((saved) => {
          if (!state.snapshot?.nodes?.length && Array.isArray(saved.nodes) && saved.nodes.length) {
            state.snapshot = saved;
            renderCatalogue();
            syncStatus.textContent = 'Saved catalogue';
          }
        })
        .catch(() => {});
    try {
      state.snapshot = await callServer('getCatalogueSnapshot', '');
      loadExpansionState();
      savePublicCatalogue(state.snapshot);
      renderCatalogue();
      if (state.token) {
        try {
          await refreshMemberCatalogueState();
        } catch (error) {
          showToast('Account access could not refresh. Please try again.');
        }
      }
      updateAccount();
      renderCatalogue();
      syncStatus.innerHTML = state.snapshot.stale
        ? '<span class="status-dot"></span>Cached'
        : '<span class="status-dot"></span>Synced';
      syncStatus.title = state.snapshot.generated_at
        ? 'Catalogue refreshed ' +
          new Date(state.snapshot.generated_at).toLocaleString() +
          (state.snapshot.stale ? ' (saved copy)' : '')
        : 'Refresh time unavailable';
    } catch (error) {
      if (!state.snapshot?.nodes?.length) {
        try {
          const response = await fetch('./catalogue-fallback.json');
          if (!response.ok) throw new Error('No saved catalogue');
          const saved = await response.json();
          if (!Array.isArray(saved.nodes) || !saved.nodes.length)
            throw new Error('Invalid saved catalogue');
          state.snapshot = saved;
          renderCatalogue();
        } catch {
          tree.innerHTML =
            '<p class="loading-state">Could not reach the catalogue. Please reconnect and refresh.</p>';
        }
      }
      syncStatus.textContent = state.snapshot?.nodes?.length ? 'Saved catalogue' : 'Offline';
      syncStatus.title =
        'Live refresh is unavailable. Saved listings may be out of date; purchases still require a live check.';
    }
  }

  if (accountButton) accountButton.addEventListener('click', openAccount);
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  document
    .querySelector('#close-request-dialog')
    .addEventListener('click', () => closeRequestDialog(false));
  document
    .querySelector('#cancel-request')
    .addEventListener('click', () => closeRequestDialog(false));
  document
    .querySelector('#confirm-request')
    .addEventListener('click', () => closeRequestDialog(true));
  requestDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeRequestDialog(false);
  });
  document
    .querySelectorAll('.back-button')
    .forEach((button) => button.addEventListener('click', () => showForm('')));
  document.querySelector('#show-login').addEventListener('click', () => showForm('login-form'));
  document.querySelector('#show-signup').addEventListener('click', () => showForm('school-form'));
  dialog.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        form.setAttribute('aria-busy', 'true');
        button.disabled = true;
        button.classList.add('is-loading');
      }
    },
    true,
  );
  document.querySelector('#contribute-button').addEventListener('click', () => {
    state.contributionTaskId = '';
    chooseFolder((id) => openContribution(id));
  });
  document
    .querySelector('#close-contribution-dialog')
    .addEventListener('click', () => contributionDialog.close());
  document.querySelector('#sign-out').addEventListener('click', async () => {
    try {
      await callServer('signOut', state.token);
    } catch {
      /* Local sign-out still succeeds. */
    }
    state.token = '';
    invalidateViews();
    warmingToken = '';
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
  let searchTimer;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderSearch, 250);
  });
  search.addEventListener('paste', (event) => {
    const text = event.clipboardData?.getData('text');
    if (text && /[\n\r\uFFFC]/.test(text)) {
      event.preventDefault();
      search.value = text.replace(/[\n\r\uFFFC]+/g, '; ');
      renderSearch();
    }
  });
  function updateExpandControl() {
    const button = document.querySelector('#expand-all');
    const folders = [...tree.querySelectorAll('.tree-node-folder')];
    button.hidden = !tree.classList.contains('unit-content') || !folders.length;
    const allOpen = folders.every((node) => node.dataset.open === 'true');
    button.dataset.collapse = String(allOpen);
    button.title = allOpen ? 'Collapse all folders' : 'Expand all folders';
    button.setAttribute('aria-label', button.title);
    button.querySelector('span').textContent = allOpen ? 'unfold_less' : 'unfold_more';
  }
  document.querySelector('#expand-all').addEventListener('click', () => {
    const open = document.querySelector('#expand-all').dataset.collapse !== 'true';
    tree
      .querySelectorAll('.tree-node-folder')
      .forEach((node) => setFolderOpen(node, open, false, true));
    saveExpansionState();
    updateExpandControl();
  });
  new MutationObserver(updateExpandControl).observe(tree, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-open'],
  });
  tree.addEventListener('contextmenu', (event) => {
    const row = event.target.closest('.tree-row');
    const nodeElement = row && row.parentElement;
    if (nodeElement) showTreeMenu(event, nodeElement);
  });
  treeMenuRequest.addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node) requestAccess(node, true);
  });
  treeMenuOpen.addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node?.kind === 'file') requestAccess(node, true);
    else if (node && node.web_url) window.open(node.web_url, '_blank', 'noopener');
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
  document.querySelector('#tree-menu-collapse-level').addEventListener('click', () => {
    setFoldersAtDepth(state.contextDepth, false);
    hideTreeMenu();
  });
  document.querySelector('#tree-menu-expand-level').addEventListener('click', () => {
    setFoldersAtDepth(state.contextDepth, true);
    hideTreeMenu();
  });
  const adminDriveDialog = document.querySelector('#admin-drive-dialog');
  const directAdminActions = {
    rename: 'Rename',
    create: 'New folder',
    grant: 'Share',
    revoke: 'Remove access',
    permissions: 'Who has access',
    trash: 'Move to trash',
  };
  Object.entries(directAdminActions).forEach(([action, title]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.textContent = title;
    button.dataset.adminAction = action;
    treeMenu.append(button);
    button.onclick = () => {
      const node = snapshotNodeById(state.contextNodeId);
      if (!node || !state.member?.is_admin) return;
      document.querySelector('#tree-menu-admin').click();
      adminDriveDialog.querySelector('h2').textContent = title;
      const name = document.querySelector('#admin-drive-name');
      name.value = action === 'create' ? '' : node.name;
      name.closest('label').hidden = !['rename', 'create'].includes(action);
      document.querySelector('#admin-drive-email').closest('label').hidden = ![
        'grant',
        'revoke',
      ].includes(action);
      document.querySelector('#admin-drive-role').closest('label').hidden = action !== 'grant';
      Object.keys(directAdminActions).forEach(
        (key) => (document.querySelector('#admin-drive-' + key).hidden = key !== action),
      );
      if (action === 'permissions') adminDriveRun('permissions');
    };
  });
  let driveClipboard = null,
    pasting = false;
  const copyName = actionButton('Copy name', async () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node)
      try {
        await navigator.clipboard.writeText(node.name);
        showToast('Name copied.');
      } catch {
        showToast('Could not copy the name.');
      }
  });
  copyName.setAttribute('role', 'menuitem');
  copyName.dataset.icon = 'content_copy';
  treeMenu.append(copyName);
  const recheck = actionButton('Recheck Drive access', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (node?.kind === 'file') {
      confirmedAccess.delete(accessKey(node));
      node.checkToken = 'force';
      requestAccess(node, true);
    }
  });
  recheck.setAttribute('role', 'menuitem');
  recheck.dataset.icon = 'refresh';
  treeMenu.append(recheck);
  ['copy', 'cut', 'paste', 'cascade'].forEach((action) => {
    const button = document.createElement('button');
    button.id = 'tree-' + action;
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.textContent = {
      copy: 'Copy',
      cut: 'Cut',
      paste: 'Paste',
      cascade: 'Expand all subfolders for everyone',
    }[action];
    treeMenu.append(button);
    button.onclick = () => {
      const node = snapshotNodeById(state.contextNodeId);
      hideTreeMenu();
      if (!node) return;
      if (action === 'copy' || action === 'cut') setDriveClipboard(node, action);
      else if (action === 'paste') pasteDrive(node);
      else setCascade(node);
    };
  });
  function updateDriveMenu(node) {
    recheck.hidden = node?.kind !== 'file';
    const admin = Boolean(state.member?.is_admin);
    ['copy', 'cut', 'paste', 'cascade'].forEach((action) => {
      const button = document.querySelector('#tree-' + action);
      if (!button) return;
      button.hidden =
        !admin || !node || (['paste', 'cascade'].includes(action) && node.kind !== 'folder');
      button.disabled =
        (action === 'copy' && node?.kind === 'folder') ||
        (action === 'paste' && (!driveClipboard || pasting));
    });
    const button = document.querySelector('#tree-cascade');
    if (button)
      button.textContent = node?.expand_descendants
        ? 'Stop automatic subfolder expansion'
        : 'Expand all subfolders for everyone';
  }
  function setDriveClipboard(node, mode) {
    if (!state.member?.is_admin) return;
    if (mode === 'copy' && node.kind === 'folder')
      return showToast('Folders can be cut and moved; select a file to copy.');
    driveClipboard = {
      id: node.id,
      name: node.name,
      mode,
      member: state.member.member_id,
    };
    tree.querySelectorAll('.is-cut').forEach((el) => el.classList.remove('is-cut'));
    if (mode === 'cut') folderOrFile(node.id)?.classList.add('is-cut');
    showToast(
      node.name +
        ' ' +
        (mode === 'cut' ? 'ready to move.' : 'copied.') +
        ' Choose a folder and paste.',
    );
  }
  function folderOrFile(id) {
    return [...tree.querySelectorAll('.tree-node')].find((el) => el.dataset.nodeId === String(id));
  }
  async function pasteDrive(node) {
    if (!state.member?.is_admin || !driveClipboard || pasting) return;
    if (node.kind !== 'folder') return showToast('Select a destination folder first.');
    if (driveClipboard.member !== state.member.member_id) {
      driveClipboard = null;
      return;
    }
    pasting = true;
    showToast('Saving to Drive…');
    try {
      await callServer('adminPaste', node.id, driveClipboard.id, driveClipboard.mode);
      if (driveClipboard.mode === 'cut') driveClipboard = null;
      await loadCatalogue();
      showToast('Saved to ' + node.name + '.');
    } catch (error) {
      showToast(error.message);
    } finally {
      pasting = false;
    }
  }
  async function setCascade(node) {
    try {
      await callServer('adminCascade', node.id, !node.expand_descendants);
      node.expand_descendants = !node.expand_descendants;
      localStorage.removeItem('smr_public_catalogue_v1');
      showToast(
        node.expand_descendants
          ? 'Opening this folder will expand all subfolders for everyone.'
          : 'Automatic expansion removed.',
      );
    } catch (error) {
      showToast(error.message);
    }
  }
  document.addEventListener('keydown', (event) => {
    if (
      !state.member?.is_admin ||
      !(event.ctrlKey || event.metaKey) ||
      event.target.closest('input,textarea,[contenteditable="true"]') ||
      document.querySelector('dialog[open]')
    )
      return;
    const node = snapshotNodeById(state.selectedNodeId);
    if (!node || document.querySelector('#top').hidden) return;
    const key = event.key.toLowerCase();
    if (['c', 'x', 'v'].includes(key)) {
      event.preventDefault();
      if (key === 'v') pasteDrive(node);
      else setDriveClipboard(node, key === 'c' ? 'copy' : 'cut');
    }
  });
  document.querySelector('#tree-menu-admin').addEventListener('click', () => {
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (!node) return;
    document.querySelector('#admin-drive-node').textContent = cataloguePathFor(node);
    document.querySelector('#admin-drive-name').value = node.name;
    document.querySelector('#admin-drive-actions').hidden = false;
    document.querySelector('#admin-drive-create').hidden = node.kind !== 'folder';
    document.querySelector('#admin-drive-copy').hidden = node.kind !== 'folder';
    document.querySelector('#admin-drive-status').textContent = '';
    adminDriveDialog.dataset.nodeId = node.id;
    adminDriveDialog.dataset.nodeKind = node.kind;
    adminDriveDialog.showModal();
  });
  document.querySelector('#close-admin-drive').onclick = () => adminDriveDialog.close();
  async function adminDriveRun(action) {
    const id = adminDriveDialog.dataset.nodeId,
      status = document.querySelector('#admin-drive-status');
    busy(status);
    try {
      const name = document.querySelector('#admin-drive-name').value,
        email = document.querySelector('#admin-drive-email').value,
        role = document.querySelector('#admin-drive-role').value,
        source = document.querySelector('#admin-drive-source').value;
      const result = await callServer('adminDriveAction', action, id, name, email, role, source);
      status.textContent =
        action === 'permissions'
          ? result.people.map((p) => p.email + ' · ' + p.role).join('\n') ||
            'No direct viewers or editors.'
          : action === 'trash'
            ? 'Moved to Drive trash.'
            : 'Saved to Drive.';
      await loadCatalogue();
    } catch (error) {
      status.textContent = error.message;
    }
  }
  document.querySelector('#admin-drive-rename').onclick = () => adminDriveRun('rename');
  document.querySelector('#admin-drive-create').onclick = () => adminDriveRun('create_folder');
  document.querySelector('#admin-drive-copy').style.display = 'none';
  document.querySelector('#admin-drive-shortcut').style.display = 'none';
  document.querySelector('#admin-drive-grant').onclick = () => adminDriveRun('grant');
  document.querySelector('#admin-drive-revoke').onclick = () => adminDriveRun('revoke');
  document.querySelector('#admin-drive-permissions').onclick = () => adminDriveRun('permissions');
  document.querySelector('#admin-drive-trash').onclick = () => {
    if (confirm('Move this item to Drive trash? It can be restored from Drive.'))
      adminDriveRun('trash');
  };
  document.addEventListener('pointerdown', (event) => {
    if (!treeMenu.hidden && !treeMenu.contains(event.target)) hideTreeMenu();
  });
  window.addEventListener('resize', hideTreeMenu);
  window.addEventListener('scroll', hideTreeMenu, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !treeMenu.hidden) hideTreeMenu();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search.focus();
    }
  });

  contributionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = contributionForm.querySelector('button[type=submit]');
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add('is-loading');
    contributionMessage.textContent = '';
    try {
      const result = await callServer(
        'submitCatalogueContribution',
        state.token,
        state.contributionTargetId,
        document.querySelector('#contribution-title-input').value,
        document.querySelector('#contribution-url').value,
        document.querySelector('#contribution-note').value,
      );
      contributionDialog.close();
      contributionForm.reset();
      loadReviews();
      showToast(
        result.duplicate
          ? 'That contribution is already waiting for review.'
          : 'Submitted for community review.',
      );
    } catch (error) {
      contributionMessage.textContent = error.message;
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  });

  document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.setAttribute('aria-busy', 'true');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.classList.add('is-loading');
    busy(formMessage, 'Signing you in…');
    try {
      const result = await callServer(
        'passwordLogin',
        document.querySelector('#login-email').value,
        document.querySelector('#login-password').value,
      );
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      dialog.close();
      updateAccount();
      warmViews();
      showToast('Signed in.');
      refreshMemberCatalogueState().catch((error) => showToast(error.message));
    } catch (error) {
      setMessage(error.message);
    } finally {
      form.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = 'Sign in';
    }
  });
  document.querySelector('#use-login-code').addEventListener('click', async () => {
    const button = document.querySelector('#use-login-code');
    button.disabled = true;
    button.classList.add('is-loading');
    setMessage('');
    try {
      const result = await callServer(
        'requestLoginCode',
        document.querySelector('#login-email').value,
      );
      state.loginChallengeId = result.challenge_id || '';
      showForm('login-code-form');
      setMessage('Your code is on the way.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  });
  document.querySelector('#login-code-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer(
        'completeLogin',
        state.loginChallengeId,
        document.querySelector('#login-code').value,
      );
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      updateAccount();
      showForm('password-setup-form');
      setMessage('Create a password to finish signing in.');
    } catch (error) {
      setMessage(error.message);
    }
  });
  document.querySelector('#school-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer(
        'requestSchoolSignupCode',
        document.querySelector('#school-email').value,
      );
      state.schoolChallengeId = result.challenge_id;
      showForm('school-code-form');
      setMessage('A school verification code was sent.');
    } catch (error) {
      setMessage(error.message);
    }
  });
  document.querySelector('#school-code-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const result = await callServer(
        'verifySchoolSignupCode',
        state.schoolChallengeId,
        document.querySelector('#school-code').value,
      );
      state.token = result.session_token;
      rememberMember(result.member);
      localStorage.setItem('smr_session_token_v1', state.token);
      updateAccount();
      showForm('password-setup-form');
      setMessage('Create a password for future sign-ins.');
    } catch (error) {
      setMessage(error.message);
    }
  });
  document.querySelector('#password-setup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.querySelector('#password-setup').value;
    if (password !== document.querySelector('#password-confirm').value)
      return setMessage('Those passwords do not match.');
    setMessage('');
    try {
      const result = await callServer('setPassword', state.token, password);
      rememberMember(result.member || state.member);
      updateAccount();
      dialog.close();
      document.querySelector('#password-setup-form').reset();
      showToast('Password saved. You can now sign in without a code.');
      refreshMemberCatalogueState().catch((error) => showToast(error.message));
    } catch (error) {
      setMessage(error.message);
    }
  });

  const taskDialog = document.querySelector('#task-dialog');
  let taskTargetId = '';
  let taskFilter = 'open',
    taskQuery = '';
  const taskTools = document.createElement('div');
  taskTools.className = 'task-tools';
  taskTools.innerHTML =
    '<div class="task-tabs" role="group" aria-label="Task status"><button type="button" data-task-filter="open" aria-pressed="true">Open</button><button type="button" data-task-filter="completed" aria-pressed="false">Completed</button></div><label class="task-search"><span class="material-symbols-outlined" aria-hidden="true">search</span><input type="search" placeholder="Search tasks" aria-label="Search tasks"></label><p class="task-count" role="status"></p>';
  document.querySelector('#community-list').before(taskTools);
  function filterTasks() {
    let count = 0;
    document.querySelectorAll('#community-list > .community-task').forEach((card) => {
      card.hidden =
        (card.dataset.status === 'completed') !== (taskFilter === 'completed') ||
        !card.dataset.search.includes(taskQuery);
      if (!card.hidden) count++;
    });
    taskTools.querySelector('.task-count').textContent = count + (count === 1 ? ' task' : ' tasks');
    taskTools
      .querySelectorAll('[data-task-filter]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.taskFilter === taskFilter)),
      );
  }
  taskTools.querySelectorAll('[data-task-filter]').forEach(
    (button) =>
      (button.onclick = () => {
        taskFilter = button.dataset.taskFilter;
        filterTasks();
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
          document.querySelector('#community-list').animate(
            [
              { opacity: 0, transform: 'translateY(5px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 180, easing: 'ease-out' },
          );
      }),
  );
  taskTools.querySelector('input').addEventListener('input', (event) => {
    taskQuery = event.target.value.trim().toLowerCase();
    filterTasks();
  });
  function taskNote(text) {
    const paragraph = document.createElement('p');
    paragraph.className = 'task-description';
    String(text || '')
      .split(/(https:\/\/[^\s"'<>]+)/g)
      .forEach((part) => {
        if (part.startsWith('https://')) {
          const link = document.createElement('a');
          link.href = part;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = part;
          paragraph.append(link);
        } else paragraph.append(document.createTextNode(part));
      });
    return paragraph;
  }
  async function loadCommunityTasks() {
    const status = document.querySelector('#community-status');
    const list = document.querySelector('#community-list');
    busy(status);
    list.replaceChildren();
    try {
      if (state.token && !state.member) {
        const account = await callServer('getMemberCatalogueState', state.token);
        rememberMember(account.member || null);
      }
      const result = await callServer('communityTasks');
      status.textContent = result.tasks.length
        ? ''
        : 'No tasks yet. Propose something useful for the class.';
      for (const task of result.tasks) {
        const card = document.createElement('details');
        card.className = 'community-task task-row';
        card.dataset.status = task.status;
        card.dataset.search = [task.title, task.note, task.target_path].join(' ').toLowerCase();
        const summary = document.createElement('summary');
        const marker = document.createElement('span');
        marker.className = 'material-symbols-outlined task-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent =
          task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked';
        const title = document.createElement('h3');
        title.textContent = task.title;
        const path = document.createElement('p');
        path.className = 'dialog-copy';
        path.textContent = task.target_path;
        const note = taskNote(task.note);
        const vote = document.createElement('button');
        vote.type = 'button';
        vote.className = 'tonal-button';
        vote.textContent = (task.supported ? 'Supported' : 'Support') + ' · ' + task.votes;
        vote.setAttribute('aria-pressed', String(task.supported));
        vote.addEventListener('click', async () => {
          vote.disabled = true;
          try {
            await callServer('voteCommunityTask', task.id, !task.supported);
            await loadCommunityTasks();
          } catch (error) {
            status.textContent = error.message;
            vote.disabled = false;
          }
        });
        const badge = document.createElement('span');
        badge.className = 'task-row-status';
        badge.textContent =
          task.status === 'completed'
            ? 'Completed'
            : task.status === 'proposed'
              ? task.source_label
                ? coins(task.historical_reward_coins) + ' coins · Awaiting activation'
                : 'Proposal'
              : coins(task.reward_coins) + ' coins funded';
        summary.append(marker, title, badge);
        card.append(summary);
        const contents = document.createElement('div');
        contents.className = 'task-row-details';
        contents.append(path, note);
        card.append(contents);
        if (state.member?.is_admin)
          contents.append(actionButton('Edit task', () => editTask(task)));
        if (task.status === 'proposed' && task.source_label) {
          if (state.member?.is_admin) {
            const activate = actionButton('Activate with treasury funds', async () => {
              activate.disabled = true;
              busy(status);
              try {
                await callServer('activateImportedTask', task.id);
                await refreshMemberCatalogueState();
                await loadCommunityTasks();
              } catch (error) {
                status.textContent = error.message;
                activate.disabled = false;
              }
            });
            contents.append(activate);
          }
        } else if (task.status === 'proposed') contents.append(vote);
        else {
          const reward = document.createElement('p');
          reward.textContent =
            (task.status === 'completed' ? 'Website reward · ' : 'Funded reward · ') +
            coins(task.reward_coins) +
            ' coins';
          if (!task.source_label || task.status !== 'completed' || task.reward_coins > 0)
            contents.append(reward);
          if (task.status === 'open') {
            contents.append(actionButton('Add to reward', () => openFunding(task)));
            if (task.my_funding_coins > 0) {
              const requestId = crypto.randomUUID();
              contents.append(
                actionButton('Withdraw my ' + coins(task.my_funding_coins) + ' coins', async () => {
                  await callServer('fundCommunityTask', task.id, 0, requestId, true);
                  await refreshMemberCatalogueState();
                  await loadCommunityTasks();
                }),
              );
            }
            contents.append(
              actionButton('Submit work', () => {
                state.contributionTaskId = task.id;
                if (task.target_drive_item_id) openContribution(task.target_drive_item_id);
                else chooseFolder((id) => openContribution(id));
              }),
            );
          }
        }
        list.append(card);
      }
      filterTasks();
    } catch (error) {
      status.textContent = error.message;
    }
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
    const node = snapshotNodeById(state.contextNodeId);
    hideTreeMenu();
    if (!state.member) return openAccount();
    if (!node || node.kind !== 'folder') return;
    taskTargetId = node.id;
    document.querySelector('#task-form').reset();
    document.querySelector('#task-status').textContent = '';
    document.querySelector('#task-destination').textContent = cataloguePathFor(node);
    taskDialog.showModal();
  });
  document.querySelector('#task-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type=submit]');
    const status = document.querySelector('#task-status');
    button.disabled = true;
    busy(status);
    try {
      await callServer(
        'proposeCommunityTask',
        taskTargetId,
        document.querySelector('#task-name').value,
        document.querySelector('#task-note').value,
        document.querySelector('#task-type').value,
      );
      taskDialog.close();
      showView('contribute');
      await loadCommunityTasks();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  function actionButton(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tonal-button';
    button.textContent = label;
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      button.classList.add('is-loading');
      try {
        await action();
      } catch (error) {
        showToast(error.message);
      } finally {
        button.disabled = false;
        button.classList.remove('is-loading');
      }
    });
    return button;
  }
  const renderedViews = new Map();
  let navigationVersion = 0;
  async function showView(view) {
    if (view === 'tasks') view = 'contribute';
    if (!['top', 'contribute', 'chat', 'activity'].includes(view)) view = 'top';
    const version = ++navigationVersion,
      token = state.token;
    if (renderedViews.get(view) !== token) {
      window.SMRProgress?.start();
      try {
        if (view === 'contribute') await Promise.all([loadReviews(), loadCommunityTasks()]);
        if (view === 'activity') {
          historyCursor = 0;
          await Promise.all([loadHistory(), loadCommunityProfile()]);
        }
        if (view === 'chat') await chatUi.load();
        if (token === state.token) renderedViews.set(view, token);
      } finally {
        window.SMRProgress?.end();
      }
    }
    if (version !== navigationVersion) return;
    for (const id of ['top', 'contribute', 'lending', 'chat', 'activity'])
      document.getElementById(id).hidden = id !== view;
    document.getElementById('tasks').hidden = view !== 'contribute';
    document.querySelectorAll('[data-view]').forEach((button) => {
      if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    search.closest('label').style.visibility = '';
    document.dispatchEvent(new CustomEvent('smr-view', { detail: { view } }));
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
  }
  function editTask(task) {
    const modal = document.createElement('dialog');
    modal.className = 'account-dialog';
    const form = document.createElement('form');
    const title = document.createElement('input'),
      note = document.createElement('textarea'),
      reward = document.createElement('input'),
      status = document.createElement('select');
    title.value = task.title;
    title.required = true;
    note.value = task.note || '';
    reward.type = 'number';
    reward.min = '0';
    reward.step = '0.001';
    reward.value = task.historical_reward_coins || task.reward_coins || 0;
    for (const value of ['proposed', 'open', 'completed']) {
      const option = new Option(value, value);
      status.append(option);
    }
    status.value = task.status;
    for (const [label, input] of [
      ['Title', title],
      ['Description', note],
      ['Treasury reward', reward],
      ['Status', status],
    ]) {
      const field = document.createElement('label');
      field.textContent = label;
      field.append(input);
      form.append(field);
    }
    const hint = document.createElement('p');
    hint.textContent =
      'Marking complete here releases unused reward funds. Reviewed submissions receive their reward through review.';
    form.append(hint);
    const save = document.createElement('button');
    save.type = 'submit';
    save.textContent = 'Save';
    save.className = 'tonal-button';
    const cancel = actionButton('Cancel', () => modal.close());
    cancel.type = 'button';
    form.append(save, cancel);
    const message = document.createElement('p');
    form.append(message);
    const request_id = crypto.randomUUID();
    form.onsubmit = async (event) => {
      event.preventDefault();
      save.disabled = true;
      busy(message);
      try {
        await callServer('adminEditTask', {
          task_id: task.id,
          title: title.value,
          note: note.value,
          reward_coins: reward.value,
          status: status.value,
          request_id,
        });
        invalidateViews();
        await loadCommunityTasks();
        modal.close();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    };
    modal.append(form);
    document.body.append(modal);
    modal.onclose = () => modal.remove();
    modal.showModal();
  }
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  document.querySelector('.brand').addEventListener('click', () => showView('top'));
  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
  const picker = document.querySelector('#folder-picker');
  let pickerId = '',
    pickCallback;
  function chooseFolder(callback) {
    if (!state.member) return openAccount();
    pickCallback = callback;
    pickerId = '';
    renderPicker();
    picker.showModal();
  }
  function renderPicker() {
    let filter = document.querySelector('#picker-search');
    if (!filter) {
      filter = document.createElement('input');
      filter.id = 'picker-search';
      filter.type = 'search';
      filter.placeholder = 'Find a unit or folder';
      filter.setAttribute('aria-label', 'Find a destination folder');
      document.querySelector('#picker-path').before(filter);
      filter.addEventListener('input', () => {
        clearTimeout(filter.searchTimer);
        filter.searchTimer = setTimeout(renderPicker, 200);
      });
    }
    const folders = (state.snapshot?.nodes || []).filter((node) => node.kind === 'folder');
    const folderIds = new Set(folders.map((node) => String(node.id)));
    const current = snapshotNodeById(pickerId);
    document.querySelector('#picker-path').textContent = current
      ? cataloguePathFor(current)
      : 'Browse folders';
    document.querySelector('#picker-use').disabled = !current;
    document.querySelector('#picker-back').disabled = !current;
    const list = document.querySelector('#picker-folders');
    list.replaceChildren();
    const query = filter.value.trim().toLowerCase();
    const children = query
      ? folders
          .filter((node) =>
            query.split(/\s+/).every((term) => cataloguePathFor(node).toLowerCase().includes(term)),
          )
          .slice(0, 60)
      : folders.filter((node) =>
          pickerId
            ? String(node.parent_id) === String(pickerId)
            : !folderIds.has(String(node.parent_id)),
        );
    children.forEach((node) =>
      list.append(
        actionButton((query ? cataloguePathFor(node) : node.name) + ' ›', () => {
          pickerId = node.id;
          filter.value = '';
          renderPicker();
        }),
      ),
    );
    if (query && !children.length) list.textContent = 'No matching folders.';
  }
  document.querySelector('#picker-back').onclick = () => {
    pickerId = snapshotNodeById(pickerId)?.parent_id || '';
    renderPicker();
  };
  document.querySelector('#picker-use').onclick = () => {
    picker.close();
    pickCallback(pickerId);
  };
  document.querySelector('#close-picker').onclick = () => picker.close();
  const fundDialog = document.querySelector('#fund-dialog');
  let fundingTask, fundingRequest;
  function openFunding(task) {
    fundingTask = task;
    fundingRequest = null;
    document.querySelector('#fund-form').reset();
    document.querySelector('#fund-amount').disabled = false;
    document.querySelector('#fund-task').textContent = task.title;
    document.querySelector('#fund-status').textContent = '';
    let presets = document.querySelector('#fund-presets');
    if (!presets) {
      presets = document.createElement('div');
      presets.id = 'fund-presets';
      presets.className = 'dialog-actions';
      for (const amount of [1, 2, 5, 'Custom']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tonal-button';
        button.textContent =
          amount === 'Custom' ? amount : amount + (amount === 1 ? ' coin' : ' coins');
        button.onclick = () => {
          const input = document.querySelector('#fund-amount');
          if (input.disabled) return;
          input.value = amount === 'Custom' ? '' : String(amount);
          input.focus();
        };
        presets.append(button);
      }
      document.querySelector('#fund-amount').insertAdjacentElement('afterend', presets);
    }
    fundDialog.showModal();
  }
  document.querySelector('#close-fund').onclick = () => fundDialog.close();
  document.querySelector('#fund-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    if (button.disabled) return;
    const input = document.querySelector('#fund-amount');
    // Keep the exact same request reference and amount after an uncertain response.
    fundingRequest ||= { id: crypto.randomUUID(), coins: input.value };
    input.disabled = true;
    button.disabled = true;
    const status = document.querySelector('#fund-status');
    busy(status);
    try {
      await callServer(
        'fundCommunityTask',
        fundingTask.id,
        fundingRequest.coins,
        fundingRequest.id,
        false,
      );
      fundDialog.close();
      await refreshMemberCatalogueState();
      await loadCommunityTasks();
    } catch (error) {
      status.textContent = error.message + ' You can retry this same contribution safely.';
    } finally {
      button.disabled = false;
    }
  };
  async function loadReviews() {
    const status = document.querySelector('#review-status');
    const list = document.querySelector('#review-list');
    const mine = document.querySelector('#submission-list');
    list.replaceChildren();
    mine.replaceChildren();
    if (!state.token) {
      status.textContent = 'Sign in to submit material and review contributions.';
      return;
    }
    busy(status);
    try {
      const data = await callServer('communityReviewQueue');
      document.querySelector('#year-form').hidden = false;
      if (data.academic_year)
        document.querySelector('#review-year').value = String(data.academic_year);
      status.textContent = data.is_admin
        ? 'Administrator review · one approval publishes.'
        : data.academic_year
          ? 'Year ' + data.academic_year + ' · Two independent approvals are required.'
          : 'Set your year to see matching review tasks.';
      if (!data.items.length && data.next_review_at)
        status.textContent =
          'Your next community review becomes available ' +
          new Date(data.next_review_at).toLocaleDateString() +
          '.';
      if (!data.items.length) list.textContent = 'No matching submissions to review right now.';
      data.items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'community-task';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const publishedName = document.createElement('input');
        publishedName.value = item.title;
        publishedName.maxLength = 180;
        publishedName.setAttribute('aria-label', 'Published file name');
        publishedName.className = 'review-name';
        const detail = document.createElement('p');
        detail.textContent = item.path + (item.note ? ' — ' + item.note : '');
        if (item.task) detail.textContent += '\nTask: ' + item.task.title + ' — ' + item.task.note;
        if (item.my_decision)
          detail.textContent +=
            '\nYour review: ' +
            item.my_decision +
            '. Waiting for the community; retry your recorded decision if publication was interrupted.';
        const explanation = document.createElement('textarea');
        explanation.placeholder = 'What needs fixing? Required when rejecting.';
        explanation.maxLength = 1000;
        explanation.setAttribute('aria-label', 'Review note');
        card.classList.add('review-card');
        card.append(
          title,
          detail,
          publishedName,
          actionButton('Open material', async () => {
            const tab = window.open('about:blank', '_blank');
            if (tab) tab.opener = null;
            try {
              const result = await callServer('reviewContribution', item.id, 'open');
              if (tab) tab.location.href = result.url;
              else showToast('Allow pop-ups to open the review material.');
            } catch (error) {
              if (tab) tab.close();
              throw error;
            }
          }),
          explanation,
        );
        for (const decision of item.my_decision ? [item.my_decision] : ['approve', 'reject'])
          card.append(
            actionButton(
              item.my_decision
                ? 'Check completion'
                : decision === 'approve'
                  ? 'Approve'
                  : 'Request changes',
              async () => {
                const result = await callServer(
                  'reviewContribution',
                  item.id,
                  decision,
                  explanation.value,
                  publishedName.value,
                );
                showToast(
                  result.status === 'pending'
                    ? 'Review recorded. Waiting for another independent reviewer.'
                    : 'Submission ' + result.status + '.',
                );
                await loadReviews();
              },
            ),
          );
        list.append(card);
      });
      data.mine.forEach((item) => {
        const row = document.createElement('article');
        row.className = 'submission-row';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const badge = document.createElement('span');
        badge.className = 'status-chip';
        badge.textContent = item.status;
        row.append(title, badge);
        if (item.source_url && /^https:\/\//i.test(item.source_url)) {
          const link = document.createElement('a');
          link.href = item.source_url;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'View submitted material';
          row.append(link);
        }
        if (item.needs_preparation)
          row.append(
            actionButton('Prepare for review', async () => {
              await callServer(
                'submitCatalogueContribution',
                state.token,
                item.target_id,
                item.title,
                item.source_url,
                item.note,
                '',
              );
              await loadReviews();
            }),
          );
        mine.append(row);
      });
      if (!data.mine.length) mine.textContent = 'Your submissions will appear here.';
    } catch (error) {
      status.textContent = error.message;
    }
  }
  document.querySelector('#year-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      await callServer('setCommunityYear', document.querySelector('#review-year').value);
      invalidateViews();
      await loadReviews();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  };

  const coinflipDialog = document.querySelector('#coinflip-dialog');
  async function loadCoinflips() {
    const status = document.querySelector('#coinflip-status'),
      list = document.querySelector('#coinflip-list'),
      recent = document.querySelector('#coinflip-recent');
    list.replaceChildren();
    recent.replaceChildren();
    if (!state.token) {
      status.textContent = 'Sign in to create or accept a coinflip.';
      return;
    }
    busy(status);
    try {
      const data = await callServer('getCoinflips');
      status.textContent = data.open.length ? '' : 'No open coinflips right now.';
      data.open.forEach((flip) => {
        const card = document.createElement('article');
        card.className = 'community-task coinflip-card';
        const title = document.createElement('h3');
        title.textContent = coins(flip.stake_coins) + ' 🪙 · ' + flip.chosen_side;
        const detail = document.createElement('p');
        detail.textContent = 'Winner receives ' + coins(flip.stake_coins * 2) + ' coins.';
        card.append(
          title,
          detail,
          actionButton('Accept', async () => {
            const result = await callServer('acceptCoinflip', flip.id);
            state.member.balance_coins = result.balance_coins;
            updateAccount();
            showToast(
              (result.winner_id === state.member.member_id ? 'You won ' : 'Coinflip resolved: ') +
                result.side +
                '.',
            );
            await loadCoinflips();
          }),
        );
        list.append(card);
      });
      (data.mine_open || []).forEach((flip) => {
        const card = document.createElement('article');
        card.className = 'community-task coinflip-card';
        const title = document.createElement('h3');
        title.textContent = 'Your wager · ' + coins(flip.stake_coins) + ' 🪙 · ' + flip.chosen_side;
        const detail = document.createElement('p');
        detail.textContent =
          'Open for another member. The 2-coin burn fee is not refunded if cancelled.';
        card.append(
          title,
          detail,
          actionButton('Cancel wager', async () => {
            const result = await callServer('cancelCoinflip', flip.id);
            state.member.balance_coins = result.balance_coins;
            updateAccount();
            showToast('Wager cancelled; stake refunded.');
            await loadCoinflips();
          }),
        );
        list.append(card);
      });
      data.recent.forEach((flip) => {
        const row = document.createElement('p');
        row.className = 'history-row';
        row.textContent =
          coins(flip.stake_coins) +
          ' 🪙 · ' +
          flip.chosen_side +
          ' · ' +
          (flip.winner_id === state.member.member_id ? 'won' : 'lost');
        recent.append(row);
      });
      if (!data.recent.length) recent.textContent = 'Your resolved coinflips will appear here.';
    } catch (error) {
      status.textContent = error.message;
    }
  }
  document.querySelector('#create-coinflip').onclick = () => {
    if (!state.token) return openAccount();
    document.querySelector('#coinflip-form').reset();
    document.querySelector('#coinflip-form-status').textContent = '';
    coinflipDialog.showModal();
  };
  document.querySelector('#close-coinflip').onclick = () => coinflipDialog.close();
  document.querySelector('#coinflip-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      const result = await callServer(
        'createCoinflip',
        document.querySelector('#coinflip-stake').value,
        document.querySelector('#coinflip-side').value,
        crypto.randomUUID(),
      );
      state.member.balance_coins = result.balance_coins;
      updateAccount();
      coinflipDialog.close();
      showToast('Coinflip created.');
      await loadCoinflips();
    } catch (error) {
      document.querySelector('#coinflip-form-status').textContent = error.message;
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  };

  const profileDialog = document.querySelector('#profile-dialog');
  function setPrivacySwitches(privacy) {
    ['balance', 'submissions', 'completed_tasks'].forEach((key) => {
      const control = document.querySelector('#privacy-' + key);
      if (control) control.checked = Boolean(privacy && privacy['show_' + key]);
    });
  }
  async function openProfile(address) {
    if (!state.token) return openAccount();
    const content = document.querySelector('#profile-content');
    busy(content);
    profileDialog.showModal();
    try {
      const profile = await callServer('memberProfileSummary', address);
      content.replaceChildren();
      const monogram = document.createElement('span');
      monogram.className = 'profile-monogram';
      monogram.textContent = profile.initials;
      const title = document.createElement('h3');
      title.textContent = profile.handle;
      content.append(monogram, title);
      [
        [
          'Coin balance',
          profile.balance_coins == null ? null : coins(profile.balance_coins) + ' 🪙',
        ],
        ['Submissions', profile.submissions],
        ['Completed tasks', profile.completed_tasks],
      ].forEach(([label, value]) => {
        if (value !== null) {
          const stat = document.createElement('p');
          stat.textContent = label + ': ' + value;
          content.append(stat);
        }
      });
      if (profile.privacy) {
        document.querySelector('#privacy-settings').hidden = false;
        setPrivacySwitches(profile.privacy);
      } else document.querySelector('#privacy-settings').hidden = true;
    } catch (error) {
      content.textContent = error.message;
      document.querySelector('#privacy-settings').hidden = true;
    }
  }
  document.querySelector('#close-profile').onclick = () => profileDialog.close();
  document.querySelector('#privacy-settings').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      await callServer('updateMemberPrivacy', {
        show_balance: document.querySelector('#privacy-balance').checked,
        show_submissions: document.querySelector('#privacy-submissions').checked,
        show_completed_tasks: document.querySelector('#privacy-completed_tasks').checked,
      });
      showToast('Profile privacy updated.');
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  };

  let historyCursor = 0,
    historyRender = 0;
  async function loadHistory() {
    const status = document.querySelector('#history-status');
    const more = document.querySelector('#history-more');
    const list = document.querySelector('#history-list');
    const render = ++historyRender,
      cursor = historyCursor;
    if (!state.token) {
      status.textContent = 'Sign in to see your balance and requests.';
      list.replaceChildren();
      more.hidden = true;
      document.querySelector('#activity-balance').textContent = '—';
      document.querySelector('#activity-email').textContent = '';
      return;
    }
    document.querySelector('#activity-balance').textContent = state.member
      ? coins(state.member.balance_coins) + ' 🪙'
      : '—';
    document.querySelector('#activity-email').textContent = state.member?.delivery_email || '';
    more.disabled = true;
    busy(status);
    try {
      const result = await callServer('memberRequestHistory', cursor);
      if (render !== historyRender) return;
      if (!cursor) list.replaceChildren();
      result.items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'history-row';
        const title = document.createElement('h3');
        title.textContent = item.file;
        const detail = document.createElement('p');
        const date = new Date(item.date);
        const when = Number.isNaN(date.valueOf()) ? '' : date.toLocaleString();
        detail.textContent =
          (item.source === 'legacy' ? 'Imported record' : 'Website request') +
          ' · ' +
          String(item.status).toLowerCase() +
          (when ? ' · ' + when : '');
        const amount = document.createElement('span');
        amount.className = 'history-amount';
        amount.textContent = item.coins == null ? '—' : coins(item.coins) + ' 🪙';
        card.append(title, detail, amount);
        list.append(card);
      });
      status.textContent = list.children.length ? '' : 'No file requests recorded yet.';
      historyCursor = result.next_cursor;
      more.hidden = historyCursor === null;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      more.disabled = false;
    }
  }
  document.querySelector('#show-history').onclick = () => {
    dialog.close();
    showView('activity');
  };
  document.querySelector('#history-more').onclick = loadHistory;
  document.querySelector('#activity-account').onclick = openAccount;
  document.querySelector('#send-coins-form').onsubmit = async (event) => {
    event.preventDefault();
    if (!state.token) return openAccount();
    const form = event.currentTarget,
      button = form.querySelector('button');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      const result = await callServer(
        'sendCoins',
        document.querySelector('#coin-recipient').value,
        document.querySelector('#coin-amount').value,
        crypto.randomUUID(),
      );
      state.member.balance_coins = result.balance_coins;
      updateAccount();
      form.reset();
      showToast('Coins sent to ' + result.recipient + '.');
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  };

  let chatPeer = '';
  async function loadChat(peer) {
    const contacts = document.querySelector('#chat-contacts'),
      messages = document.querySelector('#chat-messages'),
      form = document.querySelector('#chat-form');
    if (!state.token) {
      contacts.textContent = 'Sign in to use chat.';
      messages.replaceChildren();
      form.hidden = true;
      return;
    }
    if (peer !== undefined) chatPeer = peer;
    busy(messages);
    try {
      const data = await callServer('chatSnapshot', chatPeer);
      contacts.replaceChildren();
      data.contacts.forEach((contact) => {
        const row = document.createElement('div');
        row.className = 'chat-contact';
        row.append(
          actionButton(contact.label, () => {
            chatPeer = contact.id;
            invalidateViews();
            return loadChat();
          }),
          actionButton('Profile', () => openProfile(contact.label)),
        );
        contacts.append(row);
      });
      messages.replaceChildren();
      if (!data.peer) {
        messages.textContent = 'Choose or open a conversation.';
        form.hidden = true;
        return;
      }
      chatPeer = data.peer.id;
      form.hidden = false;
      form.dataset.peerLabel = data.peer.label;
      data.messages.forEach((message) => {
        const row = document.createElement('p');
        row.className = 'chat-message ' + (message.sent_by_me ? 'mine' : 'theirs');
        row.textContent = message.body;
        messages.append(row);
      });
      if (!data.messages.length) messages.textContent = 'No messages yet.';
    } catch (error) {
      messages.textContent = error.message;
      form.hidden = true;
    }
  }
  document.querySelector('#chat-peer-form').onsubmit = async (event) => {
    event.preventDefault();
    invalidateViews();
    await loadChat(document.querySelector('#chat-peer').value);
  };
  document.querySelector('#chat-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      await callServer('sendChatMessage', chatPeer, document.querySelector('#chat-body').value);
      document.querySelector('#chat-body').value = '';
      invalidateViews();
      await loadChat();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  };
  document.querySelectorAll('.school-input input').forEach((input) =>
    input.addEventListener('input', () => {
      input.nextElementSibling.hidden = input.value.includes('@');
    }),
  );
  // Scroll inside the rounded surface, never along its outer edge.
  document.querySelectorAll('dialog.account-dialog').forEach((modal) => {
    const body = document.createElement('div');
    body.className = 'dialog-scroll';
    while (modal.firstChild) body.append(modal.firstChild);
    modal.append(body);
  });

  const chatUi = window.setupSmrChat({
    state,
    callServer,
    showToast,
    openAccount,
  });
  loadCachedCatalogue();
  busy(syncStatus);
  if (!state.snapshot) busy(tree);
  warmViews();
  setInterval(() => {
    if (state.token && document.visibilityState === 'visible') {
      warmingToken = '';
      warmViews();
    }
  }, 120000);
  loadCatalogue();
  showView(location.hash.slice(1));
  window.SMRApp = { callServer, isAdmin: () => !!state.member?.is_admin };
})();
