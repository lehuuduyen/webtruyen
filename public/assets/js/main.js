function toSlug(str) {
  return str
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const COVERS = [
  ['#667eea','#764ba2'], ['#f093fb','#f5576c'], ['#4facfe','#00f2fe'],
  ['#43e97b','#38f9d7'], ['#fa709a','#fee140'], ['#a18cd1','#fbc2eb'],
  ['#fda085','#f6d365'], ['#89f7fe','#66a6ff'], ['#f7971e','#ffd200'],
  ['#96fbc4','#f9f586'], ['#ff9a9e','#fad0c4'], ['#a1c4fd','#c2e9fb'],
  ['#d4fc79','#96e6a1'], ['#30cfd0','#667eea'], ['#f77062','#fe5196'],
  ['#c471f5','#fa71cd'], ['#11998e','#38ef7d'], ['#fc4a1a','#f7b733'],
  ['#4e54c8','#8f94fb'], ['#00b09b','#96c93d'], ['#f953c6','#b91d73'],
  ['#3f2b96','#a8c0ff'], ['#ee0979','#ff6a00'], ['#1d976c','#93f9b9'],
];

function coverStyle(i) {
  const [a, b] = COVERS[Math.abs(i) % COVERS.length];
  return `linear-gradient(145deg, ${a} 0%, ${b} 100%)`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' ngày trước';
  return Math.floor(diff / 2592000) + ' tháng trước';
}

function renderStars(rating) {
  const full = Math.round(rating || 0);
  return Array.from({length: 5}, (_, i) =>
    `<span class="${i < full ? 'star-on' : 'star-off'}">★</span>`
  ).join('');
}

function makeBookCardH(book, i, chapterMap) {
  const bookLink = `book.html?slug=${encodeURIComponent(book.slug)}`;
  const chs = (chapterMap && chapterMap[book.slug]) || [];
  const latestChs = chs.slice(-2).reverse();

  const chsHtml = latestChs.length
    ? latestChs.map(ch => `
        <div class="book-ch-row">
          <a href="doc.html?slug=${encodeURIComponent(book.slug)}&chapter=${ch.ch}">Chapter ${ch.ch}</a>
          <span class="book-ch-time">${timeAgo(ch.created_at)}</span>
        </div>`).join('')
    : book.chapters
      ? `<div class="book-ch-row"><a href="${bookLink}">Chapter ${book.chapters}</a><span class="book-ch-time"></span></div>`
      : '';

  const badgeHtml = book.status === 'complete'
    ? '<div class="book-badge full" style="z-index:2">FULL</div>' : '';

  const card = document.createElement('div');
  card.className = 'book-card-h';
  card.innerHTML = `
    <a href="${bookLink}" class="book-cover-h-wrap">
      ${badgeHtml}
      <div class="book-cover-h-bg" style="background:${coverStyle(i)}"></div>
      ${book.img ? `<img class="book-cover-h-img" src="${book.img}" alt="${book.title}" loading="lazy" onerror="this.style.display='none'">` : ''}
    </a>
    <div class="book-info-h">
      <div class="book-title-h"><a href="${bookLink}">${book.title}</a></div>
      <div class="book-stars-h">${renderStars(book.rating)}<span class="book-rating-val">${(book.rating || 0).toFixed(1)}</span></div>
      <div class="book-views-h">${book.views || 0} lượt xem</div>
      <div class="book-chs-h">${chsHtml}</div>
    </div>
  `;
  return card;
}

function makeBookCard(book, i) {
  const bookLink = `book.html?slug=${encodeURIComponent(book.slug)}`;
  const card = document.createElement('div');
  card.className = 'book-card';
  const chLabel = book.chapters ? 'Ch.' + book.chapters : '';
  const badgeHtml = book.status === 'complete'
    ? '<div class="book-badge full">FULL</div>'
    : (i % 3 === 0 ? '<div class="book-badge hot">HOT</div>' : '');
  card.innerHTML = `
    <a href="${bookLink}">
      <div class="book-cover-wrap">
        ${badgeHtml}
        <div class="book-cover-inner">
          <div class="book-cover-bg" style="background:${coverStyle(i)}"></div>
          ${book.img ? `<img class="book-cover-img" src="${book.img}" alt="${book.title}" loading="lazy" onerror="this.style.display='none'">` : ''}
          <div class="book-cover-title">${book.title}</div>
        </div>
      </div>
      <div class="book-info">
        <div class="book-title"><a href="${bookLink}">${book.title}</a></div>
        <div class="book-chapter">${chLabel}</div>
        ${book.author ? `<div class="book-author">${book.author}</div>` : ''}
      </div>
    </a>
  `;
  return card;
}

function makeListItem(book, rank) {
  const li = document.createElement('li');
  const rankClass = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : '';
  const ch = book.chapters ? 'Ch.' + book.chapters : '';
  li.innerHTML = `
    <span class="rank ${rankClass}">${rank}</span>
    <a href="book.html?slug=${encodeURIComponent(book.slug)}">${book.title}</a>
    ${ch ? `<span class="chapter-info">${ch}</span>` : ''}
  `;
  return li;
}

// ===== DYNAMIC CATEGORY SECTIONS =====
function renderDynCatBookGrid(parentId, selectedCatId, books, cats) {
  const grid = document.getElementById('dyn-cat-grid-' + parentId);
  if (!grid) return;
  grid.innerHTML = '';
  grid.className = 'book-grid-h';
  let pool;
  if (selectedCatId === parentId) {
    const childIds = cats.filter(c => c.parent_id === parentId).map(c => c.id);
    const allIds = new Set([parentId, ...childIds]);
    pool = books.filter(b => (b.categoryIds || []).some(id => allIds.has(id)));
  } else {
    pool = books.filter(b => (b.categoryIds || []).includes(selectedCatId));
  }
  if (!pool.length) {
    grid.innerHTML = '<div style="color:#9ca3af;padding:16px;font-size:13px;grid-column:span 2">Chưa có truyện nào trong danh mục này.</div>';
    return;
  }
  pool.slice(0, 8).forEach((book, i) => grid.appendChild(makeBookCardH(book, i + 12)));
}

function renderDynamicCategorySection(cats, books) {
  const container = document.getElementById('dynamic-cat-sections');
  if (!container || !cats.length || !books.length) return;

  const roots = cats.filter(c => !c.parent_id && c.showOnHome)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!roots.length) return;

  roots.forEach(parent => {
    const children = cats.filter(c => c.parent_id === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const allIds = new Set([parent.id, ...children.map(c => c.id)]);
    const sectionBooks = books.filter(b => (b.categoryIds || []).some(id => allIds.has(id)));
    if (!sectionBooks.length) return;

    const section = document.createElement('div');
    section.className = 'section dyn-cat-section';

    const tabsHtml = children.length
      ? `<div class="dyn-cat-tabs">
          <button class="dyn-cat-tab active" data-cat-id="${parent.id}">Tất Cả</button>
          ${children.map(c => `<button class="dyn-cat-tab" data-cat-id="${c.id}">${c.icon || ''} ${c.name}</button>`).join('')}
        </div>`
      : '';

    section.innerHTML = `
      <div class="section-header" style="flex-wrap:wrap;gap:8px">
        <h2>${parent.icon || '📚'} ${parent.name}</h2>
        ${tabsHtml}
      </div>
      <div class="book-grid-h" id="dyn-cat-grid-${parent.id}"></div>
    `;
    container.appendChild(section);

    renderDynCatBookGrid(parent.id, parent.id, books, cats);

    section.querySelectorAll('.dyn-cat-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        section.querySelectorAll('.dyn-cat-tab').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderDynCatBookGrid(parent.id, this.dataset.catId, books, cats);
      });
    });
  });
}

