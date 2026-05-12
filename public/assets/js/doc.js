(function() {
  'use strict';

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || 'truyen-khong-ro';
  const chapter = parseInt(params.get('chapter')) || 1;

  function slugToTitle(s) {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  function getChapterName(ch) {
    const names = [
      'Khởi Đầu Mới', 'Thế Giới Kỳ Lạ', 'Gặp Gỡ Vận Mệnh', 'Sức Mạnh Thức Tỉnh',
      'Trận Chiến Đầu Tiên', 'Bí Mật Được Hé Lộ', 'Đỉnh Cao Mới', 'Kẻ Thù Xuất Hiện',
      'Luyện Tập Khắc Khổ', 'Đột Phá Cảnh Giới', 'Cuộc Hành Trình Dài', 'Đồng Hành Mới',
      'Hiểm Nguy Rình Rập', 'Vượt Qua Thử Thách', 'Sức Mạnh Tăng Vọt',
    ];
    return names[(ch - 1) % names.length];
  }

  function generateContent(ch) {
    const intros = [
      `Bầu trời hôm nay trong xanh vô tận, ánh nắng buổi sáng trải dài trên những ngọn núi xa xa. Chủ nhân công của chúng ta, sau một đêm dài tu luyện, cảm nhận được luồng khí lực trong cơ thể đã có sự biến chuyển kỳ diệu.`,
      `Trong tiếng gió rít qua kẽ lá, bóng người xuất hiện như một làn khói trắng. Đôi mắt sắc bén như ưng nhìn thẳng về phía trước, nội lực trong người đang cuồn cuộn như sóng biển.`,
      `Thế giới này vốn không công bằng — kẻ mạnh thống trị, kẻ yếu phục tùng. Nhưng hôm nay, tất cả điều đó sẽ thay đổi.`,
    ];
    const paragraphs = [
      `Trong nhiều ngày qua, hắn không ngừng đột phá bản thân, mỗi ngày đều ép bản thân đến cực hạn. Đau đớn đã trở thành người bạn đồng hành thân thiết nhất.`,
      `"Chỉ cần một lần nữa thôi!" — Hắn nghiến răng, toàn thân run lên vì cố gắng. Mồ hôi ướt đẫm áo, nhưng ánh mắt vẫn kiên định như bàn thạch.`,
      `Đột nhiên, trong não hải của hắn, một luồng ký ức xa lạ ùa về như thác lũ. Những hình ảnh về một thời đại huy hoàng, về những vị cường giả chấn động thiên địa...`,
      `Lão già đặt tay lên vai hắn, giọng trầm và nặng: "Con còn non nớt lắm. Cõi tu hành này rộng lớn vô cùng, phía trên còn có bầu trời cao hơn."`,
      `Khi mặt trời dần xuống núi, trận chiến cũng đến hồi kết. Hắn thở hào hển, nhìn vào đối thủ ngã xuống trước mặt, trong lòng không có chút vui mừng.`,
      `Ba ngày sau, tin tức lan khắp nơi như gió. Cái tên vô danh đó bỗng chốc trở thành tâm điểm của mọi ánh mắt.`,
      `Gió đêm thổi nhẹ, xua tan cái nóng oi bức của ban ngày. Hắn một mình ngồi trên đỉnh núi nhìn xuống muôn vạn ánh đèn bên dưới.`,
    ];
    const closing = [
      `Và như thế, chương mới trong cuộc đời hắn bắt đầu mở ra. Phía trước còn vô vàn thử thách đang chờ đợi.`,
      `Một trang mới đã lật qua. Con đường vạn dặm bắt đầu từ một bước chân, và bước chân đó — hắn đã bước rồi.`,
    ];
    const intro = intros[ch % intros.length];
    const selectedParas = Array.from({length: 6}, (_, i) => paragraphs[(ch + i) % paragraphs.length]);
    return [intro, ...selectedParas, closing[ch % closing.length]].map(p => `<p>${p}</p>`).join('\n');
  }

  const content = document.getElementById('doc-content');

  // Font size (localStorage — user preference)
  const fontSizes = { small: 'font-small', medium: 'font-medium', large: 'font-large', xlarge: 'font-xlarge' };
  let currentSize = localStorage.getItem('doc-font-size') || 'medium';
  content.classList.add(fontSizes[currentSize] || 'font-medium');

  document.querySelectorAll('.font-size-btn').forEach(btn => {
    if (btn.dataset.size === currentSize) btn.classList.add('active');
    btn.addEventListener('click', function() {
      document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSize = this.dataset.size;
      localStorage.setItem('doc-font-size', currentSize);
      Object.values(fontSizes).forEach(c => content.classList.remove(c));
      content.classList.add(fontSizes[currentSize] || 'font-medium');
    });
  });

  // Font family (localStorage — user preference)
  let currentFont = localStorage.getItem('doc-font-family') || 'serif';
  if (currentFont === 'sans') content.classList.add('font-sans');

  document.querySelectorAll('.font-family-btn').forEach(btn => {
    if (btn.dataset.font === currentFont) btn.classList.add('active');
    btn.addEventListener('click', function() {
      document.querySelectorAll('.font-family-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFont = this.dataset.font;
      localStorage.setItem('doc-font-family', currentFont);
      content.classList.remove('font-sans');
      if (currentFont === 'sans') content.classList.add('font-sans');
    });
  });

  // Font panel toggle
  const fontPanel = document.getElementById('font-panel');
  document.getElementById('btn-font').addEventListener('click', function(e) {
    e.stopPropagation();
    fontPanel.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!fontPanel.contains(e.target) && e.target !== document.getElementById('btn-font')) {
      fontPanel.classList.remove('open');
    }
  });

  // Dark/light mode (localStorage — user preference)
  const body = document.body;
  let dark = localStorage.getItem('doc-dark') === '1';
  if (dark) { body.classList.add('dark'); document.getElementById('btn-theme').textContent = '☀'; }

  document.getElementById('btn-theme').addEventListener('click', function() {
    dark = !dark;
    localStorage.setItem('doc-dark', dark ? '1' : '0');
    if (dark) { body.classList.add('dark'); this.textContent = '☀'; }
    else { body.classList.remove('dark'); this.textContent = '🌙'; }
  });

  // Similar books
  if (typeof window.renderSimilarBooks === 'function') {
    window.renderSimilarBooks('similar-grid', slug);
  }

  // ===== ASYNC: load book + chapter from API =====
  (async function () {
    const [book, chapterData, allChapters] = await Promise.all([
      fetch('/api/books/' + encodeURIComponent(slug)).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/chapters/' + encodeURIComponent(slug) + '/' + chapter).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/chapters/' + encodeURIComponent(slug)).then(r => r.json()).catch(() => []),
    ]);

    const bookTitle = (book && book.title) ? book.title : slugToTitle(slug);
    const chapterTitle = 'Chương ' + chapter + ': ' + (chapterData ? chapterData.title : getChapterName(chapter));
    const totalChapters = allChapters.length > 0
      ? allChapters[allChapters.length - 1].ch
      : (book && book.chapters) || 100;

    // Page header
    document.title = bookTitle + ' - ' + chapterTitle + ' | WebTruyện';
    document.getElementById('doc-topbar-title').textContent = bookTitle;
    document.getElementById('doc-book-name').textContent = bookTitle;
    document.getElementById('doc-chapter-name').textContent = chapterTitle;

    // SEO
    document.querySelector('meta[property="og:title"]') && (document.querySelector('meta[property="og:title"]').content = bookTitle + ' ' + chapterTitle + ' - WebTruyện');
    document.querySelector('meta[property="og:description"]') && (document.querySelector('meta[property="og:description"]').content = 'Đọc ' + bookTitle + ' ' + chapterTitle + ' tại WebTruyện - Miễn phí.');

    // Nav HTML
    const navHtml = `
      <div class="chapter-nav-inline">
        ${chapter > 1 ? `<a href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${chapter - 1}">&#9664; Chương Trước</a>` : ''}
        ${chapter < totalChapters ? `<a href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${chapter + 1}">Chương Tiếp &#9654;</a>` : ''}
      </div>`;

    // Content
    if (chapterData && chapterData.content) {
      content.innerHTML = chapterData.content
        .split('\n').filter(Boolean).map(p => '<p>' + p + '</p>').join('\n')
        + navHtml;
    } else {
      content.innerHTML = generateContent(chapter) + navHtml;
    }

    // Bottom nav buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (chapter <= 1) btnPrev.disabled = true;

    btnPrev.addEventListener('click', function() {
      if (chapter > 1) location.href = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=' + (chapter - 1);
    });
    btnNext.addEventListener('click', function() {
      location.href = 'doc.html?slug=' + encodeURIComponent(slug) + '&chapter=' + (chapter + 1);
    });

    // Chapter list modal
    const overlay = document.getElementById('chapter-modal-overlay');
    const chapterList = document.getElementById('chapter-list');

    if (allChapters.length > 0) {
      allChapters.forEach(function(c) {
        const li = document.createElement('li');
        if (c.ch === chapter) li.className = 'current';
        li.innerHTML = `<a href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${c.ch}">Chương ${c.ch}: ${c.title}</a>`;
        chapterList.appendChild(li);
      });
    } else {
      for (let i = 1; i <= totalChapters; i++) {
        const li = document.createElement('li');
        if (i === chapter) li.className = 'current';
        li.innerHTML = `<a href="doc.html?slug=${encodeURIComponent(slug)}&chapter=${i}">Chương ${i}: ${getChapterName(i)}</a>`;
        chapterList.appendChild(li);
      }
    }

    document.getElementById('btn-chapters').addEventListener('click', function() {
      overlay.classList.add('open');
      const cur = chapterList.querySelector('li.current');
      if (cur) cur.scrollIntoView({ block: 'center' });
    });
    document.getElementById('chapter-modal-close').addEventListener('click', function() {
      overlay.classList.remove('open');
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    // Save reading progress (localStorage — user preference)
    const history = JSON.parse(localStorage.getItem('reading-history') || '{}');
    history[slug] = { title: bookTitle, chapter, timestamp: Date.now(), img: book ? book.img : null };
    localStorage.setItem('reading-history', JSON.stringify(history));

    window.scrollTo(0, 0);
  })();
})();
