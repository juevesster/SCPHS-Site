<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SCPHS Bulletin Board</title>
  <link rel="stylesheet" href="assets/css/styles.css" />

  <style>
    .bb-container{ max-width:1160px; margin:0 auto; padding:16px }
    .bb-header{ display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin:10px 0 14px }
    .bb-title{ margin:0; font-weight:800; color:#0f2b4f }
    .bb-toolbar{ display:flex; gap:8px; align-items:center; flex-wrap:wrap }
    .bb-filters{ display:flex; gap:8px; flex-wrap:wrap }
    .bb-filter{ padding:6px 12px; border-radius:999px; border:1px solid var(--brand); background:#fff; cursor:pointer; font-size:14px }
    .bb-filter.active{ background:var(--brand); color:#fff }
    .bb-search{ width:260px }
    .bb-search input{ width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--line) }

    .bb-postform, .bb-manage { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,.04); margin-bottom:16px }
    .bb-postform textarea{ width:100%; min-height:90px; padding:10px; border:1px solid var(--line); border-radius:8px }
    .bb-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap }
    .bb-meta{ color:#6b7280; font-size:13px }

    .bb-feed{ display:grid; gap:16px; margin-top:12px }
    .bb-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,.04) }
    .bb-card h4{ margin:0 0 6px }
    .bb-card img{ max-width:100%; border-radius:10px; margin-top:8px }
    .bb-tag{ display:inline-block; background:var(--brand); color:#fff; border-radius:6px; padding:3px 8px; font-size:12px; margin-right:8px }

    .bb-admin-note{ font-size:12px; color:#6b7280 }
    .bb-actions{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap }
    .bb-actions .btn.small{ padding:6px 10px; border-radius:8px; font-size:13px }

    .btn{ padding:8px 12px; border:1px solid var(--line,#d1d5db); border-radius:8px; background:#fff; cursor:pointer }
    .btn.alt{ background:#f3f4f6 }
    .btn.outline{ background:#fff; border-color:var(--brand,#2563eb); color:var(--brand,#2563eb) }
    .btn.small{ padding:6px 10px; font-size:13px }

    .bb-dialog{ position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.4); z-index:9999; padding:16px }
    .bb-dialog__panel{ background:#fff; border-radius:12px; padding:16px; max-width:560px; width:100%; border:1px solid var(--line) }
    .bb-dialog__actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:12px }

    .bb-signin-prompt{
      background:#eff6ff; border:1px solid #bfdbfe; color:#1e40af;
      padding:14px 18px; border-radius:12px; margin-bottom:16px;
      display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;
    }
    .bb-signin-prompt strong{ color:#0f4c81; }
  </style>
</head>
<body>

  <main class="bb-container">
    <div class="bb-header">
      <h1 class="bb-title">SCPHS Bulletin Board</h1>
      <div class="bb-toolbar">
        <div class="bb-filters" id="bb-filters">
          <button class="bb-filter active" data-filter="All">All</button>
          <button class="bb-filter" data-filter="Announcements">Announcements</button>
          <button class="bb-filter" data-filter="Events">Events</button>
          <button class="bb-filter" data-filter="Activities">Activities</button>
          <button class="bb-filter" data-filter="Accomplishments">Accomplishments</button>
          <button class="bb-filter" data-filter="Sports">Sports Champions</button>
        </div>
        <div class="bb-search">
          <input id="bb-search" type="search" placeholder="Search posts…" />
        </div>
        <a class="btn outline" href="index.html" title="Return to Home">Home</a>
      </div>
    </div>

    <!-- Sign-in prompt (shown when signed OUT) -->
    <div id="bb-signin-prompt" class="bb-signin-prompt" hidden>
      <div>
        <strong>Want to post a bulletin?</strong>
        <div class="bb-meta">Sign in with your school account to add, edit, or delete posts.</div>
      </div>
      <a class="btn" href="login.html?next=%2Fbulletin.html">Sign in</a>
    </div>

    <!-- Post form (signed-in users only) -->
    <section id="bb-postform" class="bb-postform" hidden>
      <div class="bb-row" style="justify-content:space-between; width:100%;">
        <h3 style="margin:0">Create a Post</h3>
        <div class="bb-row" style="margin-left:auto; gap:8px;">
          <span class="bb-meta" id="bb-current-user"></span>
          <button id="bb-logout-btn" class="btn alt" type="button" title="Log out">Logout</button>
          <button id="bb-delete-all-btn" class="btn outline" type="button" title="Delete all posts">Delete All</button>
        </div>
      </div>

      <div class="bb-row" style="margin:8px 0;">
        <select id="bb-category" class="bb-input">
          <option>Announcements</option>
          <option>Events</option>
          <option>Activities</option>
          <option>Accomplishments</option>
          <option>Sports</option>
        </select>
        <label class="btn outline" for="bb-image-input">Attach Image</label>
        <input id="bb-image-input" type="file" accept="image/*" style="display:none" />
        <span class="bb-meta">Recommended image ≥ 1600×600 for hero-like banners.</span>
      </div>

      <textarea id="bb-text" placeholder="Write your content…"></textarea>
      <img id="bb-preview" alt="" style="display:none; width:220px; margin-top:10px; border-radius:10px;" />

      <div class="bb-actions">
        <button id="bb-post-btn" class="btn">Post</button>
        <button id="bb-clear-btn" type="button" class="btn alt">Clear</button>
      </div>
    </section>

    <!-- Manage posts (signed-in users only) -->
    <section id="bb-manage" class="bb-manage" hidden>
      <h3 style="margin-top:0">Manage Posts</h3>
      <p class="bb-meta">Edit or delete posts below.</p>
      <div id="bb-manage-list" class="bb-feed"></div>
    </section>

    <!-- Feed -->
    <section>
      <div id="bb-feed" class="bb-feed"></div>
    </section>
  </main>

  <!-- Edit dialog -->
  <div id="bb-edit-dialog" class="bb-dialog" role="dialog" aria-modal="true" aria-labelledby="bb-edit-title">
    <div class="bb-dialog__panel">
      <h3 id="bb-edit-title" style="margin-top:0">Edit Post</h3>
      <div class="bb-row" style="margin:8px 0;">
        <select id="bb-edit-category" class="bb-input" style="flex:1">
          <option>Announcements</option>
          <option>Events</option>
          <option>Activities</option>
          <option>Accomplishments</option>
          <option>Sports</option>
        </select>
      </div>
      <textarea id="bb-edit-text" class="bb-input" style="min-height:110px"></textarea>
      <div class="bb-dialog__actions">
        <button id="bb-edit-cancel" class="btn alt" type="button">Cancel</button>
        <button id="bb-edit-save" class="btn" type="button">Save</button>
      </div>
    </div>
  </div>

  <!-- ===================== LOGIC ===================== -->
  <script type="module">
    import { initMemoGuard, memoSignOut } from "./assets/js/memo-guard.js";
    import "./assets/js/bulletin.js"; // registers window.Bulletin

    const $  = id => document.getElementById(id);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

    const PROMPT   = $('bb-signin-prompt');
    const POSTFORM = $('bb-postform');
    const MANAGE   = $('bb-manage');
    const WHO      = $('bb-current-user');
    const LOGOUT   = $('bb-logout-btn');
    const DELETE_ALL = $('bb-delete-all-btn');

    const FEED       = $('bb-feed');
    const MANAGE_LIST = $('bb-manage-list');
    const SEARCH     = $('bb-search');
    const FILTERS    = $('bb-filters');

    const CAT   = $('bb-category');
    const TEXT  = $('bb-text');
    const IMG_IN = $('bb-image-input');
    const PREV  = $('bb-preview');
    const POST_BTN = $('bb-post-btn');
    const CLEAR_BTN = $('bb-clear-btn');

    const DLG = $('bb-edit-dialog');
    const DLG_TEXT = $('bb-edit-text');
    const DLG_CAT  = $('bb-edit-category');
    const DLG_CANCEL = $('bb-edit-cancel');
    const DLG_SAVE = $('bb-edit-save');

    let CURRENT_USER = null;
    let POSTS = [];
    let editingId = null;

    // ---------- Auth gating ----------
    function showSignedOut() {
      CURRENT_USER = null;
      PROMPT.hidden = false;
      POSTFORM.hidden = true;
      MANAGE.hidden = true;
    }
    async function showSignedIn(user) {
      CURRENT_USER = user;
      PROMPT.hidden = true;
      POSTFORM.hidden = false;
      MANAGE.hidden = false;
      if (WHO) WHO.textContent = user.displayName || user.email || 'user';
      await renderManage();
    }

    initMemoGuard({
      onLoading: () => { PROMPT.hidden = true; POSTFORM.hidden = true; MANAGE.hidden = true; },
      onDenied:  () => { showSignedOut(); },
      onAdmin:   (user) => { showSignedIn(user); },
    });

    // ---------- Feed rendering (public) ----------
    function currentFilter() {
      const active = FILTERS ? FILTERS.querySelector('.bb-filter.active') : null;
      return active ? active.dataset.filter : 'All';
    }
    function renderFeed() {
      if (!FEED) return;
      const term = (SEARCH?.value || '').toLowerCase();
      const cat = currentFilter();

      const filtered = POSTS.filter(p => {
        const okCat = (cat === 'All') ? true : (p.category === cat);
        const plain = (p.text || '').replace(/<[^>]*>/g, '');
        const okTerm = term ? plain.toLowerCase().includes(term) : true;
        return okCat && okTerm;
      });

      if (!filtered.length) {
        FEED.innerHTML = '<div class="bb-meta" style="padding:20px; text-align:center;">No posts yet.</div>';
        return;
      }

      FEED.innerHTML = filtered.map(p => {
        const plain = (p.text || '').replace(/<[^>]*>/g, '');
        return `
          <article class="bb-card">
            <div class="bb-meta">
              <span class="bb-tag">${window.Bulletin.escapeHTML(p.category)}</span>
              <span>${window.Bulletin.formatDate(p.dateISO)}</span> • 
              <span>by ${window.Bulletin.escapeHTML(p.author || '')}</span>
            </div>
            <h4>${window.Bulletin.escapeHTML(window.Bulletin.truncate(plain, 160))}</h4>
            ${p.image ? `<img src="${p.image}" alt="">` : ''}
            <div class="bb-actions">
              <button class="btn small" data-like="${p.id}" type="button">👍 Like <span>(${p.likes || 0})</span></button>
              ${CURRENT_USER ? `
                <button class="btn small outline" data-edit="${p.id}" type="button">Edit</button>
                <button class="btn small alt" data-del="${p.id}" type="button">Delete</button>
              ` : ``}
            </div>
          </article>`;
      }).join('');
    }

    async function renderManage() {
      if (!MANAGE_LIST) return;
      if (!CURRENT_USER) {
        MANAGE_LIST.innerHTML = '';
        return;
      }
      MANAGE_LIST.innerHTML = POSTS.map(p => {
        const plain = (p.text || '').replace(/<[^>]*>/g, '');
        return `
          <div class="bb-card">
            <div class="bb-meta">
              <span class="bb-tag">${window.Bulletin.escapeHTML(p.category)}</span>
              <span>${window.Bulletin.formatDate(p.dateISO)}</span> • 
              <span>by ${window.Bulletin.escapeHTML(p.author || '')}</span>
            </div>
            <p style="margin:.5rem 0">${window.Bulletin.escapeHTML(window.Bulletin.truncate(plain, 220))}</p>
            <div class="bb-actions">
              <button class="btn small outline" data-edit="${p.id}" type="button">Edit</button>
              <button class="btn small alt" data-del="${p.id}" type="button">Delete</button>
            </div>
          </div>`;
      }).join('');
    }

    async function refreshAll() {
      POSTS = await window.Bulletin.list();
      renderFeed();
      await renderManage();
    }

    // ---------- Post creation ----------
    POST_BTN?.addEventListener('click', async () => {
      if (!CURRENT_USER) return;
      const text = (TEXT?.value || '').trim();
      const cat  = CAT?.value || 'Announcements';
      const img  = (PREV && PREV.src && PREV.style.display !== 'none') ? PREV.src : null;
      if (!text) { alert('Write something first.'); return; }

      POST_BTN.disabled = true;
      try {
        await window.Bulletin.add({ text, category: cat, image: img });
        if (TEXT) TEXT.value = '';
        if (PREV) { PREV.src = ''; PREV.style.display = 'none'; }
        if (IMG_IN) IMG_IN.value = '';
        await refreshAll();
      } catch (e) {
        alert('Error: ' + (e.message || e));
      } finally {
        POST_BTN.disabled = false;
      }
    });

    CLEAR_BTN?.addEventListener('click', () => {
      if (TEXT) TEXT.value = '';
      if (PREV) { PREV.src = ''; PREV.style.display = 'none'; }
      if (IMG_IN) IMG_IN.value = '';
    });

    IMG_IN?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
      try {
        const dataUrl = await window.Bulletin.fileToDataURL(file);
        if (PREV) { PREV.src = dataUrl; PREV.style.display = 'block'; }
      } catch { alert('Failed to load image preview.'); }
    });

    // ---------- Filters / search ----------
    FILTERS?.addEventListener('click', e => {
      const btn = e.target.closest?.('.bb-filter');
      if (!btn) return;
      FILTERS.querySelectorAll('.bb-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFeed();
    });
    SEARCH?.addEventListener('input', renderFeed);

    // ---------- Feed & manage actions ----------
    async function handleAction(e) {
      const likeBtn = e.target.closest?.('[data-like]');
      if (likeBtn) {
        try { await window.Bulletin.like(likeBtn.dataset.like); await refreshAll(); }
        catch (err) { alert('Error: ' + (err.message || err)); }
        return;
      }
      const editBtn = e.target.closest?.('[data-edit]');
      if (editBtn) { openEditDialog(editBtn.dataset.edit); return; }
      const delBtn = e.target.closest?.('[data-del]');
      if (delBtn && confirm('Delete this post?')) {
        try { await window.Bulletin.remove(delBtn.dataset.del); await refreshAll(); }
        catch (err) { alert('Error: ' + (err.message || err)); }
      }
    }
    FEED?.addEventListener('click', handleAction);
    MANAGE_LIST?.addEventListener('click', handleAction);

    // ---------- Edit dialog ----------
    function openEditDialog(id) {
      const p = POSTS.find(x => x.id === id);
      if (!p || !DLG) return;
      editingId = id;
      DLG_TEXT.value = (p.text || '').replace(/<[^>]*>/g, '');
      DLG_CAT.value = p.category;
      DLG.style.display = 'flex';
    }
    function closeDialog() {
      editingId = null;
      if (DLG) DLG.style.display = 'none';
    }
    DLG_CANCEL?.addEventListener('click', closeDialog);
    DLG?.addEventListener('click', e => { if (e.target === DLG) closeDialog(); });
    DLG_SAVE?.addEventListener('click', async () => {
      if (editingId == null) return closeDialog();
      try {
        await window.Bulletin.updatePost(editingId, {
          text: DLG_TEXT.value,
          category: DLG_CAT.value,
        });
        closeDialog();
        await refreshAll();
      } catch (e) {
        alert('Error: ' + (e.message || e));
      }
    });

    // ---------- Delete all ----------
    DELETE_ALL?.addEventListener('click', async () => {
      if (!CURRENT_USER) return;
      if (!POSTS.length) { alert('No posts to delete.'); return; }
      if (!confirm('Delete ALL posts? This cannot be undone.')) return;
      DELETE_ALL.disabled = true;
      try {
        await window.Bulletin.removeAll();
        await refreshAll();
      } catch (e) {
        alert('Error: ' + (e.message || e));
      } finally {
        DELETE_ALL.disabled = false;
      }
    });

    // ---------- Logout ----------
    LOGOUT?.addEventListener('click', async () => {
      await memoSignOut();
      location.replace('bulletin.html');
    });

    // ---------- Boot ----------
    (async () => {
      try {
        await refreshAll();
      } catch (e) {
        console.error('[bulletin] initial load failed:', e);
        if (FEED) FEED.innerHTML = '<div class="bb-meta" style="color:#b91c1c;">Failed to load posts.</div>';
      }
    })();
  </script>
</body>
</html>