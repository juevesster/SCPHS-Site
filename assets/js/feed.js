/* Shared helpers for fetching & rendering issuances */
window.SCPHS_FEED = (function(){
  const ENDPOINT = () => window.SCPHS_ENDPOINT;

  const esc = (s='') => String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");

  const fmtDate = (iso='') => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    const dt = new Date(+y, (+m||1)-1, +d||1);
    if (isNaN(dt)) return iso;
    return dt.toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });
  };

  const buildUrl = ({ limit=50, level='', type='', q='' } = {}) => {
    const u = new URL(ENDPOINT());
    u.searchParams.set('limit', String(limit));
    if (level) u.searchParams.set('level', level);
    if (type)  u.searchParams.set('type',  type);
    if (q)     u.searchParams.set('q',     q);
    return u.toString();
  };

  const fetchItems = async (opts) => {
    const res = await fetch(buildUrl(opts), { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.items || [];
  };

  const renderItems = (items) => {
    if (!items.length) return '<div class="meta">No issuances found.</div>';
    return items.map(item => {
      const title = esc(item.title || 'Untitled');
      const url   = esc(item.url || '#');
      const date  = fmtDate(item.date || '');
      const src   = esc(item.source || '');
      const series= esc((item.series || '').toUpperCase());
      const level = item.level ? ' • ' + esc(item.level.toUpperCase()) : '';
      const type  = item.type  ? ' • ' + esc(item.type) : '';
      return `
        <article class="post">
          <div class="meta">${date} • ${src}</div>
          <h4><a href="${url}" target="_blank" rel="noopener">${title}</a></h4>
          <div class="meta">${series}${level}${type}</div>
        </article>
      `;
    }).join('');
  };

  return { esc, fmtDate, buildUrl, fetchItems, renderItems };
})();