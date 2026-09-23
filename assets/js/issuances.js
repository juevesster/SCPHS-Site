(() => {
  const LIST = document.getElementById('archive-list');
  const INFO = document.getElementById('page-info');
  const PREV = document.getElementById('prev-page');
  const NEXT = document.getElementById('next-page');

  const F_LEVEL = document.getElementById('f-level');
  const F_TYPE  = document.getElementById('f-type');
  const F_SIZE  = document.getElementById('f-size');
  const F_Q     = document.getElementById('f-q');
  const BTN_RST = document.getElementById('reset-filters');

  // State
  let level = '';
  let type  = '';
  let size  = 20;
  let q     = '';
  let page  = 1;    // 1-based
  let items = [];   // cached current result set

  // Read initial params (optional)
  const urlParams = new URLSearchParams(location.search);
  level = urlParams.get('level') || '';
  type  = urlParams.get('type')  || '';
  q     = urlParams.get('q')     || '';
  size  = parseInt(urlParams.get('size') || '20', 10);

  // Reflect UI
  F_LEVEL.value = level;
  F_TYPE.value  = type;
  F_SIZE.value  = String(size);
  F_Q.value     = q;

  async function fetchAll() {
    LIST.innerHTML = '<div class="meta">Loading…</div>';
    try {
      // For archive request a larger batch; adjust as needed
      const limit = Math.max(100, size * 5);
      items = await SCPHS_FEED.fetchItems({ limit, level, type, q });
      page = 1;
      renderPage();
    } catch (e) {
      console.error(e);
      LIST.innerHTML = `<div class="meta" style="color:#b91c1c;">Failed to load issuances.</div>`;
      INFO.textContent = '';
    }
  }

  function renderPage() {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    if (page > pages) page = pages;

    const startIdx = (page - 1) * size;
    const pageItems = items.slice(startIdx, startIdx + size);

    LIST.innerHTML = SCPHS_FEED.renderItems(pageItems);
    INFO.textContent = total ? `Page ${page} of ${pages} • ${total} item(s)` : 'No items found.';
    PREV.disabled = page <= 1;
    NEXT.disabled = page >= pages;
  }

  // Events
  F_LEVEL.addEventListener('change', () => { level = F_LEVEL.value; fetchAll(); });
  F_TYPE.addEventListener('change',  () => { type  = F_TYPE.value;  fetchAll(); });
  F_SIZE.addEventListener('change',  () => { size  = parseInt(F_SIZE.value, 10) || 20; fetchAll(); });
  F_Q.addEventListener('keydown',    (e) => { if (e.key === 'Enter') { q = F_Q.value.trim(); fetchAll(); } });

  BTN_RST.addEventListener('click', () => {
    level = ''; type = ''; size = 20; q = '';
    F_LEVEL.value = ''; F_TYPE.value = ''; F_SIZE.value = '20'; F_Q.value = '';
    fetchAll();
  });

  PREV.addEventListener('click', () => { if (page > 1) { page--; renderPage(); } });
  NEXT.addEventListener('click', () => { page++; renderPage(); });

  // Init
  fetchAll();
})();