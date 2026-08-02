
  let isOffline = false;
  let notes = [
    { id: 1, title: 'Portfolio launch checklist', body: 'Double-check contact links, test on mobile, ask a friend to review.', synced: true },
    { id: 2, title: 'Recess project chat notes', body: 'Broadcasting setup: ReplyPosted event on public + private channels.', synced: true }
  ];
  let nextId = 3;

  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const statusSwitch = document.getElementById('statusSwitch');

  statusSwitch.addEventListener('click', () => {
    isOffline = !isOffline;
    statusDot.classList.toggle('offline', isOffline);
    statusSwitch.classList.toggle('is-offline', isOffline);
    statusLabel.textContent = isOffline ? 'Offline' : 'Online';

    if (!isOffline) {
      const pending = notes.filter(n => !n.synced);
      if (pending.length) {
        setTimeout(() => {
          pending.forEach(n => n.synced = true);
          render();
        }, 600);
      }
    }
  });

  const saveBtn = document.getElementById('saveBtn');
  const errorEl = document.getElementById('formError');

  saveBtn.addEventListener('click', () => {
    const titleInput = document.getElementById('noteTitle');
    const bodyInput = document.getElementById('noteBody');
    const title = titleInput.value.trim() || 'Untitled note';
    const body = bodyInput.value.trim();

    if (!body) {
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';

    notes.unshift({ id: nextId++, title, body, synced: !isOffline });
    titleInput.value = '';
    bodyInput.value = '';
    render();
  });

  function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    render();
  }

  function render() {
    const listEl = document.getElementById('notesList');
    if (!notes.length) {
      listEl.innerHTML = '<p class="empty-state">No notes yet — write one on the left.</p>';
      return;
    }
    listEl.innerHTML = notes.map(n => `
      <div class="note-card">
        <div class="note-top">
          <span class="note-title">${n.title}</span>
          <button class="note-del" onclick="deleteNote(${n.id})" aria-label="Delete">×</button>
        </div>
        <div class="note-body">${n.body}</div>
        <div class="note-meta">
          <span class="pill ${n.synced ? 'pill-synced' : 'pill-pending'}">${n.synced ? 'synced' : 'pending sync'}</span>
        </div>
      </div>
    `).join('');
  }

  render();