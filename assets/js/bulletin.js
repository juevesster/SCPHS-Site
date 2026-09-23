(function () {
  console.log('BB: script ready');

  // ==== Storage keys & constants ====
  const STORAGE_KEY = 'bb_posts_v1';
  const LOGIN_KEY   = 'bb_logged_in';
  const ACCOUNTS    = { admin: '12345', teacher: '12345' };

  // ==== Helpers ====
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  function loadPosts(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
  function savePosts(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function escapeHTML(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function decodeHTML(s){ const d=document.createElement('textarea'); d.innerHTML=s; return d.value; }
  function truncate(s, n){ return s.length>n ? s.slice(0,n-1)+'…' : s; }
  function formatDate(iso){ try{ return new Date(iso).toLocaleString(); }catch{ return ''; } }
  function fileToDataURL(file){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=reject;
      r.readAsDataURL(file);
    });
  }

  // ==== State ====
  let posts = loadPosts();
  let user  = localStorage.getItem(LOGIN_KEY) || null;

  // Option A: clear stored user if it's not a valid account
  if (user && !['admin', 'teacher'].includes(user)) {
    localStorage.removeItem(LOGIN_KEY);
    user = null;
  }

  // ==== DOM ====
  const elLogin      = $('#bb-login');
  const elPostForm   = $('#bb-postform');
  const elManage     = $('#bb-manage');
  const elFeed       = $('#bb-feed');
  const elManageList = $('#bb-manage-list');

  const elUser     = $('#bb-current-user');
  const elUname    = $('#bb-username');
  const elPass     = $('#bb-password');
  const elLoginBtn = $('#bb-login-btn');
  const elLoginMsg = $('#bb-login-status');

  const elCat      = $('#bb-category');
  const elText     = $('#bb-text');
  const elImgIn    = $('#bb-image-input');
  const elPrev     = $('#bb-preview');
  const elPostBtn  = $('#bb-post-btn');
  const elClearBtn = $('#bb-clear-btn');

  const elSearch   = $('#bb-search');
  const elFilters  = $('#bb-filters');

  const elLogout   = $('#bb-logout-btn');
  const elDeleteAll= $('#bb-delete-all-btn');

  const dlg        = $('#bb-edit-dialog');
  const dlgText    = $('#bb-edit-text');
  const dlgCat     = $('#bb-edit-category');
  const dlgCancel  = $('#bb-edit-cancel');
  const dlgSave    = $('#bb-edit-save');
  let editingId    = null;

  // ==== Init ====
  reflectLoginUI();
  applyQueryParams();
  renderFeed();
  renderManageListIfNeeded();

  // ==== Events ====
  // Login (case-insensitive username)
  elLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const uRaw = (elUname?.value || '').trim();
    const p    = (elPass?.value  || '').trim();
    if (!uRaw || !p) { setLoginMsg('Please enter username and password.'); return; }
    const u = uRaw.toLowerCase();
    if (ACCOUNTS[u] && ACCOUNTS[u] === p) {
      user = u;
      localStorage.setItem(LOGIN_KEY, u);
      setLoginMsg('');
      reflectLoginUI();
      console.log('BB: logged in as', u);
      elPostForm?.scrollIntoView({behavior:'smooth'});
    } else {
      setLoginMsg('Incorrect username or password. Try: admin / 12345 or teacher / 12345');
    }
  });

  // Enter submits login
  elPass?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') elLoginBtn?.click(); });

  // Logout
  elLogout?.addEventListener('click', () => {
    localStorage.removeItem(LOGIN_KEY);
    user = null;
    reflectLoginUI();
    renderManageListIfNeeded();
    renderFeed();
    elLogin?.scrollIntoView({behavior:'smooth'});
  });

  // Delete all posts
  elDeleteAll?.addEventListener('click', () => {
    if (!user) { alert('Please login first.'); return; }
    if (!posts.length) { alert('No posts to delete.'); return; }
    if (confirm('Delete ALL posts? This cannot be undone.')) {
      posts = [];
      savePosts(posts);
      renderManageListIfNeeded();
      renderFeed();
    }
  });

  // Image preview
  elImgIn?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
    try {
      const dataUrl = await fileToDataURL(file);
      if (elPrev) { elPrev.src = dataUrl; elPrev.style.display = 'block'; }
    } catch { alert('Failed to load image preview.'); }
  });

  // Create post
  elPostBtn?.addEventListener('click', () => {
    if (!user) { alert('Please login first.'); return; }
    const text = (elText?.value || '').trim();
    const cat  = elCat?.value || 'Announcements';
    const img  = (elPrev && elPrev.src && elPrev.style.display !== 'none') ? elPrev.src : null;
    if (!text) { alert('Write something first.'); return; }

    const post = {
      id: Date.now(),
      text: escapeHTML(text),
      category: cat,
      image: img,         // dataURL string
      author: user,
      likes: 0,
      dateISO: new Date().toISOString()
    };
    posts.unshift(post);
    savePosts(posts);

    // reset
    if (elText) elText.value = '';
    if (elPrev) { elPrev.src = ''; elPrev.style.display = 'none'; }
    if (elImgIn) elImgIn.value = '';

    renderFeed();
    renderManageListIfNeeded();
  });

  // Clear form
  elClearBtn?.addEventListener('click', () => {
    if (elText) elText.value = '';
    if (elPrev) { elPrev.src=''; elPrev.style.display='none'; }
    if (elImgIn) elImgIn.value = '';
  });

  // Filters
  elFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.bb-filter');
    if (!btn) return;
    $$('.bb-filter', elFilters).forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderFeed();
  });

  // Search
  elSearch?.addEventListener('input', () => renderFeed());

  // Feed actions (like/edit/delete)
  elFeed?.addEventListener('click', (e) => {
    const likeBtn = e.target.closest?.('[data-like]');
    if (likeBtn) { likePost(Number(likeBtn.dataset.like)); return; }
    const editBtn = e.target.closest?.('[data-edit]');
    if (editBtn) { openEditDialog(Number(editBtn.dataset.edit)); return; }
    const delBtn = e.target.closest?.('[data-del]');
    if (delBtn && confirm('Delete this post?')) {
      const id = Number(delBtn.dataset.del);
      posts = posts.filter(p => p.id !== id);
      savePosts(posts);
      renderFeed(); renderManageListIfNeeded();
    }
  });

  // Manage list actions
  elManageList?.addEventListener('click', (e) => {
    const editBtn = e.target.closest?.('[data-edit]');
    if (editBtn) { openEditDialog(Number(editBtn.dataset.edit)); return; }
    const delBtn = e.target.closest?.('[data-del]');
    if (delBtn && confirm('Delete this post?')) {
      const id = Number(delBtn.dataset.del);
      posts = posts.filter(p => p.id !== id);
      savePosts(posts);
      renderManageListIfNeeded(); renderFeed();
    }
  });

  // Dialog
  dlgCancel?.addEventListener('click', closeDialog);
  dlgSave?.addEventListener('click', () => {
    if (editingId == null) return closeDialog();
    const idx = posts.findIndex(p => p.id === editingId);
    if (idx === -1) return closeDialog();
    posts[idx].text     = escapeHTML((dlgText?.value || '').trim());
    posts[idx].category = dlgCat?.value || posts[idx].category;
    savePosts(posts);
    closeDialog();
    renderFeed();
    renderManageListIfNeeded();
  });
  dlg?.addEventListener('click', (e) => { if (e.target === dlg) closeDialog(); });

  // ==== UI / Render ====
  function setLoginMsg(msg){ if(elLoginMsg) elLoginMsg.textContent = msg; }

  function reflectLoginUI(){
    if (user) {
      if (elLogin)    elLogin.style.display    = 'none';
      if (elPostForm) elPostForm.style.display = '';
      if (elManage)   elManage.style.display   = '';
      if (elUser)     elUser.textContent       = `Logged in as: ${user}`;
    } else {
      if (elLogin)    elLogin.style.display    = '';
      if (elPostForm) elPostForm.style.display = 'none';
      if (elManage)   elManage.style.display   = 'none';
      if (elUser)     elUser.textContent       = '';
    }
  }

  function currentFilter(){
    const active = elFilters ? $('.bb-filter.active', elFilters) : null;
    return active ? active.getAttribute('data-filter') : 'All';
  }

  function renderFeed(){
    if (!elFeed) return;
    const term = (elSearch?.value || '').toLowerCase();
    const cat  = currentFilter();
    const data = posts.filter(p=>{
      const okCat  = (cat === 'All') ? true : (p.category === cat);
      const okTerm = term ? decodeHTML(p.text).toLowerCase().includes(term) : true;
      return okCat && okTerm;
    });

    elFeed.innerHTML = '';
    data.forEach(p=>{
      const card = document.createElement('article');
      card.className = 'bb-card';
      card.innerHTML = `
        <div class="bb-meta">
          <span class="bb-tag">${p.category}</span>
          <span>${formatDate(p.dateISO)}</span> • <span>by ${escapeHTML(p.author || '')}</span>
        </div>
        <h4>${truncate(decodeHTML(p.text), 160)}</h4>
        ${p.image ? `<div class="bb-imgbox"><img src="${p.image}" alt=""></div>` : ``}
        <div class="bb-actions">
          <button class="btn small" data-like="${p.id}" type="button">👍 Like <span>(${p.likes || 0})</span></button>
          ${user ? `
            <button class="btn small outline" data-edit="${p.id}" type="button">Edit</button>
            <button class="btn small alt" data-del="${p.id}" type="button">Delete</button>
          ` : ``}
        </div>
      `;
      elFeed.appendChild(card);
    });
  }

  function renderManageListIfNeeded(){
    if (!user || !elManageList) return;
    elManageList.innerHTML = '';
    posts.forEach(p=>{
      const row = document.createElement('div');
      row.className = 'bb-card';
      row.innerHTML = `
        <div class="bb-meta">
          <span class="bb-tag">${p.category}</span>
          <span>${formatDate(p.dateISO)}</span> • <span>by ${escapeHTML(p.author || '')}</span>
        </div>
        <p style="margin:.5rem 0">${truncate(decodeHTML(p.text), 220)}</p>
        <div class="bb-actions">
          <button class="btn small outline" data-edit="${p.id}" type="button">Edit</button>
          <button class="btn small alt" data-del="${p.id}" type="button">Delete</button>
        </div>
      `;
      elManageList.appendChild(row);
    });
  }

  function likePost(id){
    const idx = posts.findIndex(p=>p.id===id);
    if (idx === -1) return;
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    savePosts(posts);
    renderFeed();
  }

  function openEditDialog(id){
    const p = posts.find(x=>x.id===id);
    if(!p || !dlg || !dlgText || !dlgCat) return;
    editingId      = id;
    dlgText.value  = decodeHTML(p.text);
    dlgCat.value   = p.category;
    dlg.style.display = 'flex';
  }
  function closeDialog(){
    editingId = null;
    if (dlg) dlg.style.display = 'none';
  }

  function applyQueryParams(){
    const params = new URLSearchParams(location.search);
    const cat  = params.get('cat');
    const view = params.get('view'); // 'post' | 'manage'
    if (cat && elFilters) {
      const normalized = (cat === 'Sports Champions') ? 'Sports' : cat;
      const btn = $(`.bb-filter[data-filter="${normalized}"]`, elFilters);
      if (btn) {
        $$('.bb-filter', elFilters).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      }
    }
    if (view === 'post') {
      user ? elPostForm?.scrollIntoView({behavior:'smooth'}) : elLogin?.scrollIntoView({behavior:'smooth'});
    }
    if (view === 'manage' && user && elManage) {
      elManage.style.display = '';
      elManage.scrollIntoView({behavior:'smooth'});
    }
  }
})();

