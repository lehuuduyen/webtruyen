(function () {
  'use strict';

  const COVERS = [
    ['#667eea','#764ba2'],['#f093fb','#f5576c'],['#4facfe','#00f2fe'],['#43e97b','#38f9d7'],
    ['#fa709a','#fee140'],['#a18cd1','#fbc2eb'],['#fda085','#f6d365'],['#89f7fe','#66a6ff'],
    ['#f7971e','#ffd200'],['#30cfd0','#667eea'],['#f77062','#fe5196'],['#c471f5','#fa71cd'],
    ['#11998e','#38ef7d'],['#4e54c8','#8f94fb'],['#ee0979','#ff6a00'],['#fc4a1a','#f7b733'],
  ];

  function gradient(i) {
    const [a, b] = COVERS[Math.abs(i) % COVERS.length];
    return `linear-gradient(145deg, ${a}, ${b})`;
  }

  function toSlug(str) {
    return str.replace(/đ/g,'d').replace(/Đ/g,'D')
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  // Book pool grouped by genre keyword
  const POOL = {
    action: [
      { title:'Đấu Phá Thương Khung', author:'Thiên Tằm', ch:1648 },
      { title:'Phàm Nhân Tu Tiên', author:'Vong Ngữ', ch:2000 },
      { title:'Vĩnh Hằng Thánh Vương', author:'Tế Yêu', ch:1234 },
      { title:'Vạn Cổ Thần Đế', author:'Nhất Niệm Vĩnh Hằng', ch:1567 },
      { title:'Luyện Khí Kỳ Lão Tổ', author:'Mộ Thần', ch:789 },
      { title:'Bất Diệt Kim Thân', author:'Thiên Hạ Bá', ch:934 },
      { title:'Đấu La Đại Lục', author:'Đường Gia Tam Thiếu', ch:3000 },
      { title:'Toàn Chức Pháp Sư', author:'Loạn', ch:1234 },
      { title:'Đế Bá', author:'Vô Nhân', ch:1200 },
      { title:'Long Vương Truyền Thuyết', author:'Mộng Nhập', ch:567 },
      { title:'Vũ Động Càn Khôn', author:'Thiên Tằm', ch:890 },
      { title:'Thần Mộ', author:'Trần Đông', ch:1023 },
    ],
    romance: [
      { title:'Tổng Tài Yêu Dại', author:'Mộng Tiểu Tiểu', ch:234 },
      { title:'Hợp Đồng Hôn Nhân', author:'Tình Ca', ch:567 },
      { title:'CEO Pháo Thủ', author:'Hoa Tuyết', ch:789 },
      { title:'Em Là Của Anh', author:'Ngọt Ngào', ch:890 },
      { title:'Anh Không Thể Thiếu Em', author:'Mãi Bên Nhau', ch:456 },
      { title:'Ngọt Đến Tan Chảy', author:'Tình Yêu', ch:111 },
      { title:'Lãnh Quân Sủng Ái', author:'Yêu Thương', ch:345 },
      { title:'Ác Nữ Tu Tiên', author:'Nữ Cường', ch:310 },
      { title:'Hương Thầm', author:'Cổ Mạn', ch:188 },
      { title:'Tình Như Mây Khói', author:'Phong Vân', ch:234 },
      { title:'Trọng Sinh Yêu Lại', author:'Tân Tác', ch:178 },
      { title:'Boss Yêu Mãnh Liệt', author:'Ngọt Bùi', ch:290 },
    ],
    scifi: [
      { title:'Xuyên Không 2030', author:'Khoa Học Gia', ch:456 },
      { title:'Chinh Phục Vũ Trụ', author:'Vũ Trụ Du Hành', ch:789 },
      { title:'AI Thống Trị Thế Giới', author:'Robot Số 7', ch:234 },
      { title:'Cỗ Máy Thời Gian', author:'Văn Minh Cổ Đại', ch:123 },
      { title:'Sao Hỏa 2099', author:'Tinh Cầu', ch:345 },
      { title:'Siêu Máy Tính Thần', author:'Kỹ Sư', ch:890 },
      { title:'Du Hành Thời Gian', author:'Hacker', ch:267 },
      { title:'Kỷ Nguyên Số', author:'Thiên Tài Số', ch:445 },
    ],
    history: [
      { title:'Hoàng Triều Chi Mộng', author:'Sử Quan', ch:567 },
      { title:'Tam Quốc Diễn Nghĩa 2.0', author:'La Quán Trung', ch:1234 },
      { title:'Đường Triều Thịnh Thế', author:'Huyền Huyễn Sử', ch:456 },
      { title:'Tây Sơn Phong Vân', author:'Nam Sử', ch:678 },
      { title:'Chiến Quốc Phong Vân', author:'Lịch Sử Hào Kiệt', ch:789 },
      { title:'Thanh Cung Bí Sử', author:'Cung Đình Ký', ch:678 },
      { title:'Hán Triều Phong Vân', author:'Kiếm Điêu Lưu', ch:890 },
      { title:'Đinh Tiên Hoàng Đế', author:'Việt Sử', ch:445 },
    ],
  };

  // Detect genre from slug keywords
  function detectGenre(slug) {
    const romanceKw = ['tinh','hon','nhan','vo','ba','ngot','lang-man','yeu','co-vo'];
    const scifiKw = ['khoa','robot','ai-','vutruc','vut-ru','xuyen-khong','may-tinh','nano'];
    const historyKw = ['lich-su','trieu','cung','hoang','han','tong','tang','chien-quoc'];
    const s = slug.toLowerCase();
    if (romanceKw.some(k => s.includes(k))) return 'romance';
    if (scifiKw.some(k => s.includes(k))) return 'scifi';
    if (historyKw.some(k => s.includes(k))) return 'history';
    return 'action';
  }

  window.renderSimilarBooks = function (containerId, currentSlug, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;
    opts = opts || {};
    const limit = opts.limit || 6;

    const genre = opts.genre || detectGenre(currentSlug);
    const pool = POOL[genre] || POOL.action;

    // pick books, exclude current, fill from action if needed
    let candidates = pool.filter(b => toSlug(b.title) !== currentSlug);
    if (candidates.length < limit) {
      const extra = POOL.action.filter(b => toSlug(b.title) !== currentSlug && !candidates.find(c => c.title === b.title));
      candidates = candidates.concat(extra);
    }
    const books = candidates.slice(0, limit);

    el.innerHTML = '';
    books.forEach((book, i) => {
      const slug = toSlug(book.title);
      const card = document.createElement('a');
      card.href = 'book.html?slug=' + encodeURIComponent(slug);
      card.className = 'similar-card';
      card.innerHTML = `
        <div class="similar-cover" style="background:${gradient(i + currentSlug.length)}">
          <span class="similar-ch">Ch.${book.ch}</span>
        </div>
        <div class="similar-title">${book.title}</div>
        <div class="similar-author">${book.author}</div>
      `;
      el.appendChild(card);
    });
  };
})();
