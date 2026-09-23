// Toggle main faculty dropdown
(function(){
  document.querySelectorAll('.has-dropdown').forEach(dd => {
    const btn = dd.querySelector('.menu-toggle');
    const menu = dd.querySelector('.dropdown');
    if (!btn || !menu) return;

    const close = () => { dd.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
    const toggle = () => {
      const willOpen = !dd.classList.contains('open');
      document.querySelectorAll('.has-dropdown.open').forEach(x => {
        x.classList.remove('open');
        const b = x.querySelector('.menu-toggle');
        b && b.setAttribute('aria-expanded','false');
      });
      dd.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };

    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) close(); });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown') {
        dd.classList.add('open'); btn.setAttribute('aria-expanded','true');
        const first = menu.querySelector('a'); first && first.focus();
      }
    });
  });
})();