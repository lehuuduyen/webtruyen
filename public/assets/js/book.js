(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || '';

  const GRADIENTS = [
    'linear-gradient(145deg,#667eea,#764ba2)',
    'linear-gradient(145deg,#f093fb,#f5576c)',
    'linear-gradient(145deg,#4facfe,#00f2fe)',
    'linear-gradient(145deg,#43e97b,#38f9d7)',
    'linear-gradient(145deg,#fa709a,#fee140)',
    'linear-gradient(145deg,#a18cd1,#fbc2eb)',
    'linear-gradient(145deg,#f7971e,#ffd200)',
    'linear-gradient(145deg,#4e54c8,#8f94fb)',
  ];

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function renderStars(rating) {
    const r = parseFloat(rating);
    const starsEl = document.getElementById('detail-stars');
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const span = document.createElement('span');
      if (i <= Math.floor(r)) { span.className = 'star-filled'; span.textContent = '★'; }
      else if (i - 0.5 <= r) { span.className = 'star-half'; span.textContent = '★'; }
      else { span.className = 'star-empty'; span.textContent = '☆'; }
      starsEl.appendChild(span);
    }
  }

  (async function () {
    if (!slug) return;

    // Fetch book info and chapters in parallel
    const [book, chapters] = await Promise.all([
      fetch('/api/books/' + encodeURIComponent(slug)).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/chapters/' + encodeURIComponent(slug)).then(r => r.json()).catch(() => []),
    ]);

    if (!book) {
      document.getElementById('detail-title').textContent = 'Không tìm thấy truyện';
      return;
    }

    const gradient = GRADIENTS[hashCode(slug) % GRADIENTS.length];
    const genres = book.genres ? book.genres.split(',').map(g => g.trim()) : ['Huyền Huyễn'];
    const chapterCount = chapters.length > 0
      ? chapters[chapters.length - 1].ch
      : (book.chapters || 0);
    const status = book.status === 'complete' ? 'Hoàn thành' : 'Đang ra';
    const desc = book.desc
      ? '<p>' + book.desc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'
      : '<p>Đang cập nhật nội dung...</p>';

    // Page title & breadcrumb
    document.title = book.title + ' - WebTruyện';
    document.getElementById('breadcrumb-title').textContent = book.title;
    document.getElementById('breadcrumb-genre').textContent = genres[0] || 'Truyện';
    document.getElementById('detail-title').textContent = book.title;
    document.getElementById('detail-author').textContent = book.author;

    // Status badge
    const statusEl = document.getElementById('detail-status-badge');
    statusEl.textContent = status;
    statusEl.style.background = book.status === 'complete' ? '#e8f5e9' : '#fff3e0';
    statusEl.style.color = book.status === 'complete' ? '#2e7d32' : '#e65100';

    // Stats
    document.getElementById('stat-chapters').textContent = chapterCount.toLocaleString('vi-VN');
    document.getElementById('stat-views').textContent = (book.views || 0).toLocaleString('vi-VN');
    document.getElementById('stat-rating').textContent = (book.rating || 4.5) + '/5';
    renderStars(book.rating || 4.5);

    // Cover
    const coverBg = document.getElementById('detail-cover-bg');
    coverBg.style.background = gradient;
    if (book.img) {
      const img = document.getElementById('detail-cover-img');
      img.src = book.img;
      img.alt = book.title;
    }

    // Genres
    const genresEl = document.getElementById('detail-genres');
    genres.forEach(g => {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'genre-tag';
      a.textContent = g;
      genresEl.appendChild(a);
    });

    // Description
    document.getElementById('book-description').innerHTML = desc;
    document.getElementById('chapter-count-badge').textContent = chapterCount + ' chương';

    // SEO
    const metaDesc = 'Đọc ' + book.title + ' - ' + book.author + ' | ' + chapterCount + ' chương | WebTruyện';
    document.getElementById('meta-desc') && (document.getElementById('meta-desc').content = metaDesc);
    document.getElementById('og-title') && (document.getElementById('og-title').content = book.title + ' - WebTruyện');
    document.getElementById('og-desc') && (document.getElementById('og-desc').content = metaDesc);

    // Reading progress
    const history = JSON.parse(localStorage.getItem('reading-history') || '{}');
    const progress = history[slug];
    const firstLink = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=1';
    document.getElementById('btn-read-first').href = firstLink;

    if (progress && progress.chapter > 1) {
      const continueBtn = document.getElementById('btn-read-continue');
      continueBtn.style.display = '';
      continueBtn.href = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=' + progress.chapter;
      document.getElementById('continue-ch-num').textContent = progress.chapter;
    }

    // Bookmark
    const rawBm = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const bookmarkBtn = document.getElementById('btn-bookmark');
    let isBookmarked = rawBm.some(x => (typeof x === 'string' ? x : x.slug) === slug);
    if (isBookmarked) { bookmarkBtn.classList.add('bookmarked'); bookmarkBtn.textContent = '✅ Đã Theo Dõi'; }

    bookmarkBtn.addEventListener('click', function () {
      const bm = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      const idx = bm.findIndex(x => (typeof x === 'string' ? x : x.slug) === slug);
      if (idx === -1) {
        bm.push({ slug, title: book.title, author: book.author, gradient });
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.textContent = '✅ Đã Theo Dõi';
      } else {
        bm.splice(idx, 1);
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.textContent = '🔖 Theo Dõi';
      }
      localStorage.setItem('bookmarks', JSON.stringify(bm));
    });

    // Chapter list
    const CHUNK = 30;
    let shown = 0;
    const chapterGrid = document.getElementById('chapter-grid');
    const btnMore = document.getElementById('btn-load-more');

    function renderChapters(from, to) {
      if (chapters.length > 0) {
        const slice = chapters.slice(from, to);
        slice.forEach(function (c) {
          const a = document.createElement('a');
          a.href = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=' + c.ch;
          a.className = 'chapter-item';
          if (progress && progress.chapter === c.ch) a.classList.add('current-chapter');
          a.textContent = 'Chương ' + c.ch + ': ' + c.title;
          chapterGrid.appendChild(a);
        });
        shown = Math.min(to, chapters.length);
        btnMore.style.display = shown < chapters.length ? '' : 'none';
      } else {
        for (let i = from; i < to && i < chapterCount; i++) {
          const ch = i + 1;
          const a = document.createElement('a');
          a.href = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=' + ch;
          a.className = 'chapter-item';
          if (progress && progress.chapter === ch) a.classList.add('current-chapter');
          a.textContent = 'Chương ' + ch;
          chapterGrid.appendChild(a);
        }
        shown = Math.min(to, chapterCount);
        btnMore.style.display = shown < chapterCount ? '' : 'none';
      }
    }

    renderChapters(0, CHUNK);
    btnMore.addEventListener('click', function () {
      renderChapters(shown, shown + CHUNK);
    });

    // Similar books
    if (typeof window.renderSimilarBooks === 'function') {
      window.renderSimilarBooks('similar-grid', slug);
    }

    // Mini search
    window.miniSearch = function () {
      const q = document.getElementById('miniSearchInput').value.trim();
      if (q) location.href = 'index.html?q=' + encodeURIComponent(q);
    };
    document.getElementById('miniSearchInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') window.miniSearch();
    });
  })();
})();
