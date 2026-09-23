(() => {
  const LIST = document.getElementById('issuances-list');
  const FILTERS = document.querySelector('.filter-bar');
  const LOADMORE = document.getElementById('load-more');

  const PAGE_SIZE = 20;                   // items per "Load more"
  const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
  let currentLevel = 'division';          // default like SDO sites
  let currentLimit = PAGE_SIZE;

  async function load({ silent=false } = {}) {
    if (!silent) LIST.innerHTML = '<div class="meta">Loading latest memoranda &amp; orders…</div>';
    try {
      const items = await SCPHS_FEED.fetchItems({ limit: currentLimit, level: currentLevel });
      LIST.innerHTML = SCPHS_FEED.renderItems(items);
    } catch (e) {
      console.error(e);
      LIST.innerHTML = `
        <div class="meta" style="color:#b91c1c;">Failed to load issuances.</div>
        <div class="meta">
          Open sources:
          <a href="https://www.deped.gov.ph/category/issuances/deped-orders/" target="_blank" rel="noopener">DepEd Orders</a> •
          <a href="https://www.deped.gov.ph/deped-memorandum/" target="_blank" rel="noopener">DepEd Memoranda</a> •
          <a href="https://sdonuevavizcaya.com/category/division-memoranda/" target="_blank" rel="noopener">SDO NV Memoranda</a>
        </div>`;
    }
  }

  // Filters (chips)
  FILTERS?.addEventListener('click', e => {
    const btn = e.target.closest('.pill[data-level]');
    if (!btn) return;
    FILTERS.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level; // '' | 'national' | 'division'
    currentLimit = PAGE_SIZE;
    load();
  });

  // Load more
  LOADMORE?.addEventListener('click', () => {
    currentLimit += PAGE_SIZE;
    load({ silent:true });
  });

  // Init & auto refresh
  load();
  setInterval(() => load({ silent:true }), AUTO_REFRESH_MS);
})();