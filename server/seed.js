'use strict';
const Database = require('better-sqlite3');
const db = new Database('data.db');
db.pragma('journal_mode = WAL');

// ─────────────────────────────────────────────
// 1. XOÁ DATA CŨ VÀ ĐẢM BẢO 2 DANH MỤC GỐC
// ─────────────────────────────────────────────
const NAM_ID = '1778562463962';
const NU_ID  = '1778562475962';
const now0 = new Date().toISOString();

// Tạo/cập nhật 2 danh mục gốc
const insRoot = db.prepare(`
  INSERT OR REPLACE INTO categories(id,slug,name,icon,parent_id,show_on_home,sort_order,created_at)
  VALUES (@id,@slug,@name,@icon,NULL,1,@order,@created_at)
`);
insRoot.run({ id: NAM_ID, slug: 'danh-cho-nam', name: 'Dành cho nam', icon: '⚔️', order: 1, created_at: now0 });
insRoot.run({ id: NU_ID,  slug: 'danh-cho-nu',  name: 'Dành cho nữ',  icon: '💕', order: 2, created_at: now0 });

// Xoá toàn bộ category con cũ
db.prepare(`DELETE FROM categories WHERE parent_id IS NOT NULL`).run();
// Xoá chapters cũ
db.prepare(`DELETE FROM chapters`).run();
// Xoá books cũ
db.prepare(`DELETE FROM books`).run();

// ─────────────────────────────────────────────
// 2. CATEGORIES CON
// ─────────────────────────────────────────────
const now = new Date().toISOString();
const mkId = (offset) => String(Date.now() + offset);

const subCats = [
  // --- Dành cho nam ---
  { id: mkId(1),  slug: 'tien-hiep',       name: 'Tiên Hiệp',       icon: '⚡', parent_id: NAM_ID },
  { id: mkId(2),  slug: 'kiem-hiep',       name: 'Kiếm Hiệp',       icon: '⚔️', parent_id: NAM_ID },
  { id: mkId(3),  slug: 'huyen-huyen',     name: 'Huyền Huyễn',     icon: '🔮', parent_id: NAM_ID },
  { id: mkId(4),  slug: 'do-thi-nam',      name: 'Đô Thị',          icon: '🏙️', parent_id: NAM_ID },
  { id: mkId(5),  slug: 'di-the-gioi',     name: 'Dị Thế Giới',     icon: '🌀', parent_id: NAM_ID },
  // --- Dành cho nữ ---
  { id: mkId(6),  slug: 'ngon-tinh',       name: 'Ngôn Tình',        icon: '💕', parent_id: NU_ID  },
  { id: mkId(7),  slug: 'do-thi-ngon-tinh',name: 'Đô Thị Ngôn Tình',icon: '💼', parent_id: NU_ID  },
  { id: mkId(8),  slug: 'xuyen-khong',     name: 'Xuyên Không',      icon: '🌸', parent_id: NU_ID  },
  { id: mkId(9),  slug: 'co-dai',          name: 'Cổ Đại',           icon: '🏯', parent_id: NU_ID  },
  { id: mkId(10), slug: 'ngot-sung',        name: 'Ngọt Sủng',        icon: '🍬', parent_id: NU_ID  },
];

const insCat = db.prepare(`
  INSERT OR REPLACE INTO categories(id,slug,name,icon,parent_id,show_on_home,sort_order,created_at)
  VALUES (@id,@slug,@name,@icon,@parent_id,0,0,@created_at)
`);
subCats.forEach(c => insCat.run({ ...c, created_at: now }));

// Lấy id theo slug để dùng sau
const catBySlug = {};
[...subCats,
 { id: NAM_ID, slug: 'danh-cho-nam' },
 { id: NU_ID,  slug: 'danh-cho-nu'  }
].forEach(c => { catBySlug[c.slug] = c.id; });

console.log('✅ Categories created:', subCats.length + 2, 'total');