// ===== READING HISTORY (localStorage — user preference) =====
function renderReadingHistory() {
  const history = JSON.parse(localStorage.getItem('reading-history') || '{}');
  const entries = Object.entries(history)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .slice(0, 6);
  if (!entries.length) return;

  const section = document.getElementById('continue-section');
  const grid = document.getElementById('continue-grid');
  if (!section || !grid) return;
  section.style.display = '';

  entries.forEach(([slug, info], idx) => {
    const card = document.createElement('div');
    card.className = 'continue-card';
    const gradient = coverStyle(idx + 5);
    const imgHtml = info.img
      ? `<img class="continue-cover-img" src="${info.img}" alt="${info.title}" loading="lazy" onerror="this.style.display='none'">`
      : '';
    card.innerHTML = `
      <a class="continue-link" href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${info.chapter}"></a>
      <div class="continue-cover">
        <div class="continue-cover-bg" style="background:${gradient}"></div>
        ${imgHtml}
        <div class="continue-progress">Ch.${info.chapter}</div>
      </div>
      <div class="continue-title">${info.title}</div>
    `;
    grid.appendChild(card);
  });
}

window.clearReadingHistory = function () {
  localStorage.removeItem('reading-history');
  const section = document.getElementById('continue-section');
  if (section) section.style.display = 'none';
  document.getElementById('continue-grid').innerHTML = '';
};

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});

