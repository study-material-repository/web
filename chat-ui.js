window.setupSmrChat = function ({ state, callServer, showToast, openAccount }) {
  const host = document.querySelector('#chat');
  host.innerHTML = `
    <div class="workspace-heading">
      <h1>Chat</h1>
      <div class="workspace-actions">
        <button class="tonal-button" id="new-dm">New message</button>
        <button class="tonal-button" id="new-space" hidden>Create space</button>
      </div>
    </div>
    <div class="chat-layout">
      <aside aria-label="Conversations">
        <h2>Direct messages</h2><div id="dm-list"></div>
        <h2>Spaces</h2><div id="space-list"></div>
        <p id="chat-error" role="status"></p>
      </aside>
      <section class="chat-thread" aria-label="Messages">
        <header id="thread-header"><h2>Choose a conversation</h2></header>
        <div id="chat-feed" role="log" aria-live="polite"></div>
        <form id="message-compose" hidden>
          <label for="message-body" class="sr-only">Message</label>
          <textarea id="message-body" rows="1" maxlength="4000"
            placeholder="Write a message" required></textarea>
          <button class="tonal-button" type="submit" aria-label="Send message">
            <span class="material-symbols-outlined" aria-hidden="true">send</span>
          </button>
        </form>
      </section>
    </div>`;
  const modal = document.createElement('dialog');
  modal.className = 'account-dialog chat-setup';
  modal.innerHTML =
    '<div class="dialog-scroll"><form id="chat-setup-form" class="task-form"><div class="dialog-header"><h2 id="chat-setup-title">New message</h2><button type="button" class="icon-button" aria-label="Close">×</button></div><label id="space-name-label">Space name<input id="space-name" maxlength="80"></label><label id="chat-address-label">Username or email<input id="chat-address" autocomplete="off"></label><label id="space-community-label">Community<input id="space-community" value="SMR" maxlength="80"></label><label id="space-announcement-label"><input id="space-announcement" type="checkbox">Only admins can post</label><label id="space-public-label"><input id="space-public" type="checkbox">Include all members</label><label id="space-members-label">Members<textarea id="space-members" placeholder="Usernames or emails, separated by commas"></textarea></label><button type="submit" class="tonal-button">Continue</button><p id="chat-setup-error" role="status"></p></form></div>';
  document.body.append(modal);
  const $ = (id) => document.getElementById(id),
    feed = $('chat-feed'),
    compose = $('message-compose');
  let selected = null,
    mode = 'dm',
    generation = 0,
    inFlight = false,
    lastToken = '',
    lastRender = '',
    retryId = null,
    readsInFlight = 0;
  const drafts = new Map(),
    snapshots = new Map();
  let replyTo = null,
    preloading = false;
  const replyBanner = document.createElement('div');
  replyBanner.className = 'chat-reply-preview';
  replyBanner.hidden = true;
  compose.before(replyBanner);
  function reply(message) {
    replyTo = message;
    replyBanner.replaceChildren();
    replyBanner.hidden = !message;
    if (message) {
      replyBanner.append(
        document.createTextNode('Reply to ' + message.sender + ': ' + message.body.slice(0, 120)),
      );
      replyBanner.append(button('Cancel', () => reply(null)));
      $('message-body').focus();
    }
  }
  async function preload(data, token) {
    if (preloading) return;
    preloading = true;
    try {
      for (const [kind, items] of [
        ['space', data.spaces],
        ['dm', data.contacts],
      ])
        for (const item of items.slice(0, 20)) {
          if (token !== state.token) return;
          const key = kind + ':' + item.id;
          if (snapshots.has(key)) continue;
          try {
            const value = await callServer('chatHub', {
              [kind === 'space' ? 'space_id' : 'peer']: item.id,
              mark_read: false,
            });
            if (token === state.token) snapshots.set(key, value);
          } catch {}
        }
    } finally {
      preloading = false;
    }
  }
  const draftKey = (value) => (value ? value.kind + ':' + value.id : '');
  function button(label, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-list-item';
    b.textContent = label;
    b.onclick = handler;
    return b;
  }
  function setup(next) {
    if (!state.token) return openAccount();
    mode = next;
    $('chat-setup-form').reset();
    $('chat-setup-error').textContent = '';
    $('chat-setup-title').textContent =
      next === 'space' ? 'Create space' : next === 'invite' ? 'Add a member' : 'New message';
    $('space-name-label').hidden = next !== 'space';
    $('space-members-label').hidden = next !== 'space';
    ['space-community-label', 'space-announcement-label', 'space-public-label'].forEach(
      (id) => ($(id).hidden = next !== 'space'),
    );
    $('chat-address-label').hidden = next === 'space';
    modal.showModal();
  }
  modal.querySelector('.icon-button').onclick = () => modal.close();
  $('new-dm').onclick = () => setup('dm');
  $('new-space').onclick = () => setup('space');
  async function select(value) {
    if (selected) drafts.set(draftKey(selected), $('message-body').value);
    selected = value;
    reply(null);
    $('message-body').value = drafts.get(draftKey(value)) || '';
    retryId = null;
    compose.hidden = true;
    lastRender = '';
    generation++;
    feed.replaceChildren();
    host.classList.toggle('thread-open', Boolean(value));
    if (snapshots.has(draftKey(value))) render(snapshots.get(draftKey(value)));
    else if (value)
      feed.innerHTML = '<span class="spinner" role="status" aria-label="Loading messages"></span>';
    await load();
  }
  async function load() {
    $('new-space').hidden = !state.member?.is_admin;
    if (lastToken !== state.token) {
      selected = null;
      drafts.clear();
      snapshots.clear();
      reply(null);
      $('message-body').value = '';
      $('thread-header').innerHTML = '<h2>Choose a conversation</h2>';
      host.classList.remove('thread-open');
      feed.replaceChildren();
      lastRender = '';
      lastToken = state.token;
      generation++;
      $('dm-list').replaceChildren();
      $('space-list').replaceChildren();
      compose.hidden = true;
    }
    if (!state.token) {
      $('chat-error').textContent = 'Sign in to use chat.';
      return;
    }
    const epoch = ++generation,
      token = state.token,
      target = selected ? { [selected.kind === 'space' ? 'space_id' : 'peer']: selected.id } : {};
    readsInFlight++;
    if (!snapshots.size)
      $('chat-error').innerHTML =
        '<span class="spinner" role="status" aria-label="Loading chat"></span>';
    try {
      const data = await callServer('chatHub', {
        ...target,
        mark_read: document.visibilityState === 'visible' && !host.hidden,
      });
      if (epoch !== generation || token !== state.token) return;
      snapshots.set(draftKey(selected), data);
      render(data);
      void preload(data, token);
    } catch (error) {
      if (epoch === generation) $('chat-error').textContent = error.message;
    } finally {
      readsInFlight--;
    }
  }
  function render(data) {
    $('chat-error').textContent = '';
    [
      ['dm-list', data.contacts, 'dm'],
      ['space-list', data.spaces, 'space'],
    ].forEach(([id, items, kind]) => {
      const list = $(id);
      list.replaceChildren();
      let communityLabel = '';
      items.forEach((item) => {
        if (kind === 'space' && item.community && item.community !== communityLabel) {
          communityLabel = item.community;
          const heading = document.createElement('h3');
          heading.className = 'chat-community-label';
          heading.textContent = communityLabel;
          list.append(heading);
        }
        const b = button(item.label + (item.unread ? ' · ' + item.unread : ''), () =>
          select({ kind, id: item.id }),
        );
        if (selected?.id === item.id) b.setAttribute('aria-current', 'true');
        list.append(b);
      });
      if (!items.length) {
        const p = document.createElement('p');
        p.className = 'dialog-copy';
        p.textContent =
          kind === 'space' ? 'Your joined spaces will appear here.' : 'Start a conversation.';
        list.append(p);
      }
    });
    host.classList.toggle('thread-open', Boolean(data.thread));
    if (!data.thread) {
      compose.hidden = true;
      $('thread-header').innerHTML = '<h2>Choose a conversation</h2>';
      feed.innerHTML =
        '<div class="chat-empty"><span class="material-symbols-outlined" aria-hidden="true">forum</span><p>Messages and spaces, together.</p><p class="dialog-copy">Choose a conversation or start a new message.</p></div>';
      return;
    }
    selected = { kind: data.thread.kind, id: data.thread.id };
    compose.hidden = data.thread.can_send === false;
    const header = $('thread-header');
    header.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = data.thread.label;
    header.append(title);
    if (data.thread.id === 'smr-help')
      header.append(button('Report a bug or suggest a feature', ticket));
    if (data.thread.id === 'smr-tasks') {
      const a = document.createElement('a');
      a.href = '#contribute';
      a.textContent = 'Open task board';
      header.append(a);
    }
    const back = button('‹ Conversations', () => select(null));
    back.classList.add('chat-back');
    header.prepend(back);
    if (data.thread.kind === 'space') {
      const controls = document.createElement('details');
      controls.className = 'chat-members';
      const toggle = document.createElement('summary');
      toggle.textContent = (data.thread.member_count ?? data.thread.members.length) + ' members';
      controls.append(toggle);
      const members = document.createElement('p');
      members.textContent = data.thread.members.length
        ? data.thread.members.join(', ')
        : 'Member list is private.';
      controls.append(members);
      header.append(controls);
      if (data.thread.can_manage) controls.append(button('Add member', () => setup('invite')));
      else if (data.thread.can_leave !== false)
        controls.append(
          button('Leave space', async () => {
            try {
              await callServer('chatSpace', {
                operation: 'leave',
                space_id: selected.id,
              });
              await select(null);
            } catch (error) {
              showToast(error.message);
            }
          }),
        );
      if (data.thread.label.toLowerCase() === 'smr central') {
        const tasks = document.createElement('a');
        tasks.className = 'chat-tasks-link';
        tasks.href = '#contribute';
        tasks.textContent = 'Tasks';
        tasks.onclick = () =>
          setTimeout(() => document.querySelector('#tasks').scrollIntoView({ block: 'start' }), 50);
        header.append(tasks);
      }
    }
    const serialized = JSON.stringify(data.messages);
    if (serialized !== lastRender) {
      const atEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
      feed.replaceChildren();
      let previousDay = '';
      data.messages.forEach((message) => {
        const day = new Date(message.created_at).toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        if (day !== previousDay) {
          const separator = document.createElement('div');
          separator.className = 'chat-date';
          separator.textContent = day;
          feed.append(separator);
          previousDay = day;
        }
        const row = document.createElement('article');
        row.className = 'chat-bubble ' + (message.mine ? 'mine' : '');
        const sender = document.createElement('strong');
        sender.textContent = message.mine ? 'You' : message.sender;
        const body = document.createElement('p');
        String(message.body)
          .split(/(https?:\/\/[^\s<>"']+)/g)
          .forEach((part) => {
            if (/^https?:\/\//.test(part)) {
              const link = document.createElement('a');
              link.href = part;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.textContent = part;
              body.append(link);
            } else body.append(document.createTextNode(part));
          });
        const meta = document.createElement('small');
        meta.textContent = new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (message.mine) {
          const receipt = document.createElement('span');
          receipt.textContent = message.read_count ? ' ✓✓' : ' ✓';
          receipt.title = message.read_count ? 'Read by ' + message.read_count : 'Sent';
          receipt.setAttribute('aria-label', receipt.title);
          meta.append(receipt);
        }
        if (window.smrAvatar) row.append(smrAvatar(message.avatar_seed || message.sender));
        row.append(sender);
        if (message.reply) {
          const quote = document.createElement('blockquote');
          quote.className = 'chat-reply-preview';
          quote.textContent = message.reply.sender + ': ' + message.reply.body;
          row.append(quote);
        }
        row.append(body, meta);
        const actions = document.createElement('div');
        actions.className = 'chat-message-actions';
        if (!message.deleted) {
          actions.append(button('Reply', () => reply(message)));
          ['👍', '❤️', '🎉', '👀'].forEach((emoji) => {
            const reaction = (message.reactions || []).find((r) => r.emoji === emoji);
            const b = button(emoji + (reaction ? ' ' + reaction.count : ''), () =>
              changeMessage(message, 'react', { emoji, active: !reaction?.mine }),
            );
            b.setAttribute('aria-label', 'React ' + emoji);
            b.setAttribute('aria-pressed', String(!!reaction?.mine));
            actions.append(b);
          });
          if (message.can_delete)
            actions.append(
              button('Delete', () => {
                if (confirm('Delete this message?')) changeMessage(message, 'delete');
              }),
            );
        }
        row.append(actions);
        feed.append(row);
      });
      if (!data.messages.length) {
        const p = document.createElement('p');
        p.textContent = 'No messages yet. Say hello.';
        feed.append(p);
      }
      if (atEnd || !lastRender) feed.scrollTop = feed.scrollHeight;
      lastRender = serialized;
    }
  }
  function ticket() {
    const d = document.createElement('dialog');
    d.className = 'account-dialog';
    d.innerHTML =
      '<div class="dialog-scroll"><form class="task-form"><div class="dialog-header"><h2>Help & ideas</h2><button type="button" aria-label="Close" class="icon-button">×</button></div><label>Type<select name="kind"><option>Bug report</option><option>Feature request</option></select></label><label>Title<input name="title" required maxlength="120"></label><label>Steps to reproduce or proposed behaviour<textarea name="steps" required maxlength="1200"></textarea></label><label>Expected result<textarea name="expected" required maxlength="800"></textarea></label><label>What happened instead / why this would help<textarea name="actual" required maxlength="800"></textarea></label><p class="dialog-copy">Shared with the community. Do not include passwords or verification codes.</p><button class="tonal-button">Post</button><p role="status"></p></form></div>';
    document.body.append(d);
    d.querySelector('[aria-label=Close]').onclick = () => d.close();
    d.onclose = () => d.remove();
    d.showModal();
    const f = d.querySelector('form');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = f.querySelector('button.tonal-button');
      b.disabled = true;
      try {
        await callServer('chatSend', {
          space_id: 'smr-help',
          message_id: crypto.randomUUID(),
          body: [
            f.elements.kind.value + ': ' + f.elements.title.value,
            'Steps / proposal: ' + f.elements.steps.value,
            'Expected: ' + f.elements.expected.value,
            'Actual / benefit: ' + f.elements.actual.value,
            'Browser: ' + navigator.userAgent,
          ].join('\n\n'),
        });
        d.close();
        await load();
      } catch (error) {
        d.querySelector('[role=status]').textContent = error.message;
      } finally {
        b.disabled = false;
      }
    };
  }
  async function changeMessage(message, operation, extra = {}) {
    try {
      await callServer('chatMessage', {
        [selected.kind === 'space' ? 'space_id' : 'peer']: selected.id,
        message_id: message.id,
        operation,
        ...extra,
      });
      await load();
    } catch (error) {
      showToast(error.message);
    }
  }
  $('chat-setup-form').onsubmit = async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
      if (mode === 'dm') {
        selected = { kind: 'dm', id: $('chat-address').value.trim() };
      } else if (mode === 'space') {
        const result = await callServer('chatSpace', {
          operation: 'create',
          community: $('space-community').value,
          announcement: $('space-announcement').checked,
          public: $('space-public').checked,
          name: $('space-name').value,
          members: $('space-members').value,
        });
        selected = { kind: 'space', id: result.id };
      } else
        await callServer('chatSpace', {
          operation: 'invite',
          space_id: selected.id,
          address: $('chat-address').value,
        });
      modal.close();
      lastRender = '';
      await load();
    } catch (error) {
      $('chat-setup-error').textContent = error.message;
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  };
  compose.onsubmit = async (event) => {
    event.preventDefault();
    if (inFlight || !selected) return;
    inFlight = true;
    const submit = compose.querySelector('button'),
      body = $('message-body').value;
    submit.disabled = true;
    submit.classList.add('is-loading');
    const target = { ...selected };
    retryId = retryId || crypto.randomUUID();
    try {
      await callServer('chatSend', {
        [target.kind === 'space' ? 'space_id' : 'peer']: target.id,
        body,
        message_id: retryId,
        reply_to: replyTo?.id || null,
      });
      retryId = null;
      reply(null);
      drafts.delete(draftKey(target));
      if ($('message-body').value === body) $('message-body').value = '';
      await load();
    } catch (error) {
      showToast(error.message);
    } finally {
      inFlight = false;
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  };
  $('message-body').addEventListener('input', () => {
    if (!inFlight) retryId = null;
  });
  $('message-body').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      compose.requestSubmit();
    }
  });
  setInterval(() => {
    if (!host.hidden && document.visibilityState === 'visible' && !inFlight && !readsInFlight)
      load();
  }, 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !host.hidden) load();
  });
  document.addEventListener('smr-identity', () => {
    if (lastToken !== state.token) void load();
  });
  return { load };
};
