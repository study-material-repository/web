let emojiCatalogue;
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
    editing = null,
    preloading = false;
  const unreadMarkers = new Map();
  const replyBanner = document.createElement('div');
  replyBanner.className = 'chat-reply-preview';
  replyBanner.hidden = true;
  compose.before(replyBanner);
  function reply(message) {
    editing = null;
    replyTo = message;
    replyBanner.replaceChildren();
    replyBanner.hidden = !message;
    if (message) {
      replyBanner.append(
        document.createTextNode('Reply to ' + message.sender + ': ' + message.body.slice(0, 120)),
      );
      replyBanner.append(iconButton('close', 'Cancel', () => reply(null)));
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
  function spaceIcon(label) {
    const avatar = document.createElement('span');
    avatar.className = 'pixel-avatar space-avatar';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent =
      { Announcements: 'campaign', 'SMR Central': 'forum', Tasks: 'assignment' }[label] || 'groups';
    avatar.append(icon);
    return avatar;
  }
  function button(label, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-list-item';
    b.textContent = label;
    b.onclick = handler;
    return b;
  }
  function iconButton(icon, label, handler) {
    const b = button('', handler);
    b.className = 'icon-button chat-action';
    b.title = label;
    b.setAttribute('aria-label', label);
    const i = document.createElement('span');
    i.className = 'material-symbols-outlined';
    i.setAttribute('aria-hidden', 'true');
    i.textContent = icon;
    b.append(i);
    return b;
  }
  function editMessage(message) {
    reply(null);
    editing = message;
    replyBanner.hidden = false;
    replyBanner.textContent = 'Edit message';
    replyBanner.append(
      iconButton('close', 'Cancel edit', () => {
        reply(null);
        $('message-body').value = '';
      }),
    );
    $('message-body').value = message.body;
    $('message-body').focus();
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
      unreadMarkers.clear();
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
        if (kind === 'space') b.prepend(spaceIcon(item.label));
        if (kind === 'dm' && window.smrAvatar) b.prepend(smrAvatar(item.avatar_seed || item.label));
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
    if (data.thread.kind === 'space') header.prepend(spaceIcon(data.thread.label));
    header.append(title);
    if (data.thread.kind === 'dm' && window.smrAvatar)
      header.prepend(smrAvatar(data.thread.avatar_seed || data.thread.label));
    if (data.thread.id === 'smr-tasks') {
      const a = document.createElement('a');
      a.href = '#contribute';
      a.textContent = 'Open task board';
      header.append(a);
    }
    const back = iconButton('arrow_back', 'Conversations', () => select(null));
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
    const key = draftKey(selected);
    if (!unreadMarkers.has(key)) unreadMarkers.set(key, data.unread_from);
    const serialized = JSON.stringify(data.messages);
    if (serialized !== lastRender) {
      const atEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
      feed.replaceChildren();
      let previousDay = '';
      data.messages.forEach((message) => {
        const day = new Date(message.created_at).toLocaleDateString('en-GB');
        if (day !== previousDay) {
          const separator = document.createElement('div');
          separator.className = 'chat-date';
          separator.textContent = day;
          feed.append(separator);
          previousDay = day;
        }
        if (message.id === unreadMarkers.get(key)) {
          const unread = document.createElement('div');
          unread.className = 'chat-unread';
          unread.textContent = 'Unread messages';
          feed.append(unread);
        }
        const row = document.createElement('article');
        row.tabIndex = 0;
        row.className = 'chat-bubble ' + (message.mine ? 'mine' : '');
        row.tabIndex = 0;
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
            } else {
              for (const token of part.split(
                /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g,
              )) {
                const marker = token.match(/^(\*\*|__|~~|`|\*|_)/)?.[0];
                if (marker && token.length > 2 * marker.length && token.endsWith(marker)) {
                  const el = document.createElement(
                    { '**': 'strong', __: 'strong', '~~': 's', '`': 'code', '*': 'em', _: 'em' }[
                      marker
                    ],
                  );
                  el.textContent = token.slice(marker.length, -marker.length);
                  body.append(el);
                } else body.append(document.createTextNode(token));
              }
            }
          });
        const meta = document.createElement('small');
        meta.textContent = new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (message.edited) meta.prepend(document.createTextNode('Edited · '));
        if (message.mine) {
          const receipt = document.createElement('span');
          receipt.className =
            'material-symbols-outlined chat-receipt' + (message.read_count ? ' read' : '');
          receipt.textContent = message.read_count || message.delivered_count ? 'done_all' : 'done';
          receipt.title = message.read_count
            ? 'Read by ' + message.read_count
            : message.delivered_count
              ? 'Delivered'
              : 'Sent';
          receipt.setAttribute('aria-label', receipt.title);
          meta.append(receipt);
        }
        if (data.thread.kind === 'space' && !message.mine) row.append(sender);
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
          actions.append(iconButton('reply', 'Reply', () => reply(message)));
          const choose = (emoji) => {
            const mine = message.reactions?.some((r) => r.emoji === emoji && r.mine);
            changeMessage(message, 'react', { emoji, active: !mine });
          };
          for (const emoji of ['😂', '👍', '🙏']) {
            const quick = button(emoji, () => choose(emoji));
            quick.className = 'quick-react';
            quick.setAttribute('aria-label', 'React ' + emoji);
            actions.append(quick);
          }
          actions.append(
            iconButton('add_reaction', 'More reactions', async () => {
              document.querySelector('.emoji-dialog')?.close();
              const dialog = document.createElement('dialog');
              dialog.className = 'emoji-dialog account-dialog';
              dialog.setAttribute('aria-label', 'Choose a reaction');
              dialog.innerHTML =
                '<div class="dialog-header"><h2>Reactions</h2><button class="icon-button" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div><input type="search" aria-label="Search emoji" placeholder="Search emoji"><div class="emoji-results"></div><p role="status">Loading emoji…</p>';
              document.body.append(dialog);
              dialog.onclose = () => dialog.remove();
              dialog.querySelector('button').onclick = () => dialog.close();
              dialog.onclick = (e) => {
                const r = dialog.getBoundingClientRect();
                if (
                  e.target === dialog &&
                  (e.clientX < r.left ||
                    e.clientX > r.right ||
                    e.clientY < r.top ||
                    e.clientY > r.bottom)
                )
                  dialog.close();
              };
              dialog.showModal();
              const input = dialog.querySelector('input'),
                results = dialog.querySelector('.emoji-results'),
                status = dialog.querySelector('[role=status]');
              input.focus();
              try {
                const all = await (emojiCatalogue ??= fetch('./reaction-catalogue.json').then(
                  (r) => {
                    if (!r.ok) throw Error();
                    return r.json();
                  },
                ));
                const draw = () => {
                  results.replaceChildren();
                  const hits = all.filter(
                    ([emoji, label]) =>
                      label.includes(input.value.trim().toLowerCase()) ||
                      emoji === input.value.trim(),
                  );
                  for (const [emoji, label] of hits.slice(0, 120)) {
                    const b = button(emoji, () => {
                      dialog.close();
                      choose(emoji);
                    });
                    b.className = 'emoji-choice';
                    b.title = label;
                    b.setAttribute('aria-label', label);
                    results.append(b);
                  }
                  status.textContent =
                    hits.length > 120
                      ? 'Search to find more emoji.'
                      : hits.length
                        ? ''
                        : 'No matching emoji.';
                };
                input.oninput = draw;
                draw();
              } catch {
                emojiCatalogue = null;
                status.textContent = 'Could not load emoji. Close and try again.';
              }
            }),
          );
          if (message.can_edit)
            actions.append(iconButton('edit', 'Edit', () => editMessage(message)));
          if (message.can_delete)
            actions.append(
              iconButton('delete', 'Delete', () => {
                const d = document.createElement('dialog');
                d.className = 'account-dialog delete-dialog';
                d.setAttribute('aria-labelledby', 'delete-title');
                d.innerHTML =
                  '<h2 id="delete-title">Delete message?</h2><p>This removes the message for everyone in this conversation.</p><div class="portrait-actions"><button class="text-button">Cancel</button><button class="tonal-button">Delete</button></div>';
                document.body.append(d);
                d.onclose = () => d.remove();
                d.querySelector('button').onclick = () => d.close();
                d.querySelector('.tonal-button').onclick = () => {
                  d.close();
                  changeMessage(message, 'delete');
                };
                d.showModal();
              }),
            );
        }
        row.append(actions);
        if (message.reactions?.length) {
          const reactions = document.createElement('div');
          reactions.className = 'chat-reactions';
          for (const reaction of message.reactions) {
            const b = button(reaction.emoji + ' ' + reaction.count, () =>
              changeMessage(message, 'react', { emoji: reaction.emoji, active: !reaction.mine }),
            );
            b.className = 'reaction-choice';
            b.setAttribute('aria-pressed', String(reaction.mine));
            reactions.append(b);
          }
          row.append(reactions);
        }
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
      if (editing) {
        await callServer('chatMessage', {
          [target.kind === 'space' ? 'space_id' : 'peer']: target.id,
          message_id: editing.id,
          operation: 'edit',
          body,
        });
      } else
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