// ─────────────────────────────────────────────
// 3. BOOKS
// ─────────────────────────────────────────────
const mkBookId = (offset) => String(Date.now() + offset + 1000);

const books = [
  // ===== DÀNH CHO NAM =====
  {
    id: mkBookId(1), slug: 'dau-pha-thuong-khung',
    title: 'Đấu Phá Thương Khung', author: 'Thiên Tằm Thổ Đậu',
    status: 'complete', views: 850000, rating: 4.8, chapters: 1648,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: 'https://static.truyenfull.vision/cover/o/eJzLyTDT1y1Mcw2M0C0IMAvL1g9z8nUxMYwyD3Tz1HeEgmwfR_0SAzefTKOgCI8MC_1yI0NT3QxjIyMANhQRaQ==/truyen-dau-pha-thuong-khung.jpg',
    desc: 'Thất tộc danh gia, Đấu Khí đại lục, nơi mạnh là vua yếu là nô lệ. Tiêu Viêm — một thiên tài bị phế bỏ sức mạnh, vươn mình từ đáy bùn nhơ trở thành bá chủ thiên hạ.',
  },
  {
    id: mkBookId(2), slug: 'pham-nhan-tu-tien',
    title: 'Phàm Nhân Tu Tiên', author: 'Vong Ngữ',
    status: 'complete', views: 1200000, rating: 4.9, chapters: 2000,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: 'https://static.truyenfull.vision/cover/o/eJzLyTDT17WITwqMNNQtNKp01A_zNXY1ifQuc8301HeEgmwfR_0SAzefTKOgCI8MC_1yI0NT3QxjIyMANhQRaQ==/pham-nhan-tu-tien.jpg',
    desc: 'Hàn Lập — cậu bé xuất thân bần hàn gia nhập môn phái tu tiên, từ một kẻ vô danh dần trở thành đại năng tu tiên vô địch thiên hạ.',
  },
  {
    id: mkBookId(3), slug: 'dau-la-dai-luc',
    title: 'Đấu La Đại Lục', author: 'Đường Gia Tam Thiếu',
    status: 'complete', views: 960000, rating: 4.7, chapters: 3000,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: 'https://static.truyenfull.vision/cover/o/eJzLyTDR180LKc8Kjw9w9kly1Q9z8nUxyTQ3Ms721HeEgmxvC_3MsEKLgJLCxIqIcv1yI0NT3QxjIyMAUTMSjA==/dau-la-dai-luc-230420.jpg',
    desc: 'Đường Tam — thiên tài chế tạo ám khí bị phản bội, chuyển sinh vào thế giới Đấu La không có phép thuật chỉ có võ hồn.',
  },
  {
    id: mkBookId(4), slug: 'kiem-lai',
    title: 'Kiếm Lai', author: 'Phong Hỏa Hý Chư Hầu',
    status: 'ongoing', views: 720000, rating: 4.9, chapters: 1200,
    cats: ['danh-cho-nam', 'kiem-hiep'],
    img: 'https://img.truyenfull.io/img/cover/2020/09/16/kiem-lai.jpg',
    desc: 'Trần Bình An — cậu bé đến từ Bá Châu nhỏ bé, bước chân ra ngoài thế giới rộng lớn để tìm hiểu con đường kiếm đạo chân chính.',
  },
  {
    id: mkBookId(5), slug: 'toan-chuc-phap-su',
    title: 'Toàn Chức Pháp Sư', author: 'Loạn',
    status: 'complete', views: 580000, rating: 4.6, chapters: 1234,
    cats: ['danh-cho-nam', 'huyen-huyen'],
    img: 'https://static.truyenfull.vision/cover/eJzLyTDWT8-NCPApLc5Kt4yK8KwwijQK9XIrLXVLzjKMdC0PdDZzjfIr9PKtSjGOSolwdbTICnBJtvB0DfPyKnYOywnIzzHLCc3IyDStdDJLcw8oCvHKMwu1LTcyNNXNMDYyAgAxnB91/toan-chuc-phap-su.jpg',
    desc: 'Mặc Phàm — học sinh tầm thường đột nhiên giác thức được linh hồn thứ hai trong ký ức, trở thành pháp sư toàn năng siêu việt.',
  },
  {
    id: mkBookId(6), slug: 'de-ba',
    title: 'Đế Bá', author: 'Vô Nhân',
    status: 'ongoing', views: 430000, rating: 4.5, chapters: 1500,
    cats: ['danh-cho-nam', 'huyen-huyen'],
    img: 'https://static.truyenfull.vision/cover/o/eJzLyTDR193KzSo2TCpOCXKJ1A8LKEiucHN3yor31HeEglzXZP0qM-fg-IA8QxODQL1yI0NT3QxjIyMAbfcSoQ==/de-ba.jpg',
    desc: 'Thanh niên bình thường xuyên không sang thế giới huyền huyễn, mang trong mình bí ẩn huyết mạch cổ đại, bước lên con đường xưng đế.',
  },
  {
    id: mkBookId(7), slug: 'vo-luyen-dinh-phong',
    title: 'Võ Luyện Đỉnh Phong', author: 'Thiên Hạ Bá Xướng',
    status: 'ongoing', views: 390000, rating: 4.6, chapters: 3456,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: null,
    desc: 'Dương Khai — thiếu niên tài năng bị phế bỏ, gặp được cơ duyên tu luyện, tiến bước trên đỉnh võ đạo không ai sánh được.',
  },
  {
    id: mkBookId(8), slug: 'than-dao-de-ton',
    title: 'Thần Đạo Đế Tôn', author: 'Cự Tinh Linh',
    status: 'ongoing', views: 280000, rating: 4.4, chapters: 890,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: null,
    desc: 'Con đường tu thần bắt đầu từ một phế nhân không căn cốt, dần khai mở bí ẩn vũ trụ, chứng đạo đế tôn trên chín tầng thần giới.',
  },
  {
    id: mkBookId(9), slug: 'long-vuong-truyen-thuyet',
    title: 'Long Vương Truyền Thuyết', author: 'Mộng Nhập Thần Cơ',
    status: 'ongoing', views: 210000, rating: 4.3, chapters: 567,
    cats: ['danh-cho-nam', 'di-the-gioi'],
    img: null,
    desc: 'Thiếu niên mang huyết mạch Long Vương thức tỉnh, bước vào thế giới phép thuật, chinh phục mọi thế lực từ yếu đến mạnh.',
  },
  {
    id: mkBookId(10), slug: 'than-mo',
    title: 'Thần Mộ', author: 'Thần Đông',
    status: 'complete', views: 670000, rating: 4.7, chapters: 1800,
    cats: ['danh-cho-nam', 'tien-hiep'],
    img: null,
    desc: 'Diệp Tiêu — hậu duệ của gia tộc cổ đại, bước vào Thần Mộ — khu mộ của các vị thần, giải khai bí ẩn nguồn gốc thế giới.',
  },
  {
    id: mkBookId(11), slug: 'co-vo-than-de',
    title: 'Cô Vũ Thần Đế', author: 'Phong Thanh Dương',
    status: 'ongoing', views: 155000, rating: 4.3, chapters: 456,
    cats: ['danh-cho-nam', 'kiem-hiep'],
    img: null,
    desc: 'Cô Phong — thiên tài kiếm thuật bị hại chết, trùng sinh trở lại từ đầu, quyết tâm báo thù và đạt đến cảnh giới vô địch thiên hạ.',
  },
  {
    id: mkBookId(12), slug: 'bat-bai-thanh-than',
    title: 'Bất Bại Thành Thần', author: 'Vạn Gia Bình',
    status: 'complete', views: 340000, rating: 4.5, chapters: 1100,
    cats: ['danh-cho-nam', 'do-thi-nam'],
    img: null,
    desc: 'Đô thị dị năng, chàng trai bình thường đột nhiên giác thức siêu năng lực, trở thành sức mạnh bảo vệ thành phố và người thân.',
  },

  // ===== DÀNH CHO NỮ =====
  {
    id: mkBookId(13), slug: 'lao-gia-the-gia',
    title: 'Lão Gia Thế Gia', author: 'Ngã Thị Tiểu Thất',
    status: 'ongoing', views: 320000, rating: 4.6, chapters: 432,
    cats: ['danh-cho-nu', 'do-thi-ngon-tinh'],
    img: null,
    desc: 'Hào môn thế gia, tranh đấu quyền lực và tình yêu. Cô gái bình thường bước vào thế giới của giới thượng lưu, giữa tình và lý.',
  },
  {
    id: mkBookId(14), slug: 'mot-thon-tuong-tu',
    title: 'Nhất Thốn Tương Tư', author: 'Cố Mạn',
    status: 'complete', views: 890000, rating: 4.9, chapters: 680,
    cats: ['danh-cho-nu', 'ngon-tinh'],
    img: null,
    desc: 'Chương Tiểu Nhiên và Trình Giác Thời — câu chuyện tình yêu ngọt ngào, buồn bã suốt mười năm, một tấc tương tư, hai nơi thương đau.',
  },
  {
    id: mkBookId(15), slug: 'tinh-ra-anh-nhu-the',
    title: 'Biết Ra Anh Như Thế', author: 'Thiên Y Hữu Phong',
    status: 'complete', views: 760000, rating: 4.8, chapters: 520,
    cats: ['danh-cho-nu', 'ngon-tinh'],
    img: null,
    desc: 'Cô thiết kế thời trang và anh giám đốc lạnh lùng — cuộc hôn nhân sắp đặt dần dần trở thành tình yêu thật sự ngọt ngào.',
  },
  {
    id: mkBookId(16), slug: 'xuyen-ve-thoi-co-dai',
    title: 'Xuyên Về Thời Cổ Đại Làm Vương Phi', author: 'Linh Tiêu',
    status: 'complete', views: 540000, rating: 4.7, chapters: 890,
    cats: ['danh-cho-nu', 'xuyen-khong', 'co-dai'],
    img: null,
    desc: 'Cô gái hiện đại xuyên không về cổ đại, trở thành vương phi của thân vương lạnh lùng, dùng trí tuệ hiện đại để tồn tại và yêu.',
  },
  {
    id: mkBookId(17), slug: 'vo-chong-hoan-my',
    title: 'Vợ Chồng Hoàn Mỹ', author: 'Nhã Lệ',
    status: 'ongoing', views: 410000, rating: 4.6, chapters: 348,
    cats: ['danh-cho-nu', 'do-thi-ngon-tinh'],
    img: null,
    desc: 'Hôn nhân sắp đặt giữa hai gia đình danh giá. Anh lạnh lùng, kiêu ngạo — cô hiểu anh hơn bất cứ ai. Tình yêu nảy sinh từ gần gũi.',
  },
  {
    id: mkBookId(18), slug: 'hoa-tan-dau-quan',
    title: 'Hoa Tàn Đầu Quân', author: 'Mộc Phù Sinh',
    status: 'complete', views: 480000, rating: 4.7, chapters: 760,
    cats: ['danh-cho-nu', 'co-dai'],
    img: null,
    desc: 'Nữ tướng quân tài ba sống trong thời loạn, bảo vệ giang sơn với trái tim kiên cường. Giữa lửa đạn, tình yêu nảy sinh bất ngờ.',
  },
  {
    id: mkBookId(19), slug: 'ngot-sung-hang-ngay',
    title: 'Ngọt Sủng Hằng Ngày', author: 'Điền Trư Bão Báo',
    status: 'ongoing', views: 290000, rating: 4.5, chapters: 265,
    cats: ['danh-cho-nu', 'ngot-sung'],
    img: null,
    desc: 'Tổng tài uy nghiêm ngoài đường, về nhà ngọt sủng vợ mỗi ngày. Cuộc sống hôn nhân hạnh phúc ngọt như mật, tan chảy từng trang.',
  },
  {
    id: mkBookId(20), slug: 'to-moc-thanh-huong',
    title: 'Tô Mộc Thanh Hương', author: 'Tam Sinh Tam Thế',
    status: 'complete', views: 370000, rating: 4.6, chapters: 500,
    cats: ['danh-cho-nu', 'xuyen-khong'],
    img: null,
    desc: 'Linh hồn cô gái hiện đại xuyên không vào thân xác tiểu thư bị hại, dùng trí tuệ và lòng dũng cảm lật ngược số phận.',
  },
];

