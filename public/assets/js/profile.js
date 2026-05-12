(function () {
  'use strict';

  const COVERS = [
    ['#667eea','#764ba2'],['#f093fb','#f5576c'],['#4facfe','#00f2fe'],['#43e97b','#38f9d7'],
    ['#fa709a','#fee140'],['#a18cd1','#fbc2eb'],['#fda085','#f6d365'],['#89f7fe','#66a6ff'],
    ['#f7971e','#ffd200'],['#30cfd0','#667eea'],['#11998e','#38ef7d'],['#4e54c8','#8f94fb'],
  ];

  function gradient(i) {
    const [a, b] = COVERS[Math.abs(i) % COVERS.length];
    return `linear-gradient(145deg, ${a}, ${b})`;
  }

  function hashCode(str) {
    let h = 0;
    for (let c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return Math.abs(h);
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return m + ' phút trước';
    if (h < 24) return h + ' giờ trước';
    if (d < 30) return d + ' ngày trước';
    return new Date(ts).toLocaleDateString('vi-VN');
  }

  // Load data
  function loadHistory() {
    return JSON.parse(localStorage.getItem('reading-history') || '{}');
  }

  function loadBookmarks() {
    const raw = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    // Handle both old format (string[]) and new format (object[])
    return raw.map(item => typeof item === 'string'
      ? { slug: item, title: item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
      : item
    );
  }

  // ---- Stats ----
  const history = loadHistory();
  const bookmarks = loadBookmarks();
  const entries = Object.entries(history).sort((a, b) => b[1].timestamp - a[1].timestamp);
  const totalChapters = Object.values(history).reduce((sum, v) => sum + (v.chapter || 0), 0);

  document.getElementById('pstat-reading').textContent = entries.length;
  document.getElementById('pstat-bookmark').textContent = bookmarks.length;
  document.getElementById('pstat-chapters').textContent = totalChapters;

  // Avatar color from stats
  const avatarEl = document.getElementById('profile-avatar');
  const colors = ['#e84242','#f0a020','#2196f3','#4caf50','#9c27b0','#00bcd4'];
  avatarEl.style.background = `linear-gradient(135deg, ${colors[totalChapters % colors.length]}, ${colors[(totalChapters + 2) % colors.length]})`;

  // ---- Đang đọc tab ----
  (function renderReading() {
    const grid = document.getElementById('reading-grid');
    const empty = document.getElementById('reading-empty');
    document.getElementById('reading-count').textContent = entries.length
      ? entries.length + ' truyện đang đọc'
      : '';

    if (!entries.length) { empty.style.display = ''; return; }

    entries.forEach(([slug, info], i) => {
      const card = document.createElement('div');
      card.className = 'profile-book-card';
      const g = gradient(hashCode(slug));
      card.innerHTML = `
        <a class="card-link" href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${info.chapter}"></a>
        <button class="profile-book-remove" title="Xóa" data-slug="${slug}">✕</button>
        <div class="profile-cover">
          <div class="profile-cover-bg" style="background:${g}"></div>
          <div class="profile-cover-progress">Ch.${info.chapter}</div>
        </div>
        <div class="profile-book-meta">
          <div class="profile-book-title">${info.title}</div>
          <div class="profile-book-sub">${timeAgo(info.timestamp)}</div>
        </div>
      `;
      card.querySelector('.profile-book-remove').addEventListener('click', function (e) {
        e.stopPropagation();
        const h = JSON.parse(localStorage.getItem('reading-history') || '{}');
        delete h[this.dataset.slug];
        localStorage.setItem('reading-history', JSON.stringify(h));
        card.remove();
        if (!document.querySelectorAll('#reading-grid .profile-book-card').length) {
          empty.style.display = '';
        }
      });
      grid.appendChild(card);
    });
  })();

  // ---- Yêu thích tab ----
  (function renderBookmarks() {
    const grid = document.getElementById('bookmark-grid');
    const empty = document.getElementById('bookmark-empty');
    document.getElementById('bookmark-count').textContent = bookmarks.length
      ? bookmarks.length + ' truyện yêu thích'
      : '';

    if (!bookmarks.length) { empty.style.display = ''; return; }

    bookmarks.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'profile-book-card';
      const g = gradient(hashCode(item.slug));
      card.innerHTML = `
        <a class="card-link" href="book.html?slug=${encodeURIComponent(item.slug)}"></a>
        <button class="profile-book-remove" title="Bỏ theo dõi" data-slug="${item.slug}">✕</button>
        <div class="profile-cover">
          <div class="profile-cover-bg" style="background:${g}"></div>
        </div>
        <div class="profile-book-meta">
          <div class="profile-book-title">${item.title}</div>
          <div class="profile-book-sub">❤️ Yêu thích</div>
        </div>
      `;
      card.querySelector('.profile-book-remove').addEventListener('click', function (e) {
        e.stopPropagation();
        const bm = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const filtered = bm.filter(x => (typeof x === 'string' ? x : x.slug) !== this.dataset.slug);
        localStorage.setItem('bookmarks', JSON.stringify(filtered));
        card.remove();
        if (!document.querySelectorAll('#bookmark-grid .profile-book-card').length) {
          empty.style.display = '';
        }
      });
      grid.appendChild(card);
    });
  })();

  // ---- Lịch sử tab ----
  (function renderHistory() {
    const list = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    document.getElementById('history-count').textContent = entries.length
      ? entries.length + ' truyện'
      : '';

    if (!entries.length) { empty.style.display = ''; return; }

    entries.forEach(([slug, info], i) => {
      const li = document.createElement('li');
      const g = gradient(hashCode(slug));
      li.innerHTML = `
        <div class="history-cover">
          <div class="history-cover-bg" style="background:${g}"></div>
        </div>
        <div class="history-info">
          <a class="history-title" href="book.html?slug=${encodeURIComponent(slug)}">${info.title}</a>
          <div class="history-meta">Đang đọc Ch.${info.chapter} · ${timeAgo(info.timestamp)}</div>
        </div>
        <a class="history-continue-btn" href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${info.chapter}">▶ Đọc tiếp</a>
        <button class="history-remove-btn" data-slug="${slug}">✕</button>
      `;
      li.querySelector('.history-remove-btn').addEventListener('click', function () {
        const h = JSON.parse(localStorage.getItem('reading-history') || '{}');
        delete h[this.dataset.slug];
        localStorage.setItem('reading-history', JSON.stringify(h));
        li.remove();
        if (!document.querySelectorAll('#history-list li').length) {
          empty.style.display = '';
        }
      });
      list.appendChild(li);
    });
  })();

  // ---- Tabs ----
  document.querySelectorAll('.profile-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
  });

  // ---- Clear all ----
  window.clearAll = function (key) {
    if (!confirm('Xóa toàn bộ dữ liệu này?')) return;
    localStorage.removeItem(key);
    location.reload();
  };

  // ---- Mini search ----
  window.miniSearch = function () {
    const q = document.getElementById('miniSearchInput').value.trim();
    if (q) location.href = 'index.html?q=' + encodeURIComponent(q);
  };
  document.getElementById('miniSearchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') window.miniSearch();
  });
})();
