// assets/js/chatbot.js
(function () {
  // ===== Basic config you can customize =====
  const SCHOOL = {
    name: 'SCPHS',
    address: 'Kayapa, Nueva Vizcaya',
    officeHours: 'Mon–Fri, 8:00 AM – 4:00 PM',
    registrarEmail: 'registrar@scphs.local',
    telephone: '(000) 000-0000'
  };

  const LS_POSTS_KEY = 'bb_posts_v1';
  const LS_CHAT_KEY  = 'scphs_chat_history_v1';

  // ===== Utility helpers =====
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const elRoot = document.getElementById('scphs-chatbot-root');

  function loadPosts(){
    try { return JSON.parse(localStorage.getItem(LS_POSTS_KEY) || '[]'); }
    catch { return []; }
  }
  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(LS_CHAT_KEY) || '[]'); }
    catch { return []; }
  }
  function saveHistory(list){
    localStorage.setItem(LS_CHAT_KEY, JSON.stringify(list.slice(-200))); // keep last 200 msgs
  }
  function truncate(s,n){ return s.length>n ? s.slice(0,n-1)+'…' : s; }
  function escapeHTML(s){ return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function formatDate(iso){ try{ return new Date(iso).toLocaleString(); }catch{ return ''; } }

  // ===== Tiny FAQ knowledge base (edit freely) =====
  // Each item: { q: ['patterns'], a: 'answer (HTML allowed)' }
  const FAQ = [
    {
      q: ['hello','hi','good morning','good afternoon','good evening'],
      a: `Hello! This is the ${SCHOOL.name} helper. Ask about admissions, enrollment schedule, requirements, office hours, or type <b>latest</b> to see recent posts.`
    },
    {
      q: ['admission','admissions','enroll','enrollment','requirements'],
      a: `Admissions at ${SCHOOL.name}:<br>• Requirements: Form 138/Report Card, PSA Birth Certificate, Good Moral (if applicable).<br>• Where: Registrar’s Office.<br>• Hours: ${SCHOOL.officeHours}.<br>• Questions? Email <a class="scbot-link" href="mailto:${SCHOOL.registrarEmail}">${SCHOOL.registrarEmail}</a>.`
    },
    {
      q: ['schedule','calendar','when','opening','start of class'],
      a: `School hours: ${SCHOOL.officeHours}. For official dates, please watch the Bulletin or DepEd advisories.`
    },
    {
      q: ['contact','telephone','email','office','address','where'],
      a: `Address: ${SCHOOL.address}<br>Tel: ${SCHOOL.telephone}<br>Email: <a class="scbot-link" href="mailto:${SCHOOL.registrarEmail}">${SCHOOL.registrarEmail}</a>`
    },
    {
      q: ['principal','office of the principal','head'],
      a: `You may contact the School Head via the main office during ${SCHOOL.officeHours}. For formal requests, email <a class="scbot-link" href="mailto:${SCHOOL.registrarEmail}">${SCHOOL.registrarEmail}</a> (will route internally).`
    }
  ];

  // ===== Match function (simple keyword/includes) =====
  function findAnswer(userText){
    const t = userText.toLowerCase().trim();

    // Special commands
    if (t === 'latest' || t === 'latest posts' || t === 'announcements' || t === 'news') {
      return { type: 'latest' };
    }
    if (t.startsWith('search ')) {
      return { type: 'search', term: t.slice(7).trim() };
    }

    // Try FAQ patterns
    for (const item of FAQ) {
      if (item.q.some(p => t.includes(p))) {
        return { type: 'faq', html: item.a };
      }
    }

    // Fallback
    return {
      type: 'fallback',
      html: `I’m not sure yet. Try these:<div class="scbot-quick">
        <button data-quick="admissions">Admissions</button>
        <button data-quick="schedule">Schedule</button>
        <button data-quick="contact">Contact</button>
        <button data-quick="latest">Latest</button>
        <button data-quick="help">Help</button>
      </div>`
    };
  }

  // ===== Build UI =====
  if (!elRoot) return;
  elRoot.innerHTML = `
    <button class="scbot-bubble" id="scbot-bubble" aria-label="Open ${SCHOOL.name} chat" title="Chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"/>
      </svg>
    </button>
    <section class="scbot-panel" id="scbot-panel" role="dialog" aria-modal="true" aria-label="${SCHOOL.name} Chat">
      <header class="scbot-header">
        <h3 class="scbot-title">${SCHOOL.name} Chat</h3>
        <div class="scbot-actions">
          <button id="scbot-help" title="Help">Help</button>
          <button id="scbot-clear" title="Clear chat">Clear</button>
          <button id="scbot-close" title="Close">Close</button>
        </div>
      </header>
      <div class="scbot-body" id="scbot-body" tabindex="0" aria-live="polite"></div>
      <footer class="scbot-footer">
        <input id="scbot-input" class="scbot-input" type="text" placeholder="Type a message… (e.g., latest)" />
        <button id="scbot-send" class="scbot-send">Send</button>
      </footer>
    </section>
  `;

  const ui = {
    bubble: $('#scbot-bubble', elRoot),
    panel:  $('#scbot-panel',  elRoot),
    body:   $('#scbot-body',   elRoot),
    input:  $('#scbot-input',  elRoot),
    send:   $('#scbot-send',   elRoot),
    clear:  $('#scbot-clear',  elRoot),
    close:  $('#scbot-close',  elRoot),
    help:   $('#scbot-help',   elRoot),
  };

  // ===== Render helpers =====
  function appendMsg(role, html){
    const row = document.createElement('div');
    row.className = `scbot-msg ${role}`;
    row.innerHTML = `<div class="bubble">${html}</div>`;
    ui.body.appendChild(row);
    ui.body.scrollTop = ui.body.scrollHeight;
  }
  function appendMeta(txt){
    const m = document.createElement('div');
    m.className = 'scbot-meta';
    m.textContent = txt;
    ui.body.appendChild(m);
    ui.body.scrollTop = ui.body.scrollHeight;
  }

  function showWelcomeOnce(){
    const hist = loadHistory();
    if (hist.length === 0) {
      appendMsg('bot', `Hi! I’m the ${SCHOOL.name} helper. Try <b>latest</b> to see recent Bulletin posts, or ask about <em>admissions</em>, <em>schedule</em>, <em>contact</em>. Type <code>search your keywords</code> to find posts.`);
      saveHistory([{role:'bot', html:`Hi! I’m the ${SCHOOL.name} helper...`}]);
    } else {
      // replay history
      hist.forEach(msg => appendMsg(msg.role, msg.html));
      appendMeta(`Welcome back — ${hist.length} previous messages loaded.`);
    }
  }

  function handleQuickButtons(container){
    container?.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-quick]');
      if (!btn) return;
      const term = btn.getAttribute('data-quick');
      if (term === 'help') return showHelp();
      if (term === 'latest') return processInput('latest');
      processInput(term);
    });
  }

  function showHelp(){
    appendMsg('bot', `Quick tips:
      <div class="scbot-card">
      • <b>latest</b> → shows recent posts from your Bulletin<br>
      • <b>search admission</b> → searches posts containing “admission”<br>
      • <b>admissions</b>, <b>schedule</b>, <b>contact</b> → school FAQs<br>
      • Click <b>Clear</b> to remove chat history on this browser
      </div>`);
    const hist = loadHistory(); hist.push({role:'bot', html:'Quick tips shown'}); saveHistory(hist);
  }

  // Render posts as cards
  function renderPosts(list, title='Latest posts'){
    if (!list.length) {
      appendMsg('bot', 'No posts found yet. Create one in the Bulletin page.');
      return;
    }
    const html = list.slice(0,3).map(p=>{
      const text = truncate((p.text||'').replace(/<[^>]*>/g,''), 160);
      const when = formatDate(p.dateISO);
      return `<div class="scbot-card">
        <div><span class="scbot-tag">${escapeHTML(p.category||'')}</span> ${when}</div>
        <div>${escapeHTML(text)}</div>
        <div style="margin-top:6px">
          <a class="scbot-link" href="bulletin.html?cat=${encodeURIComponent(p.category||'All')}" target="_blank" rel="noopener">Open in Bulletin</a>
        </div>
      </div>`;
    }).join('');
    appendMsg('bot', `<b>${title}</b>${html}`);
    const hist = loadHistory(); hist.push({role:'bot', html:`${title} cards`}); saveHistory(hist);
  }

  async function processInput(text){
    const t = text.trim();
    if (!t) return;
    appendMsg('user', escapeHTML(t));
    const hist = loadHistory(); hist.push({role:'user', html:escapeHTML(t)}); saveHistory(hist);

    const intent = findAnswer(t);

    if (intent.type === 'faq') {
      appendMsg('bot', intent.html);
      const h = loadHistory(); h.push({role:'bot', html:intent.html}); saveHistory(h);
      handleQuickButtons(ui.body);
      return;
    }

    if (intent.type === 'latest') {
      const posts = loadPosts();
      renderPosts(posts, 'Latest posts');
      return;
    }

    if (intent.type === 'search') {
      const q = intent.term.toLowerCase();
      const posts = loadPosts().filter(p=>{
        const plain = (p.text||'').toLowerCase();
        const cat   = (p.category||'').toLowerCase();
        return plain.includes(q) || cat.includes(q);
      });
      renderPosts(posts, `Search results for “${escapeHTML(intent.term)}”`);
      return;
    }

    // fallback
    appendMsg('bot', intent.html);
    const h2 = loadHistory(); h2.push({role:'bot', html:intent.html}); saveHistory(h2);
    handleQuickButtons(ui.body);
  }

  // ===== Wire up UI =====
  ui.bubble.addEventListener('click', ()=>{
    const shown = ui.panel.style.display === 'flex';
    ui.panel.style.display = shown ? 'none' : 'flex';
    if (!shown) {
      ui.body.innerHTML = '';
      showWelcomeOnce();
      ui.input.focus();
    }
  });
  ui.close.addEventListener('click', ()=>{ ui.panel.style.display='none'; });
  ui.clear.addEventListener('click', ()=>{
    localStorage.removeItem(LS_CHAT_KEY);
    ui.body.innerHTML = '';
    appendMsg('bot', 'Chat history cleared on this browser.');
    saveHistory([{role:'bot', html:'Chat history cleared.'}]);
  });
  ui.help.addEventListener('click', showHelp);

  ui.send.addEventListener('click', ()=>processInput(ui.input.value));
  ui.input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') processInput(ui.input.value); });

  // Click quick buttons inside bot messages
  ui.body.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-quick]');
    if (!b) return;
    const term = b.getAttribute('data-quick');
    if (term === 'help') return showHelp();
    if (term === 'latest') return processInput('latest');
    processInput(term);
  });

})();
const SCHOOL = {
  name: 'SCPHS',
  address: 'Kayapa, Nueva Vizcaya',
  officeHours: 'Mon–Fri, 8:00 AM – 4:00 PM',
  registrarEmail: 'registrar@scphs.local',
  telephone: '(000) 000-0000'
};
