(() => {
  const cfg = window.SITE_CONFIG;
  const phone = 'tel:+74950959599';
  const labels = {whisky:'Виски',vodka:'Водка',gin:'Джин',cognac:'Коньяк',liqueur:'Ликёр',vermouth:'Вермут','white-wine':'Белое вино','red-wine':'Красное вино',sparkling:'Игристое',beer:'Пиво'};
  const gate = document.getElementById('age-gate');
  try { if (sessionStorage.getItem('preview-age-ok') === '1') gate.hidden = true; } catch (_) {}
  document.getElementById('age-yes').addEventListener('click', () => { gate.hidden = true; try { sessionStorage.setItem('preview-age-ok', '1'); } catch (_) {} });
  document.getElementById('age-no').addEventListener('click', () => { document.getElementById('age-denied').hidden = false; });
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const products = document.getElementById('products');
  const filters = document.getElementById('filters');
  const search = document.getElementById('search');
  const empty = document.getElementById('empty');
  let active = 'all';
  fetch('../site-previews/products.json').then(r => { if (!r.ok) throw new Error('Catalog unavailable'); return r.json(); }).then(items => {
    // Fixed per-design permutation keeps every product and remains stable on reload.
    const shuffled = [...items];
    let seed = cfg.number * 7919;
    for (let i = shuffled.length - 1; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const hero = document.getElementById('hero-bottles');
    hero.innerHTML = shuffled.slice(0, 3).map((p, i) => `<img class="hero-bottle bottle-${i}" src="../${escapeHtml(p[3])}" alt="" ${i === 1 ? 'fetchpriority="high"' : ''}>`).join('');
    const categories = ['all', ...new Set(shuffled.map(p => p[0]))];
    filters.innerHTML = categories.map(key => `<button type="button" data-category="${escapeHtml(key)}" aria-pressed="${key === 'all'}">${key === 'all' ? 'Все напитки' : labels[key]}</button>`).join('');
    function render() {
      const query = search.value.trim().toLocaleLowerCase('ru');
      const shown = shuffled.filter(p => (active === 'all' || p[0] === active) && (p[1] + ' ' + labels[p[0]]).toLocaleLowerCase('ru').includes(query));
      products.innerHTML = shown.map((p, i) => `<article class="product"><div class="product-image"><span class="product-number">${String(i + 1).padStart(2, '0')}</span><img src="../${escapeHtml(p[3])}" alt="${escapeHtml(p[1])}" loading="lazy" decoding="async"></div><div class="product-info"><span class="product-cat">${escapeHtml(labels[p[0]])}</span><h3>${escapeHtml(p[1])}</h3><p>${escapeHtml(p[2])}</p><a href="${phone}" aria-label="Заказать ${escapeHtml(p[1])} по телефону">Заказать <span>↗</span></a></div></article>`).join('');
      empty.hidden = shown.length !== 0;
    }
    filters.addEventListener('click', event => { const button = event.target.closest('button[data-category]'); if (!button) return; active = button.dataset.category; filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); render(); });
    search.addEventListener('input', render);
    render();
  }).catch(() => { products.textContent = 'Не удалось загрузить каталог. Позвоните нам: +7 (495) 095-95-99'; });
})();
