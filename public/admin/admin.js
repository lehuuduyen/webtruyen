(function () {
  'use strict';

  // ===== AUTH =====
  const _token = sessionStorage.getItem('admin-token');
  if (!_token) { location.href = 'login.html'; return; }

  const currentUser = sessionStorage.getItem('admin-user') || 'admin';
  document.getElementById('user-badge').textContent = '👤 ' + currentUser;

  document.getElementById('logoutBtn').addEventListener('click', async function () {
    await api('POST', '/api/auth/logout');
    sessionStorage.removeItem('admin-token');
    sessionStorage.removeItem('admin-user');
    location.href = 'login.html';
  });

  // ===== API HELPER =====
  function api(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'x-auth-token': _token },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(path, opts).then(r => r.json());
  }

  // ===== IN-MEMORY CACHE =====
  let _books = [];
  let _categories = [];

  async function loadBooks() {
    _books = await api('GET', '/api/books');
    return _books;
  }

  async function loadCategories() {
    _categories = await api('GET', '/api/categories');
    return _categories;
  }

  function getBooks() { return _books; }
  function getCategories() { return _categories; }

  // Chapter cache per slug
  const _chaptersCache = {};

  async function loadChapters(slug) {
    const chs = await api('GET', '/api/chapters/' + encodeURIComponent(slug));
    _chaptersCache[slug] = chs;
    return chs;
  }

  function getChapters(slug) { return _chaptersCache[slug] || []; }

  // ===== HELPERS =====
  function toSlug(str) {
    return str.replace(/đ/g,'d').replace(/Đ/g,'D')
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  }

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

  function getGradient(slug) {
    let h = 0;
    for (let c of slug) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return GRADIENTS[Math.abs(h) % GRADIENTS.length];
  }

  // ===== TAB NAVIGATION =====
  const TABS = { overview: 'Tổng Quan', books: 'Quản Lý Sách', chapters: 'Quản Lý Chương', categories: 'Danh Mục', settings: 'Cài Đặt' };

  function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.toggle('active', el.id === 'tab-' + tabId);
    });
    document.getElementById('topbar-title').textContent = TABS[tabId] || tabId;
    if (tabId === 'overview') renderOverview();
    if (tabId === 'books') renderBooks();
    if (tabId === 'chapters') renderChapterBookSelect();
    if (tabId === 'categories') renderCategories();
    if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
  }

  window.switchTab = switchTab;

  document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });

  document.getElementById('sidebarToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // ===== OVERVIEW =====
  function renderOverview() {
    const books = getBooks();
    const ongoing = books.filter(b => b.status === 'ongoing').length;
    const complete = books.filter(b => b.status === 'complete').length;
    const totalChs = books.reduce((s, b) => s + (b.chapters || 0), 0);

    document.getElementById('stat-books').textContent = books.length;
    document.getElementById('stat-chapters-total').textContent = totalChs;
    document.getElementById('stat-ongoing').textContent = ongoing;
    document.getElementById('stat-complete').textContent = complete;

    const tbody = document.getElementById('overview-tbody');
    const empty = document.getElementById('overview-empty');
    tbody.innerHTML = '';

    if (!books.length) { empty.style.display = ''; return; }
    empty.style.display = 'none';

    books.slice(0, 10).forEach((book, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td>${book.chapters || '—'}</td>
        <td><span class="badge-status ${book.status}">${book.status === 'complete' ? 'Hoàn thành' : 'Đang ra'}</span></td>
        <td>${fmtDate(book.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===== BOOKS TAB =====
  let editingId = null;

  function renderBooks() {
    let books = getBooks();
    const search = (document.getElementById('book-search').value || '').toLowerCase();
    const statusFilter = document.getElementById('book-filter').value;
    if (search) books = books.filter(b => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search));
    if (statusFilter !== 'all') books = books.filter(b => b.status === statusFilter);

    const tbody = document.getElementById('books-tbody');
    const empty = document.getElementById('books-empty');
    tbody.innerHTML = '';

    if (!books.length) { empty.style.display = ''; return; }
    empty.style.display = 'none';

    books.forEach((book, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>
          <div class="table-cover-gradient" style="background:${getGradient(book.slug)}"></div>
        </td>
        <td>
          <div style="font-weight:600;color:#1e2a3a">${book.title}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px">${book.genres || ''}</div>
        </td>
        <td>${book.author}</td>
        <td>${book.genres ? book.genres.split(',')[0].trim() : '—'}</td>
        <td>${book.chapters || '0'} chương</td>
        <td><span class="badge-status ${book.status}">${book.status === 'complete' ? 'Hoàn thành' : 'Đang ra'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="editBook('${book.id}')">✏️</button>
            <a class="btn-icon" href="../book.html?slug=${encodeURIComponent(book.slug)}" target="_blank" title="Xem">👁</a>
            <button class="btn-icon delete" onclick="confirmDelete('${book.id}')">🗑</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('book-search').addEventListener('input', () => renderBooks());
  document.getElementById('book-filter').addEventListener('change', () => renderBooks());

  // ===== IMAGE UPLOAD =====
  function updateImgPreview(src) {
    const box = document.getElementById('img-preview-box');
    if (!box) return;
    if (src) {
      box.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:6px" onerror="this.parentNode.innerHTML='<span class=img-preview-placeholder>❌</span>'">`;
    } else {
      box.innerHTML = '<span class="img-preview-placeholder">📷</span>';
    }
  }

  function resizeAndStore(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const MAX_W = 300, MAX_H = 450;
        let w = img.width, h = img.height;
        const ratio = Math.min(MAX_W / w, MAX_H / h, 1);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('f-img-file').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    resizeAndStore(file, function (dataUrl) {
      document.getElementById('f-img').value = dataUrl;
      updateImgPreview(dataUrl);
    });
    this.value = '';
  });

  document.getElementById('f-img').addEventListener('input', function () {
    updateImgPreview(this.value.trim());
  });

  document.getElementById('clear-img-btn').addEventListener('click', function () {
    document.getElementById('f-img').value = '';
    updateImgPreview('');
  });

  function populateBookCatCheckboxes(selectedIds) {
    const wrap = document.getElementById('book-cat-checkboxes');
    if (!wrap) return;
    const cats = getCategories();
    if (!cats.length) {
      wrap.innerHTML = '<span style="color:#aaa;font-size:12px">Chưa có danh mục nào. Tạo danh mục trước.</span>';
      return;
    }
    wrap.innerHTML = '';
    const roots = cats.filter(c => !c.parent_id);
    roots.forEach(root => {
      const children = cats.filter(c => c.parent_id === root.id);
      const group = document.createElement('div');
      group.className = 'cat-check-group';
      group.innerHTML = `<div class="cat-check-parent">${root.icon || '📁'} ${root.name}</div>`;
      [root, ...children].forEach(c => {
        const label = document.createElement('label');
        label.className = 'cat-check-item' + (c.parent_id ? ' cat-check-child' : '');
        const checked = (selectedIds || []).includes(c.id) ? 'checked' : '';
        label.innerHTML = `<input type="checkbox" name="book-cat" value="${c.id}" ${checked}> ${c.icon || ''} ${c.name}`;
        group.appendChild(label);
      });
      wrap.appendChild(group);
    });
  }

  document.getElementById('addBookBtn').addEventListener('click', function () {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Thêm Sách Mới';
    document.getElementById('bookForm').reset();
    document.getElementById('edit-id').value = '';
    updateImgPreview('');
    populateBookCatCheckboxes([]);
    openModal('bookModal');
  });

  window.editBook = function (id) {
    const book = getBooks().find(b => b.id === id);
    if (!book) return;
    editingId = id;
    document.getElementById('modal-title').textContent = 'Chỉnh Sửa Truyện';
    document.getElementById('edit-id').value = id;
    document.getElementById('f-title').value = book.title;
    document.getElementById('f-author').value = book.author;
    document.getElementById('f-genres').value = book.genres || '';
    document.getElementById('f-chapters').value = book.chapters || '';
    document.getElementById('f-status').value = book.status;
    document.getElementById('f-rating').value = book.rating || '';
    document.getElementById('f-img').value = book.img || '';
    document.getElementById('f-desc').value = book.desc || '';
    updateImgPreview(book.img || '');
    populateBookCatCheckboxes(book.categoryIds || []);
    openModal('bookModal');
  };

  document.getElementById('bookForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const title = document.getElementById('f-title').value.trim();
    const author = document.getElementById('f-author').value.trim();
    if (!title || !author) return;

    const checkedCats = Array.from(document.querySelectorAll('#book-cat-checkboxes input[name="book-cat"]:checked')).map(el => el.value);
    const data = {
      title, author,
      genres: document.getElementById('f-genres').value.trim(),
      chapters: parseInt(document.getElementById('f-chapters').value) || null,
      status: document.getElementById('f-status').value,
      rating: parseFloat(document.getElementById('f-rating').value) || 4.5,
      img: document.getElementById('f-img').value.trim() || null,
      desc: document.getElementById('f-desc').value.trim(),
      slug: toSlug(title),
      categoryIds: checkedCats,
    };

    if (editingId) {
      const updated = await api('PUT', '/api/books/' + editingId, data);
      const idx = _books.findIndex(b => b.id === editingId);
      if (idx !== -1) _books[idx] = updated;
    } else {
      const created = await api('POST', '/api/books', data);
      _books.unshift(created);
    }
    closeModal('bookModal');
    renderBooks();
    showToast(editingId ? 'Đã cập nhật truyện!' : 'Đã thêm truyện mới!');
  });

  // ===== DELETE CONFIRMATION =====
  let deleteTarget = { type: null, id: null };

  window.confirmDelete = function (id) {
    deleteTarget = { type: 'book', id };
    const book = getBooks().find(b => b.id === id);
    document.getElementById('confirm-msg').textContent = `Xóa truyện "${book ? book.title : ''}"? Tất cả chương cũng sẽ bị xóa.`;
    openModal('confirmModal');
  };

  window.confirmDeleteCat = function (id) {
    deleteTarget = { type: 'category', id };
    const cat = getCategories().find(c => c.id === id);
    document.getElementById('confirm-msg').textContent = `Xóa danh mục "${cat ? cat.name : ''}"? Truyện trong danh mục không bị xóa.`;
    openModal('confirmModal');
  };

  document.getElementById('confirmOk').addEventListener('click', async function () {
    if (deleteTarget.type === 'book') {
      await api('DELETE', '/api/books/' + deleteTarget.id);
      _books = _books.filter(b => b.id !== deleteTarget.id);
      closeModal('confirmModal');
      renderBooks();
      renderOverview();
      showToast('Đã xóa truyện!', 'error');
    } else if (deleteTarget.type === 'category') {
      await api('DELETE', '/api/categories/' + deleteTarget.id);
      _categories = _categories.filter(c => c.id !== deleteTarget.id && c.parent_id !== deleteTarget.id);
      closeModal('confirmModal');
      renderCategories();
      showToast('Đã xóa danh mục!', 'error');
    }
    deleteTarget = { type: null, id: null };
  });

  document.getElementById('confirmCancel').addEventListener('click', () => closeModal('confirmModal'));

  // ===== CHAPTERS TAB =====
  let activeChapterSlug = null;
  let editingChapter = null;

  const bssInput = document.getElementById('bss-input');
  const bssDropdown = document.getElementById('bss-dropdown');
  const bssClear = document.getElementById('bss-clear');

  async function bssSelectBook(slug, title) {
    activeChapterSlug = slug;
    bssInput.value = title;
    bssInput.dataset.selected = slug;
    bssClear.style.display = slug ? '' : 'none';
    bssDropdown.classList.remove('open');
    document.getElementById('addChapterBtn').disabled = !slug;
    if (slug) {
      chapterPage = 1; chapterQuery = '';
      await loadChapters(slug);
      renderChapterList(slug);
    } else {
      document.getElementById('chapter-list-wrap').innerHTML = '<div class="empty-msg">Chọn truyện để xem danh sách chương.</div>';
    }
    document.getElementById('chapter-form-card').style.display = 'none';
  }

  function bssRenderDropdown(query) {
    const books = getBooks();
    const q = (query || '').toLowerCase();
    const filtered = q ? books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) : books;
    bssDropdown.innerHTML = '';
    if (!filtered.length) {
      bssDropdown.innerHTML = '<div class="bss-empty">Không tìm thấy truyện</div>';
    } else {
      filtered.forEach(b => {
        const item = document.createElement('div');
        item.className = 'bss-item';
        if (b.slug === bssInput.dataset.selected) item.classList.add('selected');
        const chCount = (getChapters(b.slug) || []).length;
        item.innerHTML = `
          <div class="bss-item-title">${b.title}</div>
          <div class="bss-item-meta">${b.author} · ${b.chapters || 0} chương</div>
        `;
        item.addEventListener('click', () => bssSelectBook(b.slug, b.title));
        bssDropdown.appendChild(item);
      });
    }
    bssDropdown.classList.add('open');
  }

  bssInput.addEventListener('focus', function () { bssRenderDropdown(this.value); });
  bssInput.addEventListener('input', function () {
    bssInput.dataset.selected = '';
    bssSelectBook('', '');
    bssInput.value = this.value;
    bssRenderDropdown(this.value);
  });
  document.addEventListener('click', function (e) {
    if (!document.getElementById('book-search-select').contains(e.target)) {
      bssDropdown.classList.remove('open');
      if (bssInput.dataset.selected) {
        const book = getBooks().find(b => b.slug === bssInput.dataset.selected);
        if (book) bssInput.value = book.title;
      }
    }
  });
  bssClear.addEventListener('click', function () {
    bssInput.dataset.selected = '';
    bssInput.value = '';
    bssClear.style.display = 'none';
    bssSelectBook('', '');
  });
  bssClear.style.display = 'none';

  function renderChapterBookSelect() {
    const slug = bssInput.dataset.selected;
    if (slug && !getBooks().find(b => b.slug === slug)) {
      bssInput.dataset.selected = '';
      bssInput.value = '';
      bssClear.style.display = 'none';
      activeChapterSlug = null;
      document.getElementById('addChapterBtn').disabled = true;
    }
    if (bssDropdown.classList.contains('open')) bssRenderDropdown(bssInput.value);
  }

  const CH_PAGE_SIZE = 20;
  let chapterPage = 1;
  let chapterQuery = '';

  function renderChapterList(slug, opts) {
    if (opts && opts.page) chapterPage = opts.page;
    if (opts && opts.query !== undefined) chapterQuery = opts.query;

    const allChapters = getChapters(slug);
    const wrap = document.getElementById('chapter-list-wrap');

    if (!allChapters.length) {
      wrap.innerHTML = '<div class="empty-msg">Chưa có chương nào. Nhấn "+ Thêm Chương".</div>';
      return;
    }

    const q = chapterQuery.trim().toLowerCase();
    const filtered = q
      ? allChapters.filter(c => String(c.ch).includes(q) || c.title.toLowerCase().includes(q))
      : allChapters;

    const totalPages = Math.ceil(filtered.length / CH_PAGE_SIZE) || 1;
    if (chapterPage > totalPages) chapterPage = totalPages;
    const start = (chapterPage - 1) * CH_PAGE_SIZE;
    const page = filtered.slice(start, start + CH_PAGE_SIZE);

    wrap.innerHTML = '';

    const searchBar = document.createElement('div');
    searchBar.className = 'ch-search-bar';
    searchBar.innerHTML = `
      <input type="text" class="ch-search-input" id="ch-search-input" placeholder="🔍 Tìm chương..." value="${chapterQuery}">
      <span class="ch-total-badge">${filtered.length} / ${allChapters.length} chương</span>
    `;
    wrap.appendChild(searchBar);

    document.getElementById('ch-search-input').addEventListener('input', function () {
      chapterPage = 1;
      renderChapterList(slug, { query: this.value });
    });

    if (!page.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-msg';
      empty.textContent = 'Không tìm thấy chương phù hợp.';
      wrap.appendChild(empty);
      return;
    }

    page.forEach(ch => {
      const item = document.createElement('div');
      item.className = 'chapter-list-item';
      item.innerHTML = `
        <div>
          <div class="ch-name">Chương ${ch.ch}: ${ch.title}</div>
        </div>
        <div class="table-actions">
          <button class="btn-icon" onclick="editChapter(${ch.ch})">✏️</button>
          <button class="btn-icon delete" onclick="removeChapter(${ch.ch})">🗑</button>
        </div>
      `;
      wrap.appendChild(item);
    });

    if (totalPages > 1) {
      const pag = document.createElement('div');
      pag.className = 'ch-pagination';

      const makeBtn = (label, page, disabled, active) => {
        const btn = document.createElement('button');
        btn.className = 'ch-page-btn' + (active ? ' active' : '');
        btn.textContent = label;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', () => renderChapterList(slug, { page }));
        return btn;
      };

      pag.appendChild(makeBtn('«', 1, chapterPage === 1, false));
      pag.appendChild(makeBtn('‹', chapterPage - 1, chapterPage === 1, false));
      let from = Math.max(1, chapterPage - 2);
      let to = Math.min(totalPages, from + 4);
      from = Math.max(1, to - 4);
      for (let p = from; p <= to; p++) pag.appendChild(makeBtn(p, p, false, p === chapterPage));
      pag.appendChild(makeBtn('›', chapterPage + 1, chapterPage === totalPages, false));
      pag.appendChild(makeBtn('»', totalPages, chapterPage === totalPages, false));

      const info = document.createElement('span');
      info.className = 'ch-page-info';
      info.textContent = `Trang ${chapterPage}/${totalPages}`;
      pag.appendChild(info);
      wrap.appendChild(pag);
    }
  }

  document.getElementById('addChapterBtn').addEventListener('click', async function () {
    if (!activeChapterSlug) return;
    editingChapter = null;
    document.getElementById('chapter-form-title').textContent = 'Thêm Chương Mới';
    document.getElementById('chapterForm').reset();
    const chs = getChapters(activeChapterSlug);
    document.getElementById('ch-num').value = chs.length ? chs[chs.length - 1].ch + 1 : 1;
    document.getElementById('chapter-form-card').style.display = '';
    document.getElementById('ch-title').focus();
  });

  document.getElementById('cancelChapterBtn').addEventListener('click', function () {
    document.getElementById('chapter-form-card').style.display = 'none';
  });

  window.editChapter = async function (chNum) {
    if (!activeChapterSlug) return;
    const full = await fetch('/api/chapters/' + encodeURIComponent(activeChapterSlug) + '/' + chNum,
      { headers: { 'x-auth-token': _token } }).then(r => r.json());
    if (full.error) return;
    editingChapter = chNum;
    document.getElementById('chapter-form-title').textContent = 'Chỉnh Sửa Chương ' + chNum;
    document.getElementById('ch-num').value = full.ch;
    document.getElementById('ch-title').value = full.title;
    document.getElementById('ch-content').value = full.content;
    document.getElementById('chapter-form-card').style.display = '';
    document.getElementById('ch-content').focus();
  };

  window.removeChapter = async function (chNum) {
    if (!activeChapterSlug || !confirm(`Xóa Chương ${chNum}?`)) return;
    await api('DELETE', '/api/chapters/' + encodeURIComponent(activeChapterSlug) + '/' + chNum);
    await loadChapters(activeChapterSlug);
    // Update book chapters count in cache
    const book = _books.find(b => b.slug === activeChapterSlug);
    if (book) book.chapters = getChapters(activeChapterSlug).length;
    renderChapterList(activeChapterSlug, { page: chapterPage, query: chapterQuery });
    showToast('Đã xóa chương!', 'error');
  };

  document.getElementById('chapterForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!activeChapterSlug) return;
    const ch = {
      ch: parseInt(document.getElementById('ch-num').value),
      title: document.getElementById('ch-title').value.trim(),
      content: document.getElementById('ch-content').value.trim(),
    };
    if (!ch.ch || !ch.title || !ch.content) return;
    await api('POST', '/api/chapters/' + encodeURIComponent(activeChapterSlug), ch);
    await loadChapters(activeChapterSlug);
    // Update book chapters count in cache
    const book = _books.find(b => b.slug === activeChapterSlug);
    if (book) book.chapters = getChapters(activeChapterSlug).length;
    renderChapterList(activeChapterSlug, { page: chapterPage, query: chapterQuery });
    document.getElementById('chapter-form-card').style.display = 'none';
    showToast('Đã lưu chương ' + ch.ch + '!');
  });

  // ===== CATEGORIES TAB =====
  let editingCatId = null;

  function renderCategories() {
    const cats = getCategories();
    const search = (document.getElementById('cat-search').value || '').toLowerCase();
    const container = document.getElementById('category-tree');
    const empty = document.getElementById('category-empty');

    container.querySelectorAll('.cat-row').forEach(el => el.remove());

    let filtered = search ? cats.filter(c => c.name.toLowerCase().includes(search)) : cats;
    if (!filtered.length) { empty.style.display = ''; return; }
    empty.style.display = 'none';

    const roots = filtered.filter(c => !c.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));
    const shownIds = new Set();
    roots.forEach(root => {
      shownIds.add(root.id);
      renderCatRow(container, root, false);
      filtered.filter(c => c.parent_id === root.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(child => { shownIds.add(child.id); renderCatRow(container, child, true); });
    });
    filtered.filter(c => !shownIds.has(c.id)).forEach(c => renderCatRow(container, c, false));
  }

  function renderCatRow(container, cat, isChild) {
    const books = getBooks();
    const bookCount = books.filter(b => (b.categoryIds || []).includes(cat.id)).length;
    const row = document.createElement('div');
    row.className = 'cat-row' + (isChild ? ' cat-child' : '');
    row.dataset.id = cat.id;
    row.innerHTML = `
      <div class="cat-row-left">
        ${isChild ? '<span class="cat-indent">└─</span>' : ''}
        <span class="cat-icon-badge">${cat.icon || '📁'}</span>
        <span class="cat-name-text">${cat.name}</span>
        ${!cat.parent_id ? `<span class="cat-home-badge ${cat.showOnHome ? 'on' : ''}">${cat.showOnHome ? '✅ Trang Chủ' : '⭕ Ẩn'}</span>` : ''}
        <span class="cat-count-badge">${bookCount} truyện</span>
      </div>
      <div class="table-actions">
        ${!cat.parent_id ? `<button class="btn-icon" onclick="toggleCatHome('${cat.id}')" title="Bật/Tắt hiển thị trang chủ">🏠</button>` : ''}
        <button class="btn-icon" onclick="editCategory('${cat.id}')">✏️</button>
        <button class="btn-icon delete" onclick="confirmDeleteCat('${cat.id}')">🗑</button>
      </div>
    `;
    container.appendChild(row);
  }

  window.toggleCatHome = async function (id) {
    const cat = getCategories().find(c => c.id === id);
    if (!cat || cat.parent_id) return;
    const updated = await api('PUT', '/api/categories/' + id, { showOnHome: !cat.showOnHome });
    Object.assign(cat, updated);
    renderCategories();
    showToast(cat.showOnHome ? 'Đã bật hiển thị trang chủ!' : 'Đã tắt hiển thị trang chủ!');
  };

  document.getElementById('cat-search').addEventListener('input', renderCategories);

  document.getElementById('addCategoryBtn').addEventListener('click', function () {
    editingCatId = null;
    document.getElementById('cat-modal-title').textContent = 'Thêm Danh Mục Mới';
    document.getElementById('categoryForm').reset();
    document.getElementById('cat-edit-id').value = '';
    populateCatParentSelect(null, null);
    openModal('categoryModal');
  });

  window.editCategory = function (id) {
    const cat = getCategories().find(c => c.id === id);
    if (!cat) return;
    editingCatId = id;
    document.getElementById('cat-modal-title').textContent = 'Chỉnh Sửa Danh Mục';
    document.getElementById('cat-edit-id').value = id;
    document.getElementById('cat-icon').value = cat.icon || '';
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-show-home').checked = !!cat.showOnHome;
    populateCatParentSelect(id, cat.parent_id);
    openModal('categoryModal');
  };

  function populateCatParentSelect(editingId, selectedParentId) {
    const select = document.getElementById('cat-parent');
    const cats = getCategories().filter(c => !c.parent_id && c.id !== editingId);
    select.innerHTML = '<option value="">— Không có (danh mục gốc) —</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = (c.icon || '') + ' ' + c.name;
      if (c.id === selectedParentId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  document.getElementById('categoryForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    if (!name) return;
    const parentId = document.getElementById('cat-parent').value || null;
    const data = {
      name,
      icon: document.getElementById('cat-icon').value.trim() || '📁',
      parent_id: parentId,
      showOnHome: parentId ? false : document.getElementById('cat-show-home').checked,
      order: 0,
    };

    if (editingCatId) {
      const updated = await api('PUT', '/api/categories/' + editingCatId, data);
      const idx = _categories.findIndex(c => c.id === editingCatId);
      if (idx !== -1) _categories[idx] = updated;
    } else {
      const created = await api('POST', '/api/categories', data);
      _categories.push(created);
    }
    closeModal('categoryModal');
    renderCategories();
    showToast(editingCatId ? 'Đã cập nhật danh mục!' : 'Đã thêm danh mục mới!');
  });

  document.getElementById('catModalClose').addEventListener('click', () => closeModal('categoryModal'));
  document.getElementById('cancelCatModal').addEventListener('click', () => closeModal('categoryModal'));

  // ===== SETTINGS TAB =====
  document.getElementById('changePassForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const newUser = document.getElementById('cur-user').value.trim();
    const newPass = document.getElementById('new-pass').value;
    const confirm = document.getElementById('confirm-pass').value;
    const msg = document.getElementById('pass-msg');

    if (!newUser) { msg.className = 'form-msg error'; msg.textContent = 'Vui lòng nhập tên đăng nhập.'; return; }
    if (newPass.length < 6) { msg.className = 'form-msg error'; msg.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.'; return; }
    if (newPass !== confirm) { msg.className = 'form-msg error'; msg.textContent = 'Mật khẩu xác nhận không khớp.'; return; }

    const result = await api('POST', '/api/settings/password', { user: newUser, pass: newPass });
    if (result.ok) {
      sessionStorage.setItem('admin-user', newUser);
      document.getElementById('user-badge').textContent = '👤 ' + newUser;
      msg.className = 'form-msg success';
      msg.textContent = '✅ Đã cập nhật thông tin đăng nhập!';
      this.reset();
    } else {
      msg.className = 'form-msg error';
      msg.textContent = '❌ ' + (result.error || 'Lỗi không xác định');
    }
  });

  // ===== EXPORT / IMPORT =====
  window.exportData = async function () {
    const data = await api('GET', '/api/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webtruyen-data-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu!');
  };

  window.importData = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
        const result = await api('POST', '/api/import', data);
        await loadBooks();
        await loadCategories();
        showToast('Đã nhập ' + result.addedBooks + ' truyện!');
        renderOverview();
        renderBooks();
      } catch {
        alert('File không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  window.seedSampleData = async function () {
    const SAMPLE = [
      { title:'Đấu Phá Thương Khung',author:'Thiên Tằm Thổ Đậu',genres:'Tiên Hiệp, Huyền Huyễn, Hành Động',chapters:1648,status:'complete',rating:4.8,img:'https://static.truyenfull.vision/cover/o/eJzLyTDT1y1Mcw2M0C0IMAvL1g9z8nUxMYwyD3Tz1HeEgmwfR_0SAzefTKOgCI8MC_1yI0NT3QxjIyMANhQRaQ==/truyen-dau-pha-thuong-khung.jpg',desc:'Thất tộc danh gia, Đấu Khí đại lục, nơi mạnh là vua...'},
      { title:'Phàm Nhân Tu Tiên',author:'Vong Ngữ',genres:'Tiên Hiệp, Tu Tiên, Phàm Nhân',chapters:2000,status:'complete',rating:4.9,img:'https://static.truyenfull.vision/cover/o/eJzLyTDT17WITwqMNNQtNKp01A_zNXY1ifQuc8301HeEghwTR_1IV8PsTO-w4HKTUL1yI0NT3QxjIyMANRgRnA==/pham-nhan-tu-tien.jpg',desc:'Hàn Lập — một cậu bé xuất thân bần hàn...'},
      { title:'Đấu La Đại Lục',author:'Đường Gia Tam Thiếu',genres:'Tiên Hiệp, Huyền Huyễn, Thiếu Niên',chapters:3000,status:'complete',rating:4.7,img:'https://static.truyenfull.vision/cover/o/eJzLyTDR180LKc8Kjw9w9kly1Q9z8nUxyTQ3Ms721HeEgmxvC_3MsEKLgJLCxIqIcv1yI0NT3QxjIyMAUTMSjA==/dau-la-dai-luc-230420.jpg',desc:'Đường Tam — thiên tài chế tạo ám khí...'},
      { title:'Toàn Chức Pháp Sư',author:'Loạn',genres:'Huyền Huyễn, Ma Pháp, Học Đường',chapters:1234,status:'complete',rating:4.6,img:'https://static.truyenfull.vision/cover/eJzLyTDWT8-NCPApLc5Kt4yK8KwwijQK9XIrLXVLzjKMdC0PdDZzjfIr9PKtSjGOSolwdbTICnBJtvB0DfPyKnYOywnIzzHLCc3IyDStdDJLcw8oCvHKMwu1LTcyNNXNMDYyAgAxnB91/toan-chuc-phap-su.jpg',desc:'Mặc Phàm — học sinh tầm thường...'},
      { title:'Đế Bá',author:'Vô Nhân',genres:'Huyền Huyễn, Hành Động, Mạnh Mẽ',chapters:1200,status:'ongoing',rating:4.5,img:'https://static.truyenfull.vision/cover/o/eJzLyTDR193KzSo2TCpOCXKJ1A8LKEiucHN3yor31HeEglzXZP0qM-fg-IA8QxODQP1yI0NT3QxjIyMAbfcSoQ==/de-ba.jpg',desc:'Một thanh niên bình thường xuyên không sang thế giới huyền huyễn...'},
      { title:'Võ Luyện Đỉnh Phong',author:'Thiên Hạ Bá Xướng',genres:'Kiếm Hiệp, Hành Động, Võ Hiệp',chapters:3456,status:'ongoing',rating:4.6,img:null,desc:'Dương Khai — một thiếu niên bình thường...'},
      { title:'Thần Đạo Đế Tôn',author:'Cự Tinh Linh',genres:'Huyền Huyễn, Tiên Hiệp, Mạnh Mẽ',chapters:890,status:'ongoing',rating:4.4,img:null,desc:'Con đường tu thần bắt đầu từ phế nhân...'},
      { title:'Long Vương Truyền Thuyết',author:'Mộng Nhập Thần Cơ',genres:'Huyền Huyễn, Phiêu Lưu, Dị Năng',chapters:567,status:'ongoing',rating:4.3,img:null,desc:'Thiếu niên mang huyết mạch Long Vương...'},
      { title:'Kiếm Lai',author:'Phong Hỏa Hý Chư Hầu',genres:'Kiếm Hiệp, Tu Tiên, Hành Động',chapters:789,status:'ongoing',rating:4.5,img:null,desc:'Trần Bình An — cậu bé đến từ vùng đất nhỏ bé...'},
      { title:'Lão Gia Thế Gia',author:'Ngã Thị Tiểu Thất',genres:'Đô Thị, Hiện Đại, Hài Hước',chapters:432,status:'ongoing',rating:4.2,img:null,desc:'Hào môn thế gia, tranh đấu quyền lực...'},
    ];

    const existingSlugs = new Set(getBooks().map(b => b.slug));
    function toSlugLocal(str) {
      return str.replace(/đ/g,'d').replace(/Đ/g,'D').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    }
    let addedBooks = 0;
    for (const data of SAMPLE) {
      const slug = toSlugLocal(data.title);
      if (!existingSlugs.has(slug)) {
        const created = await api('POST', '/api/books', { ...data, categoryIds: [] });
        _books.unshift(created);
        addedBooks++;
      }
    }

    if (addedBooks > 0) {
      showToast('Đã nạp ' + addedBooks + ' truyện mẫu!');
    } else {
      showToast('Tất cả dữ liệu mẫu đã tồn tại rồi!', 'error');
    }
    renderOverview();
    renderBooks();
  };

  window.clearAllData = async function () {
    if (!confirm('Xóa TOÀN BỘ sách, chương và danh mục? Không thể hoàn tác!')) return;
    const books = getBooks();
    for (const b of books) {
      await api('DELETE', '/api/books/' + b.id);
    }
    const cats = getCategories();
    for (const c of cats) {
      await api('DELETE', '/api/categories/' + c.id);
    }
    await loadBooks();
    await loadCategories();
    renderOverview();
    renderBooks();
    showToast('Đã xóa toàn bộ dữ liệu!', 'error');
  };

  // ===== MODAL =====
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  document.getElementById('modalClose').addEventListener('click', () => closeModal('bookModal'));
  document.getElementById('cancelModal').addEventListener('click', () => closeModal('bookModal'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal(this.id);
    });
  });

  // ===== TOAST =====
  function showToast(msg, type) {
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;color:#fff;font-size:14px;font-weight:600;z-index:9999;transition:opacity 0.3s;box-shadow:0 4px 16px rgba(0,0,0,0.2)';
      document.body.appendChild(t);
    }
    t.style.background = type === 'error' ? '#e84242' : '#2ecc71';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
  }

  // ===== INIT =====
  Promise.all([loadBooks(), loadCategories()]).then(() => {
    renderOverview();
    renderBooks();
  });
})();