const insBook = db.prepare(`
  INSERT OR REPLACE INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
  VALUES (@id,@slug,@title,@author,@genres,@chapters,@status,@rating,@img,@desc,@category_ids,@views,@created_at)
`);

books.forEach((b, i) => {
  const catIds = b.cats.map(slug => catBySlug[slug]).filter(Boolean);
  insBook.run({
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    genres: b.cats.slice(1).map(s => subCats.find(c=>c.slug===s)?.name || s).join(', '),
    chapters: b.chapters,
    status: b.status,
    rating: b.rating,
    img: b.img || null,
    desc: b.desc,
    category_ids: JSON.stringify(catIds),
    views: b.views,
    created_at: new Date(Date.now() - (books.length - i) * 3600000).toISOString(),
  });
});

console.log('✅ Books created:', books.length);

// ─────────────────────────────────────────────
// 4. CHAPTERS (5 chương đầu mỗi truyện)
// ─────────────────────────────────────────────
const insChapter = db.prepare(`
  INSERT OR REPLACE INTO chapters(book_slug, ch, title, content, created_at)
  VALUES (@book_slug, @ch, @title, @content, @created_at)
`);

const sampleContent = (bookTitle, ch) => `
<p>Đây là nội dung chương ${ch} của truyện <strong>${bookTitle}</strong>.</p>
<p>Bầu trời xanh thẳm như tấm gương phản chiếu ánh mặt trời buổi sớm. Nhân vật chính bước ra khỏi căn phòng nhỏ, hít thở không khí trong lành và bắt đầu ngày mới đầy thử thách.</p>
<p>"Hôm nay ta nhất định phải vượt qua giới hạn của mình!" — anh ta tự nhủ, ánh mắt kiên định hướng về phía chân trời xa.</p>
<p>Con đường phía trước còn dài, nhưng với ý chí sắt thép và tài năng thiên phú, không có gì có thể ngăn cản được bước tiến của anh ta.</p>
<p>Chương tiếp theo sẽ tiết lộ bí ẩn lớn hơn đang chờ đợi ở phía trước...</p>
`.trim();

