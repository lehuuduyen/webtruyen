(function () {
  'use strict';

  // --- Genre definitions ---
  const GENRES = {
    'tien-hiep': {
      name: 'Tiên Hiệp', icon: '⚡', color: '#667eea',
      desc: 'Thế giới tu tiên huyền bí, nơi con người luyện khí, đột phá cảnh giới và vươn tới trường sinh bất lão.',
    },
    'kiem-hiep': {
      name: 'Kiếm Hiệp', icon: '⚔️', color: '#f5576c',
      desc: 'Giang hồ hiểm ác, anh hùng tung hoành, kiếm pháp thần diệu và nghĩa khí ngút trời.',
    },
    'huyen-huyen': {
      name: 'Huyền Huyễn', icon: '🌟', color: '#a18cd1',
      desc: 'Thế giới kỳ ảo với phép thuật, dị thú, hệ thống tu luyện độc đáo và vô vàn bí ẩn.',
    },
    'do-thi': {
      name: 'Đô Thị', icon: '🏙️', color: '#30cfd0',
      desc: 'Đô thị hiện đại với những nhân vật bình thường vươn lên đỉnh cao bằng trí tuệ và cơ duyên.',
    },
    'ngon-tinh': {
      name: 'Ngôn Tình', icon: '💕', color: '#f093fb',
      desc: 'Tình yêu lãng mạn ngọt ngào, những mối duyên số éo le và những rung động chân thật.',
    },
    'khoa-huyen': {
      name: 'Khoa Huyễn', icon: '🚀', color: '#4facfe',
      desc: 'Tương lai khoa học viễn tưởng, du hành vũ trụ, trí tuệ nhân tạo và thế giới công nghệ cao.',
    },
    'lich-su': {
      name: 'Lịch Sử', icon: '📜', color: '#f7971e',
      desc: 'Tái hiện các triều đại lịch sử hào hùng, mưu kế cung đình và những nhân vật kiệt xuất.',
    },
    'di-gioi': {
      name: 'Dị Giới', icon: '🐉', color: '#43e97b',
      desc: 'Xuyên không, chuyển sinh sang thế giới khác với phép thuật, quái vật và những cuộc phiêu lưu kỳ thú.',
    },
    'hoan-thanh': {
      name: 'Hoàn Thành', icon: '✅', color: '#11998e',
      desc: 'Những bộ truyện đã hoàn thành, đọc một lần trọn vẹn không cần chờ đợi cập nhật.',
    },
  };

  const ALL_GENRES = Object.entries(GENRES).map(([slug, info]) => ({ slug, ...info }));

  // --- Book title pools per genre ---
  const TITLE_POOL = {
    'tien-hiep': [
      'Đấu Phá Thương Khung','Phàm Nhân Tu Tiên','Vĩnh Hằng Thánh Vương','Tu Chân Thế Giới',
      'Vạn Cổ Thần Đế','Luyện Khí Kỳ Lão Tổ','Cửu Tinh Thiên Thần Quyết','Siêu Cấp Thần Thánh',
      'Vô Thượng Thần Tông','Tiên Đạo Chi Tâm','Thiên Đạo Đồ','Huyền Thiên Chi Chủ',
      'Bất Diệt Kim Thân','Thái Cổ Thần Vương','Tiên Cung Bí Ký','Linh Khí Phục Tô',
      'Nguyên Thủy Pháp Tắc','Chư Thiên Vạn Giới','Đại Đạo Triều Thiên','Thiên Tầng Thần Tháp',
      'Lôi Thần Chi Thể','Hỗn Độn Tiên Đế','Nhất Niệm Vĩnh Hằng','Thần Đạo Đế Tôn',
    ],
    'kiem-hiep': [
      'Võ Luyện Đỉnh Phong','Kiếm Đạo Độc Tôn','Hoa Sơn Chân Truyền','Thiên Kiếm Thánh Tông',
      'Lục Mạch Thần Kiếm','Tiếu Ngạo Giang Hồ','Thần Điêu Hiệp Lữ','Xạ Điêu Anh Hùng',
      'Thiên Long Bát Bộ','Vô Tình Kiếm Đạo','Kiếm Lai','Trọng Sinh Chi Kiếm Vương',
      'Tuyệt Thế Đường Môn','Nhất Kiếm Độc Tôn','Giang Hồ Kỳ Hiệp','Cổ Mộ Quái Khách',
      'Bạch Y Phong Hầu','Phong Vân Thiên Hạ','Long Hổ Phong Vân','Huyết Kiếm Tung Hoành',
      'Thiên Hạ Vô Song','Kiếm Tiên Hành','Thái Cực Quyền Kinh','Độc Cô Cầu Bại Truyện',
    ],
    'huyen-huyen': [
      'Đế Bá','Long Vương Truyền Thuyết','Ma Hoàng Thiên Hạ','Thần Khư Bá Thể',
      'Cực Phẩm Thần Ý','Tinh Thần Biến','Vĩnh Sinh','Đấu La Đại Lục',
      'Dư Hoàng','Thần Mộ','Vũ Động Càn Khôn','Đại Chủ Tể',
      'Linh Vũ Đại Lục','Huyền Giới Chi Môn','Cổ Thần Hiển Thế','Ma Thiên Ký',
      'Thần Hoàng','Đế Thú Tiến Hóa','Kiếm Thần Chi Lộ','Vạn Thế Thần Vương',
      'Nghịch Thiên Tà Thần','Bá Đạo Đan Thần','Thiên Thần Quyết','Phong Bạo Ma Pháp Sư',
    ],
    'do-thi': [
      'Đô Thị Chí Tôn','Vô Địch Học Bá','Thiên Tài Bác Sĩ Đô Thị','Hệ Thống Siêu Nhân',
      'Bác Sĩ Thần Kỳ','Thần Y Đô Thị','Vạn Năng Đặc Vụ','Học Bá Hệ Thống',
      'Tỷ Phú Khởi Nghiệp','Siêu Cấp Binh Vương','Đô Thị Dị Năng','Trùng Sinh Đô Thị',
      'Cực Phẩm Lão Công','Vô Lại Học Bá','Ẩn Hôn Thiên Giới','Đô Thị Thần Hoàng',
      'Trọng Sinh Thần Thám','Toàn Năng Cao Thủ','Đô Thị Siêu Cấp','Bạch Cốt Đại Thánh',
      'Từ Ăn Vặt Lên Đỉnh','Thiên Tài Kỹ Thuật','CEO Huyền Thoại','Thần Nhãn Đô Thị',
    ],
    'ngon-tinh': [
      'Tổng Tài Yêu Dại','Hợp Đồng Hôn Nhân','CEO Pháo Thủ','Em Là Của Anh',
      'Tình Địch Là Boss','Anh Không Thể Thiếu Em','Ngọt Đến Tan Chảy','Nhân Vật Phụ Lên Ngôi',
      'Tình Yêu Sau Mưa','Boss Yêu Mãnh Liệt','Hương Thầm','Tình Như Mây Khói',
      'Cô Vợ Hoàng Gia','Lãnh Quân Sủng Ái','Ác Nữ Tu Tiên','Bướng Bỉnh Yêu Anh',
      'Tình Yêu Trong Sáng','Thiên Kim Trọng Sinh','Hệ Thống Gả Chồng','Xuân Phong Ngàn Dặm',
      'Đêm Trường Vô Tận','Gió Đưa Hoa Rụng','Ngàn Dặm Tương Tư','Trọng Sinh Yêu Lại',
    ],
    'khoa-huyen': [
      'Xuyên Không 2030','AI Thống Trị Thế Giới','Chinh Phục Vũ Trụ','Cỗ Máy Thời Gian',
      'Sao Hỏa 2099','Tế Bào Năng Lượng','Siêu Máy Tính Thần','Vũ Trụ Tận Cùng',
      'Nano Robot','Hành Tinh Bí Ẩn','Du Hành Thời Gian','Thế Giới Ảo',
      'Thực Tại Song Song','Biến Đổi Gen','Chiến Tranh Thiên Hà','Đế Chế Người Máy',
      'Mặt Trời Nhân Tạo','Tâm Thần Liên Kết','Trái Đất 2.0','Kỷ Nguyên Số',
      'Hacker Thiên Tài','Vũ Khí Tối Thượng','Não Bộ Ngoài Hành Tinh','Cậu Bé Thiên Tài',
    ],
    'lich-su': [
      'Hoàng Triều Chi Mộng','Hán Triều Phong Vân','Tam Quốc Diễn Nghĩa 2.0','Đường Triều Thịnh Thế',
      'Minh Triều Công Thần','Thanh Cung Bí Sử','Tống Vương Triều','Chiến Quốc Phong Vân',
      'Lưỡng Hán Phong Vân','Đại Đường Song Long','Hán Thư Mật Mã','Cung Đình Bí Sử',
      'Vua Lê Chúa Trịnh','Thời Trần Hào Kiệt','Tây Sơn Phong Vân','Nam Quốc Sơn Hà',
      'Bí Sử Nhà Nguyễn','Triều Lý Hưng Vong','Đinh Tiên Hoàng Đế','Lê Lợi Khởi Nghĩa',
      'Huyết Chiến Đống Đa','Nguyễn Trãi Ký','Trần Quốc Tuấn','Trưng Vương Khởi Nghĩa',
    ],
    'di-gioi': [
      'Dị Thế Tà Quân','Trọng Sinh Không Gian','Xuyên Không Làm Hoàng Phi','Dị Giới Thần Y',
      'Thế Giới Khác','Không Gian Dị Năng','Xuyên Thành Phản Diện','Hệ Thống Trọng Sinh',
      'Bá Vương Học Đường','Dị Thế Siêu Tế','Xuyên Vào Tiểu Thuyết','Làm Nữ Phụ Thế Nào',
      'Trọng Sinh Vương Phi','Xuyên Thành Nữ Phụ','Dị Thế Lưu Manh','Không Gian Trang Trại',
      'Xuyên Không Nông Nghiệp','Làm Hoàng Hậu Không Dễ','Bí Ẩn Không Gian','Dị Giới Nông Phu',
      'Thực Vật Ma Pháp','Xuyên Về Cổ Đại','Mang Theo Hệ Thống','Nông Trại Không Gian',
    ],
    'hoan-thanh': [
      'Đấu La Đại Lục (Full)','Phàm Nhân Tu Tiên (Full)','Đấu Phá Thương Khung (Full)','Thần Điêu Hiệp Lữ (Full)',
      'Xạ Điêu Anh Hùng (Full)','Thiên Long Bát Bộ (Full)','Lộc Đỉnh Ký (Full)','Tiếu Ngạo Giang Hồ (Full)',
      'Vũ Động Càn Khôn (Full)','Thần Mộ (Full)','Đại Chủ Tể (Full)','Dư Hoàng (Full)',
      'Vĩnh Sinh (Full)','Tinh Thần Biến (Full)','Toàn Chức Pháp Sư (Full)','Đế Bá (Full)',
      'Long Vương Truyền Thuyết (Full)','Hợp Đồng Hôn Nhân (Full)','Tổng Tài Yêu Dại (Full)','CEO Pháo Thủ (Full)',
      'Tam Quốc Diễn Nghĩa 2.0 (Full)','Chiến Quốc Phong Vân (Full)','Dị Thế Tà Quân (Full)','Kiếm Lai (Full)',
    ],
  };

  const AUTHORS = [
    'Thiên Tằm Thổ Đậu','Vong Ngữ','Đường Gia Tam Thiếu','Nhất Niệm Vĩnh Hằng',
    'Nhĩ Căn','Lão Hổ','Kim Dung','Cổ Long','Ngọa Long Sinh','Tư Mã Linh',
    'Trần Đông','Đường Giáp','Thần Dã Chu Sinh','Loạn','Tế Yêu','Mặc Thổ Phi Hương',
    'Tịch Tịch Lương','Mộng Tiểu Tiểu','Hoa Tuyết','Tình Ca','Phong Vân',
  ];

  const COVERS = [
    ['#667eea','#764ba2'],['#f093fb','#f5576c'],['#4facfe','#00f2fe'],['#43e97b','#38f9d7'],
    ['#fa709a','#fee140'],['#a18cd1','#fbc2eb'],['#fda085','#f6d365'],['#89f7fe','#66a6ff'],
    ['#f7971e','#ffd200'],['#96fbc4','#f9f586'],['#ff9a9e','#fad0c4'],['#a1c4fd','#c2e9fb'],
    ['#d4fc79','#96e6a1'],['#30cfd0','#667eea'],['#f77062','#fe5196'],['#c471f5','#fa71cd'],
    ['#11998e','#38ef7d'],['#fc4a1a','#f7b733'],['#4e54c8','#8f94fb'],['#ee0979','#ff6a00'],
  ];

  function coverGradient(i) {
    const [a, b] = COVERS[i % COVERS.length];
    return `linear-gradient(145deg, ${a} 0%, ${b} 100%)`;
  }

  function hashInt(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function toSlug(str) {
    return str
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Build book list for a genre
  function buildBooks(genreSlug) {
    const titles = TITLE_POOL[genreSlug] || [];
    return titles.map((title, i) => {
      const h = hashInt(title);
      return {
        title,
        slug: toSlug(title),
        author: AUTHORS[h % AUTHORS.length],
        chapter: 50 + (h % 2950),
        status: i % 4 === 0 ? 'complete' : 'ongoing',
        views: (0.5 + (h % 200) / 10).toFixed(1),
        badge: i % 5 === 0 ? 'hot' : i % 7 === 0 ? 'new' : i % 11 === 0 ? 'full' : '',
        colorIdx: i,
      };
    });
  }

  // --- Parse URL ---
  const params = new URLSearchParams(location.search);
  const genreSlug = params.get('slug') || 'tien-hiep';
  const genre = GENRES[genreSlug] || GENRES['tien-hiep'];

  const PER_PAGE = 20;
  let currentPage = parseInt(params.get('page')) || 1;
  let currentFilter = 'all';
  let currentSort = 'hot';

  let allBooks = buildBooks(genreSlug);

  // Update page meta + SEO
  document.title = genre.name + ' - WebTruyện';
  const metaDesc = 'Đọc truyện ' + genre.name + ' hay nhất tại WebTruyện. ' + genre.desc;
  document.getElementById('meta-desc') && (document.getElementById('meta-desc').content = metaDesc);
  document.getElementById('og-title') && (document.getElementById('og-title').content = genre.name + ' - WebTruyện');
  document.getElementById('og-desc') && (document.getElementById('og-desc').content = metaDesc);
  document.getElementById('genre-icon').textContent = genre.icon;
  document.getElementById('genre-title').textContent = genre.name;
  document.getElementById('genre-desc').textContent = genre.desc;
  document.getElementById('breadcrumb-name').textContent = genre.name;

  // Hero color
  const hero = document.getElementById('genre-hero');
  hero.style.background = `linear-gradient(135deg, #2c1a0e 0%, ${genre.color}99 60%, ${genre.color} 100%)`;

  // Stats
  const total = allBooks.length;
  const ongoing = allBooks.filter(b => b.status === 'ongoing').length;
  const complete = allBooks.filter(b => b.status === 'complete').length;
  document.getElementById('stat-total').textContent = total + '+';
  document.getElementById('stat-ongoing').textContent = ongoing;
  document.getElementById('stat-complete').textContent = complete;

  // Filter + sort + render
  function getFiltered() {
    let books = [...allBooks];
    if (currentFilter === 'ongoing') books = books.filter(b => b.status === 'ongoing');
    if (currentFilter === 'complete') books = books.filter(b => b.status === 'complete');
    if (currentSort === 'chapter') books.sort((a, b) => b.chapter - a.chapter);
    if (currentSort === 'new') books.reverse();
    return books;
  }

  function renderGrid() {
    const filtered = getFiltered();
    const total = filtered.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    currentPage = Math.min(currentPage, Math.max(1, totalPages));
    const start = (currentPage - 1) * PER_PAGE;
    const pageBooks = filtered.slice(start, start + PER_PAGE);

    const grid = document.getElementById('genre-book-grid');
    grid.innerHTML = '';

    pageBooks.forEach((book, i) => {
      const card = document.createElement('div');
      card.className = 'genre-book-card';
      const gradient = coverGradient(book.colorIdx);
      const badgeHtml = book.badge
        ? `<div class="genre-cover-badge ${book.badge}">${{hot:'HOT',new:'MỚI',full:'FULL'}[book.badge]}</div>`
        : '';
      const statusLabel = book.status === 'complete' ? 'Hoàn thành' : 'Đang ra';
      card.innerHTML = `
        <a href="book.html?slug=${encodeURIComponent(book.slug)}">
          <div class="genre-book-cover">
            <div class="genre-cover-bg" style="background:${gradient}"></div>
            ${badgeHtml}
            <div class="genre-cover-chapter">Ch.${book.chapter}</div>
          </div>
        </a>
        <div class="genre-book-info">
          <a class="genre-book-title" href="book.html?slug=${encodeURIComponent(book.slug)}">${book.title}</a>
          <div class="genre-book-author">${book.author}</div>
          <span class="genre-book-status ${book.status}">${statusLabel}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const pag = document.getElementById('pagination');
    pag.innerHTML = '';
    if (totalPages <= 1) return;

    const addBtn = (label, page, disabled, active) => {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (active ? ' active' : '');
      btn.textContent = label;
      btn.disabled = disabled;
      btn.addEventListener('click', () => { currentPage = page; renderGrid(); window.scrollTo(0, 0); });
      pag.appendChild(btn);
    };

    addBtn('«', 1, currentPage === 1, false);
    addBtn('‹', currentPage - 1, currentPage === 1, false);

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) addBtn(i, i, false, i === currentPage);

    addBtn('›', currentPage + 1, currentPage === totalPages, false);
    addBtn('»', totalPages, currentPage === totalPages, false);
  }

  renderGrid();

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      currentPage = 1;
      renderGrid();
    });
  });

  // Sort select
  document.getElementById('sort-select').addEventListener('change', function () {
    currentSort = this.value;
    currentPage = 1;
    renderGrid();
  });

  // --- Sidebar: other genres ---
  const tagList = document.getElementById('genre-tag-list');
  ALL_GENRES.forEach(g => {
    const a = document.createElement('a');
    a.href = 'genre.html?slug=' + g.slug;
    a.className = 'genre-tag-link' + (g.slug === genreSlug ? ' active-genre' : '');
    a.textContent = g.icon + ' ' + g.name;
    tagList.appendChild(a);
  });

  // --- Sidebar: top list (pick from current genre books) ---
  const topList = document.getElementById('sidebar-top-list');
  allBooks.slice(0, 8).forEach((book, i) => {
    const li = document.createElement('li');
    const rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
    li.innerHTML = `
      <span class="sidebar-top-rank ${rankClass}">${i + 1}</span>
      <a href="book.html?slug=${encodeURIComponent(book.slug)}">${book.title}</a>
    `;
    topList.appendChild(li);
  });

  // --- Mini search ---
  window.miniSearch = function () {
    const q = document.getElementById('miniSearchInput').value.trim();
    if (q) location.href = 'index.html?q=' + encodeURIComponent(q);
  };
  document.getElementById('miniSearchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') window.miniSearch();
  });
})();