// ===== INIT =====
(async function () {
  const [books, cats] = await Promise.all([
    fetch('/api/books').then(r => r.json()).catch(() => []),
    fetch('/api/categories').then(r => r.json()).catch(() => []),
  ]);

  // ===== TOP LAYOUT =====
  if (books.length) {
    document.getElementById('top-layout').style.display = '';

    const featuredGrid = document.getElementById('featured-grid');
    featuredGrid.className = 'book-grid-h';
    books.slice(0, 8).forEach((book, i) => featuredGrid.appendChild(makeBookCardH(book, i)));

    const rankingList = document.getElementById('ranking-list');
    [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10).forEach((book, i) => rankingList.appendChild(makeListItem(book, i + 1)));

    const newList = document.getElementById('new-list');
    [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8).forEach((book, i) => newList.appendChild(makeListItem(book, i + 1)));
  }

  // ===== DYNAMIC CATEGORY SECTIONS =====
  renderDynamicCategorySection(cats, books);

  // ===== READING HISTORY =====
  renderReadingHistory();

  // ===== LIVE SEARCH =====
  (function () {
    function normalize(s) {
      return s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('searchDropdown');
    if (!input || !dropdown) return;

    function showDropdown(q) {
      if (!q) { dropdown.classList.remove('open'); return; }
      const nq = normalize(q);
      const results = books.filter(b => normalize(b.title).includes(nq) || normalize(b.author || '').includes(nq)).slice(0, 8);
      dropdown.innerHTML = '';
      if (!results.length) {
        dropdown.innerHTML = '<div class="search-no-result">Không tìm thấy truyện phù hợp</div>';
        dropdown.classList.add('open');
        return;
      }
      results.forEach((book, idx) => {
        const a = document.createElement('a');
        a.className = 'search-result-item';
        a.href = 'book.html?slug=' + encodeURIComponent(book.slug);
        a.innerHTML = `
          <div class="search-result-cover">
            <div class="search-result-cover-bg" style="background:${coverStyle(idx)}"></div>
            ${book.img ? `<img src="${book.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">` : ''}
          </div>
          <div class="search-result-text">
            <div class="search-result-title">${book.title}</div>
            <div class="search-result-meta">${book.author || ''}${book.chapters ? ' · Ch.' + book.chapters : ''}</div>
          </div>
        `;
        dropdown.appendChild(a);
      });
      dropdown.classList.add('open');
    }

    input.addEventListener('input', function () { showDropdown(this.value.trim()); });
    input.addEventListener('focus', function () { if (this.value.trim()) showDropdown(this.value.trim()); });
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== input) dropdown.classList.remove('open');
    });

    window.doSearch = function () {
      const q = input.value.trim();
      if (!q) return;
      const nq = normalize(q);
      const match = books.find(b => normalize(b.title).includes(nq));
      if (match) location.href = 'book.html?slug=' + encodeURIComponent(match.slug);
      else showDropdown(q);
    };

    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });

    const q = new URLSearchParams(location.search).get('q');
    if (q) { input.value = q; input.dispatchEvent(new Event('input')); input.focus(); }
  })();

  // ===== SUGGESTIONS =====
  (function () {
    if (!books.length) return;

    const section = document.getElementById('suggestions-section');
    const grid = document.getElementById('suggestions-grid');
    const refreshBtn = document.getElementById('suggestRefreshBtn');
    if (!section || !grid) return;

    const history = JSON.parse(localStorage.getItem('reading-history') || '{}');
    const readSlugs = new Set(Object.keys(history));

    const readCatIds = new Set();
    books.forEach(b => {
      if (readSlugs.has(b.slug)) {
        (b.categoryIds || []).forEach(id => readCatIds.add(id));
      }
    });

    let unread = books.filter(b => !readSlugs.has(b.slug));
    let pool = unread.length >= 4 ? unread : books;

    pool = pool.map(b => ({
      book: b,
      score: (b.categoryIds || []).filter(id => readCatIds.has(id)).length + Math.random() * 0.5,
    })).sort((a, b) => b.score - a.score).map(x => x.book);

    let offset = 0;
    const PAGE = 8;

    function render() {
      grid.innerHTML = '';
      grid.className = 'book-grid-h';
      const slice = pool.slice(offset, offset + PAGE);
      if (!slice.length) { section.style.display = 'none'; return; }
      section.style.display = '';
      slice.forEach((book, i) => grid.appendChild(makeBookCardH(book, i + 40)));
    }

    if (pool.length) {
      render();
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
          offset = (offset + PAGE) % pool.length;
          if (offset + PAGE > pool.length) offset = 0;
          render();
        });
      }
    }
  })();
})();