let chCount = 0;
books.forEach(b => {
  const total = Math.min(b.chapters, 5);
  for (let ch = 1; ch <= total; ch++) {
    insChapter.run({
      book_slug: b.slug,
      ch,
      title: `Chương ${ch}: ${ch === 1 ? 'Khởi Đầu' : ch === 2 ? 'Giác Ngộ' : ch === 3 ? 'Thử Thách' : ch === 4 ? 'Đột Phá' : 'Bí Ẩn'}`,
      content: sampleContent(b.title, ch),
      created_at: new Date(Date.now() - (total - ch) * 86400000).toISOString(),
    });
    chCount++;
  }
});

console.log('✅ Chapters created:', chCount);
console.log('\n📊 Summary:');
console.log('  Books:', db.prepare('SELECT COUNT(*) as n FROM books').get().n);
console.log('  Chapters:', db.prepare('SELECT COUNT(*) as n FROM chapters').get().n);
console.log('  Categories:', db.prepare('SELECT COUNT(*) as n FROM categories').get().n);
console.log('\nCategories tree:');
db.prepare('SELECT id,name,parent_id FROM categories ORDER BY parent_id NULLS FIRST, sort_order').all().forEach(c => {
  const prefix = c.parent_id ? '  └─ ' : '📁 ';
  console.log(prefix + c.name + ' (' + c.id + ')');
});