function renderFeed(){
  if (!elFeed) return;
  const term = (elSearch?.value || '').toLowerCase();
  const cat  = currentFilter();
  const data = posts.filter(p=>{
    const okCat  = (cat === 'All') ? true : (p.category === cat);
    const okTerm = term ? decodeHTML(p.text).toLowerCase().includes(term) : true;
    return okCat && okTerm;
  });

  elFeed.innerHTML = '';
  data.forEach((p, idx)=>{
    const hasImg = !!p.image;
    const card = document.createElement('article');

    // Base classes: 'bb-card' plus 'media' if we have an image
    card.className = 'bb-card' + (hasImg ? ' media' : '');

    // Alternate left/right when there is an image
    if (hasImg && idx % 2 === 1) {
      card.classList.add('media-right');
    }

    // Build image column (if any)
    const mediaCol = hasImg
      ? `<div class="bb-media-box"><img src="${p.image}" alt=""></div>`
      : '';

    // Build text/actions column
    const contentCol = `
      <div class="bb-content">
        <div class="bb-meta">
          <span class="bb-tag">${p.category}</span>
          <span>${formatDate(p.dateISO)}</span> • <span>by ${escapeHTML(p.author || '')}</span>
        </div>
        <h4>${truncate(decodeHTML(p.text), 160)}</h4>
        <div class="bb-actions">
          <button class="btn small" data-like="${p.id}" type="button">👍 Like <span>(${p.likes || 0})</span></button>
          ${user ? `
            <button class="btn small outline" data-edit="${p.id}" type="button">Edit</button>
            <button class="btn small alt" data-del="${p.id}" type="button">Delete</button>
          ` : ``}
        </div>
      </div>
    `;

    // If there is an image, we emit two columns; otherwise emit one column
    if (hasImg) {
      // For media-right, content should come first in DOM so CSS flips visually;
      // but we can keep a simple logic: left image when idx even, right when odd
      if (idx % 2 === 0) {
        card.innerHTML = `${mediaCol}${contentCol}`;
      } else {
        card.innerHTML = `${contentCol}${mediaCol}`;
      }
    } else {
      card.innerHTML = contentCol;
    }

    elFeed.appendChild(card);
  });
}

