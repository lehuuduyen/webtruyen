'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

// ===== DATABASE SETUP =====
const DB_PATH = path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genres TEXT DEFAULT '',
    chapters INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ongoing',
    rating REAL DEFAULT 4.5,
    img TEXT,
    desc TEXT DEFAULT '',
    category_ids TEXT DEFAULT '[]',
    views INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_slug TEXT NOT NULL,
    ch INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    UNIQUE(book_slug, ch),
    FOREIGN KEY(book_slug) REFERENCES books(slug) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(book_slug, ch);

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    parent_id TEXT,
    show_on_home INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Default admin credentials (admin / admin123)
const defaultHash = bcrypt.hashSync('admin123', 10);
db.prepare(`INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)`).run('admin_user', 'admin');
db.prepare(`INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)`).run('admin_pass', defaultHash);

// ===== PREPARED STATEMENTS =====
const stmt = {
  // books
  getAllBooks: db.prepare('SELECT * FROM books ORDER BY created_at DESC'),
  getBook: db.prepare('SELECT * FROM books WHERE id = ?'),
  getBookBySlug: db.prepare('SELECT * FROM books WHERE slug = ?'),
  insertBook: db.prepare(`INSERT INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
    VALUES(@id,@slug,@title,@author,@genres,@chapters,@status,@rating,@img,@desc,@category_ids,0,@created_at)`),
  updateBook: db.prepare(`UPDATE books SET slug=@slug,title=@title,author=@author,genres=@genres,chapters=@chapters,
    status=@status,rating=@rating,img=@img,desc=@desc,category_ids=@category_ids WHERE id=@id`),
  deleteBook: db.prepare('DELETE FROM books WHERE id = ?'),
  incrementViews: db.prepare('UPDATE books SET views = views + 1 WHERE slug = ?'),

  // chapters
  getChaptersBySlug: db.prepare('SELECT ch, title, created_at FROM chapters WHERE book_slug = ? ORDER BY ch ASC'),
  getChapter: db.prepare('SELECT * FROM chapters WHERE book_slug = ? AND ch = ?'),
  upsertChapter: db.prepare(`INSERT INTO chapters(book_slug,ch,title,content,created_at) VALUES(@book_slug,@ch,@title,@content,@created_at)
    ON CONFLICT(book_slug,ch) DO UPDATE SET title=excluded.title, content=excluded.content`),
  deleteChapter: db.prepare('DELETE FROM chapters WHERE book_slug = ? AND ch = ?'),
  countChapters: db.prepare('SELECT COUNT(*) as n FROM chapters WHERE book_slug = ?'),

  // categories
  getAllCategories: db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC'),
  getCategory: db.prepare('SELECT * FROM categories WHERE id = ?'),
  insertCategory: db.prepare(`INSERT INTO categories(id,slug,name,icon,parent_id,show_on_home,sort_order,created_at)
    VALUES(@id,@slug,@name,@icon,@parent_id,@show_on_home,@sort_order,@created_at)`),
  updateCategory: db.prepare(`UPDATE categories SET slug=@slug,name=@name,icon=@icon,parent_id=@parent_id,
    show_on_home=@show_on_home,sort_order=@sort_order WHERE id=@id`),
  deleteCategory: db.prepare('DELETE FROM categories WHERE id = ?'),
  deleteChildCategories: db.prepare('DELETE FROM categories WHERE parent_id = ?'),

  // settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)'),
};

// ===== SESSION STORE (in-memory) =====
const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { user, expires: Date.now() + 8 * 3600 * 1000 });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expires) { sessions.delete(token); return null; }
  return s;
}

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!getSession(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ===== EXPRESS APP =====
const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS — allow Next.js frontend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ['http://localhost:3000', process.env.SITE_URL].filter(Boolean);
  if (!origin || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-auth-token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

// ===== AUTH ROUTES =====
app.post('/api/auth/login', (req, res) => {
  const { user, pass } = req.body || {};
  const storedUser = stmt.getSetting.get('admin_user')?.value;
  const storedHash = stmt.getSetting.get('admin_pass')?.value;
  if (!user || !pass || user !== storedUser || !bcrypt.compareSync(pass, storedHash)) {
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  const token = createSession(user);
  res.json({ ok: true, token, user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/auth/check', (req, res) => {
  const token = req.headers['x-auth-token'];
  const s = getSession(token);
  res.json({ ok: !!s, user: s?.user || null });
});

// ===== BOOKS ROUTES =====
app.get('/api/books', (req, res) => {
  const books = stmt.getAllBooks.all().map(parseBook);
  res.json(books);
});

app.get('/api/books/:slug', (req, res) => {
  const book = stmt.getBookBySlug.get(req.params.slug);
  if (!book) return res.status(404).json({ error: 'Not found' });
  stmt.incrementViews.run(req.params.slug);
  res.json(parseBook(book));
});

app.post('/api/books', requireAuth, (req, res) => {
  const data = req.body;
  if (!data.title || !data.author) return res.status(400).json({ error: 'title and author required' });
  const book = {
    id: Date.now().toString(),
    slug: data.slug || toSlug(data.title),
    title: data.title,
    author: data.author,
    genres: data.genres || '',
    chapters: data.chapters || 0,
    status: data.status || 'ongoing',
    rating: data.rating || 4.5,
    img: data.img || null,
    desc: data.desc || '',
    category_ids: JSON.stringify(data.categoryIds || []),
    created_at: new Date().toISOString(),
  };
  stmt.insertBook.run(book);
  res.json(parseBook(stmt.getBook.get(book.id)));
});

app.put('/api/books/:id', requireAuth, (req, res) => {
  const existing = stmt.getBook.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const data = req.body;
  const updated = {
    id: req.params.id,
    slug: data.slug || toSlug(data.title || existing.title),
    title: data.title || existing.title,
    author: data.author || existing.author,
    genres: data.genres !== undefined ? data.genres : existing.genres,
    chapters: data.chapters !== undefined ? data.chapters : existing.chapters,
    status: data.status || existing.status,
    rating: data.rating !== undefined ? data.rating : existing.rating,
    img: data.img !== undefined ? data.img : existing.img,
    desc: data.desc !== undefined ? data.desc : existing.desc,
    category_ids: JSON.stringify(data.categoryIds !== undefined ? data.categoryIds : JSON.parse(existing.category_ids || '[]')),
  };
  stmt.updateBook.run(updated);
  res.json(parseBook(stmt.getBook.get(req.params.id)));
});

app.delete('/api/books/:id', requireAuth, (req, res) => {
  const existing = stmt.getBook.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  stmt.deleteBook.run(req.params.id);
  res.json({ ok: true });
});

// ===== CHAPTERS ROUTES =====
app.get('/api/chapters/:slug', (req, res) => {
  const chapters = stmt.getChaptersBySlug.all(req.params.slug);
  res.json(chapters);
});

app.get('/api/chapters/:slug/:ch', (req, res) => {
  const ch = parseInt(req.params.ch);
  const chapter = stmt.getChapter.get(req.params.slug, ch);
  if (!chapter) return res.status(404).json({ error: 'Not found' });
  res.json(chapter);
});

app.post('/api/chapters/:slug', requireAuth, (req, res) => {
  const { ch, title, content } = req.body || {};
  if (!ch || !title) return res.status(400).json({ error: 'ch and title required' });
  stmt.upsertChapter.run({
    book_slug: req.params.slug,
    ch: parseInt(ch),
    title,
    content: content || '',
    created_at: new Date().toISOString(),
  });
  // Update chapters count on book
  const count = stmt.countChapters.get(req.params.slug).n;
  db.prepare('UPDATE books SET chapters = ? WHERE slug = ?').run(count, req.params.slug);
  res.json({ ok: true });
});

app.delete('/api/chapters/:slug/:ch', requireAuth, (req, res) => {
  const ch = parseInt(req.params.ch);
  stmt.deleteChapter.run(req.params.slug, ch);
  const count = stmt.countChapters.get(req.params.slug).n;
  db.prepare('UPDATE books SET chapters = ? WHERE slug = ?').run(count, req.params.slug);
  res.json({ ok: true });
});

// ===== CATEGORIES ROUTES =====
app.get('/api/categories', (req, res) => {
  res.json(stmt.getAllCategories.all().map(parseCat));
});

app.post('/api/categories', requireAuth, (req, res) => {
  const { name, icon, parent_id, showOnHome, order } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const cat = {
    id: Date.now().toString(),
    slug: toSlug(name),
    name,
    icon: icon || '📁',
    parent_id: parent_id || null,
    show_on_home: (showOnHome && !parent_id) ? 1 : 0,
    sort_order: order || 0,
    created_at: new Date().toISOString(),
  };
  stmt.insertCategory.run(cat);
  res.json(parseCat(stmt.getCategory.get(cat.id)));
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
  const existing = stmt.getCategory.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, icon, parent_id, showOnHome, order } = req.body || {};
  const updated = {
    id: req.params.id,
    slug: toSlug(name || existing.name),
    name: name || existing.name,
    icon: icon !== undefined ? icon : existing.icon,
    parent_id: parent_id !== undefined ? (parent_id || null) : existing.parent_id,
    show_on_home: showOnHome !== undefined ? (showOnHome && !parent_id ? 1 : 0) : existing.show_on_home,
    sort_order: order !== undefined ? order : existing.sort_order,
  };
  stmt.updateCategory.run(updated);
  res.json(parseCat(stmt.getCategory.get(req.params.id)));
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  stmt.deleteChildCategories.run(req.params.id);
  stmt.deleteCategory.run(req.params.id);
  // Remove this categoryId from all books
  const books = stmt.getAllBooks.all();
  for (const book of books) {
    const ids = JSON.parse(book.category_ids || '[]').filter(cid => cid !== req.params.id);
    if (ids.length !== JSON.parse(book.category_ids || '[]').length) {
      db.prepare('UPDATE books SET category_ids = ? WHERE id = ?').run(JSON.stringify(ids), book.id);
    }
  }
  res.json({ ok: true });
});

// ===== SETTINGS =====
app.get('/api/settings', requireAuth, (req, res) => {
  const user = stmt.getSetting.get('admin_user')?.value || 'admin';
  res.json({ user });
});

app.post('/api/settings/password', requireAuth, (req, res) => {
  const { user, pass } = req.body || {};
  if (!user || !pass || pass.length < 6) return res.status(400).json({ error: 'Invalid data' });
  stmt.setSetting.run('admin_user', user);
  stmt.setSetting.run('admin_pass', bcrypt.hashSync(pass, 10));
  // Update session username
  const token = req.headers['x-auth-token'];
  const s = getSession(token);
  if (s) s.user = user;
  res.json({ ok: true, user });
});

// ===== IMPORT/EXPORT =====
app.get('/api/export', requireAuth, (req, res) => {
  const data = {
    books: stmt.getAllBooks.all().map(parseBook),
    chapters: {},
    categories: stmt.getAllCategories.all().map(parseCat),
    exportedAt: new Date().toISOString(),
  };
  for (const book of data.books) {
    const chs = db.prepare('SELECT * FROM chapters WHERE book_slug = ? ORDER BY ch ASC').all(book.slug);
    data.chapters[book.slug] = chs;
  }
  res.json(data);
});

app.post('/api/import', requireAuth, (req, res) => {
  const data = req.body;
  let addedBooks = 0, addedChapters = 0;

  const importBooks = db.transaction(() => {
    if (Array.isArray(data.books)) {
      for (const b of data.books) {
        const exists = stmt.getBookBySlug.get(b.slug);
        if (!exists) {
          stmt.insertBook.run({
            id: b.id || Date.now().toString(),
            slug: b.slug,
            title: b.title,
            author: b.author,
            genres: b.genres || '',
            chapters: b.chapters || 0,
            status: b.status || 'ongoing',
            rating: b.rating || 4.5,
            img: b.img || null,
            desc: b.desc || '',
            category_ids: JSON.stringify(b.categoryIds || []),
            created_at: b.createdAt || new Date().toISOString(),
          });
          addedBooks++;
        }
      }
    }
    if (data.chapters && typeof data.chapters === 'object') {
      for (const [slug, chs] of Object.entries(data.chapters)) {
        for (const ch of chs) {
          stmt.upsertChapter.run({
            book_slug: slug,
            ch: ch.ch,
            title: ch.title,
            content: ch.content || '',
            created_at: ch.createdAt || new Date().toISOString(),
          });
          addedChapters++;
        }
      }
    }
    if (Array.isArray(data.categories)) {
      for (const c of data.categories) {
        const exists = stmt.getCategory.get(c.id);
        if (!exists) {
          stmt.insertCategory.run({
            id: c.id,
            slug: c.slug || toSlug(c.name),
            name: c.name,
            icon: c.icon || '📁',
            parent_id: c.parent_id || null,
            show_on_home: c.showOnHome ? 1 : 0,
            sort_order: c.order || 0,
            created_at: c.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  });

  importBooks();
  res.json({ ok: true, addedBooks, addedChapters });
});

// ===== CLEAR ALL DATA =====
app.post('/api/clear', requireAuth, (req, res) => {
  db.prepare('DELETE FROM chapters').run();
  db.prepare('DELETE FROM books').run();
  db.prepare('DELETE FROM categories').run();
  res.json({ ok: true });
});

// ===== SEED SAMPLE DATA =====
app.post('/api/seed', requireAuth, (req, res) => {
  const NAM_ID = '1778562463962';
  const NU_ID  = '1778562475962';
  const now0 = new Date().toISOString();

  // Upsert 2 root categories
  const insRoot = db.prepare(`
    INSERT OR REPLACE INTO categories(id,slug,name,icon,parent_id,show_on_home,sort_order,created_at)
    VALUES (@id,@slug,@name,@icon,NULL,1,@order,@created_at)
  `);
  insRoot.run({ id: NAM_ID, slug: 'danh-cho-nam', name: 'Dành cho nam', icon: '⚔️', order: 1, created_at: now0 });
  insRoot.run({ id: NU_ID,  slug: 'danh-cho-nu',  name: 'Dành cho nữ',  icon: '💕', order: 2, created_at: now0 });

  // Delete and recreate subcategories
  db.prepare('DELETE FROM categories WHERE parent_id IS NOT NULL').run();
  db.prepare('DELETE FROM chapters').run();
  db.prepare('DELETE FROM books').run();

  const now = new Date().toISOString();
  const mkId = (off) => String(Date.now() + off);

  const subCats = [
    { id: mkId(1),  slug: 'tien-hiep',        name: 'Tiên Hiệp',        icon: '⚡', parent_id: NAM_ID },
    { id: mkId(2),  slug: 'kiem-hiep',        name: 'Kiếm Hiệp',        icon: '⚔️', parent_id: NAM_ID },
    { id: mkId(3),  slug: 'huyen-huyen',      name: 'Huyền Huyễn',      icon: '🔮', parent_id: NAM_ID },
    { id: mkId(4),  slug: 'do-thi-nam',       name: 'Đô Thị',           icon: '🏙️', parent_id: NAM_ID },
    { id: mkId(5),  slug: 'di-the-gioi',      name: 'Dị Thế Giới',      icon: '🌀', parent_id: NAM_ID },
    { id: mkId(6),  slug: 'ngon-tinh',        name: 'Ngôn Tình',         icon: '💕', parent_id: NU_ID  },
    { id: mkId(7),  slug: 'do-thi-ngon-tinh', name: 'Đô Thị Ngôn Tình', icon: '💼', parent_id: NU_ID  },
    { id: mkId(8),  slug: 'xuyen-khong',      name: 'Xuyên Không',       icon: '🌸', parent_id: NU_ID  },
    { id: mkId(9),  slug: 'co-dai',           name: 'Cổ Đại',            icon: '🏯', parent_id: NU_ID  },
    { id: mkId(10), slug: 'ngot-sung',        name: 'Ngọt Sủng',         icon: '🍬', parent_id: NU_ID  },
  ];
  const insCat = db.prepare(`
    INSERT OR REPLACE INTO categories(id,slug,name,icon,parent_id,show_on_home,sort_order,created_at)
    VALUES (@id,@slug,@name,@icon,@parent_id,0,0,@created_at)
  `);
  subCats.forEach(c => insCat.run({ ...c, created_at: now }));

  const catBySlug = {};
  [...subCats, { id: NAM_ID, slug: 'danh-cho-nam' }, { id: NU_ID, slug: 'danh-cho-nu' }]
    .forEach(c => { catBySlug[c.slug] = c.id; });

  const mkBId = (off) => String(Date.now() + off + 1000);
  const booksData = [
    { id: mkBId(1),  slug: 'dau-pha-thuong-khung',     title: 'Đấu Phá Thương Khung',            author: 'Thiên Tằm Thổ Đậu',      status: 'complete', views: 850000,  rating: 4.8, chapters: 1648, cats: ['danh-cho-nam','tien-hiep'],            img: 'https://static.truyenfull.vision/cover/o/eJzLyTDT1y1Mcw2M0C0IMAvL1g9z8nUxMYwyD3Tz1HeEgmwfR_0SAzefTKOgCI8MC_1yI0NT3QxjIyMANhQRaQ==/truyen-dau-pha-thuong-khung.jpg',      desc: 'Thất tộc danh gia, Đấu Khí đại lục, nơi mạnh là vua yếu là nô lệ. Tiêu Viêm vươn mình từ đáy bùn nhơ trở thành bá chủ thiên hạ.' },
    { id: mkBId(2),  slug: 'pham-nhan-tu-tien',         title: 'Phàm Nhân Tu Tiên',               author: 'Vong Ngữ',               status: 'complete', views: 1200000, rating: 4.9, chapters: 2000, cats: ['danh-cho-nam','tien-hiep'],            img: 'https://static.truyenfull.vision/cover/o/eJzLyTDT17WITwqMNNQtNKp01A_zNXY1ifQuc8301HeEgmwfR_0SAzefTKOgCI8MC_1yI0NT3QxjIyMANhQRaQ==/pham-nhan-tu-tien.jpg',             desc: 'Hàn Lập — cậu bé xuất thân bần hàn gia nhập môn phái tu tiên, từ kẻ vô danh dần trở thành đại năng vô địch thiên hạ.' },
    { id: mkBId(3),  slug: 'dau-la-dai-luc',            title: 'Đấu La Đại Lục',                  author: 'Đường Gia Tam Thiếu',    status: 'complete', views: 960000,  rating: 4.7, chapters: 3000, cats: ['danh-cho-nam','tien-hiep'],            img: 'https://static.truyenfull.vision/cover/o/eJzLyTDR180LKc8Kjw9w9kly1Q9z8nUxyTQ3Ms721HeEgmxvC_3MsEKLgJLCxIqIcv1yI0NT3QxjIyMAUTMSjA==/dau-la-dai-luc-230420.jpg',          desc: 'Đường Tam — thiên tài chế tạo ám khí bị phản bội, chuyển sinh vào thế giới Đấu La không có phép thuật chỉ có võ hồn.' },
    { id: mkBId(4),  slug: 'kiem-lai',                  title: 'Kiếm Lai',                        author: 'Phong Hỏa Hý Chư Hầu',  status: 'ongoing',  views: 720000,  rating: 4.9, chapters: 1200, cats: ['danh-cho-nam','kiem-hiep'],            img: 'https://img.truyenfull.io/img/cover/2020/09/16/kiem-lai.jpg',                                                                                       desc: 'Trần Bình An bước chân ra ngoài thế giới rộng lớn để tìm hiểu con đường kiếm đạo chân chính.' },
    { id: mkBId(5),  slug: 'toan-chuc-phap-su',         title: 'Toàn Chức Pháp Sư',               author: 'Loạn',                   status: 'complete', views: 580000,  rating: 4.6, chapters: 1234, cats: ['danh-cho-nam','huyen-huyen'],          img: 'https://static.truyenfull.vision/cover/eJzLyTDWT8-NCPApLc5Kt4yK8KwwijQK9XIrLXVLzjKMdC0PdDZzjfIr9PKtSjGOSolwdbTICnBJtvB0DfPyKnYOywnIzzHLCc3IyDStdDJLcw8oCvHKMwu1LTcyNNXNMDYyAgAxnB91/toan-chuc-phap-su.jpg', desc: 'Mặc Phàm — học sinh tầm thường đột nhiên giác thức được linh hồn thứ hai, trở thành pháp sư toàn năng siêu việt.' },
    { id: mkBId(6),  slug: 'de-ba',                     title: 'Đế Bá',                           author: 'Vô Nhân',                status: 'ongoing',  views: 430000,  rating: 4.5, chapters: 1500, cats: ['danh-cho-nam','huyen-huyen'],          img: 'https://static.truyenfull.vision/cover/o/eJzLyTDR193KzSo2TCpOCXKJ1A8LKEiucHN3yor31HeEglzXZP0qM-fg-IA8QxODQL1yI0NT3QxjIyMAbfcSoQ==/de-ba.jpg',                         desc: 'Thanh niên bình thường xuyên không sang thế giới huyền huyễn, mang huyết mạch cổ đại, bước lên con đường xưng đế.' },
    { id: mkBId(7),  slug: 'vo-luyen-dinh-phong',       title: 'Võ Luyện Đỉnh Phong',             author: 'Thiên Hạ Bá Xướng',     status: 'ongoing',  views: 390000,  rating: 4.6, chapters: 3456, cats: ['danh-cho-nam','tien-hiep'],            img: null,                                                                                                                                                 desc: 'Dương Khai — thiếu niên tài năng bị phế bỏ, gặp được cơ duyên tu luyện, tiến bước trên đỉnh võ đạo không ai sánh.' },
    { id: mkBId(8),  slug: 'than-dao-de-ton',           title: 'Thần Đạo Đế Tôn',                author: 'Cự Tinh Linh',           status: 'ongoing',  views: 280000,  rating: 4.4, chapters: 890,  cats: ['danh-cho-nam','tien-hiep'],            img: null,                                                                                                                                                 desc: 'Con đường tu thần bắt đầu từ phế nhân không căn cốt, khai mở bí ẩn vũ trụ, chứng đạo đế tôn trên chín tầng thần giới.' },
    { id: mkBId(9),  slug: 'long-vuong-truyen-thuyet',  title: 'Long Vương Truyền Thuyết',        author: 'Mộng Nhập Thần Cơ',     status: 'ongoing',  views: 210000,  rating: 4.3, chapters: 567,  cats: ['danh-cho-nam','di-the-gioi'],          img: null,                                                                                                                                                 desc: 'Thiếu niên mang huyết mạch Long Vương thức tỉnh, bước vào thế giới phép thuật, chinh phục mọi thế lực.' },
    { id: mkBId(10), slug: 'than-mo',                   title: 'Thần Mộ',                         author: 'Thần Đông',              status: 'complete', views: 670000,  rating: 4.7, chapters: 1800, cats: ['danh-cho-nam','tien-hiep'],            img: null,                                                                                                                                                 desc: 'Diệp Tiêu bước vào Thần Mộ — khu mộ của các vị thần, giải khai bí ẩn nguồn gốc thế giới.' },
    { id: mkBId(11), slug: 'co-vo-than-de',             title: 'Cô Vũ Thần Đế',                  author: 'Phong Thanh Dương',      status: 'ongoing',  views: 155000,  rating: 4.3, chapters: 456,  cats: ['danh-cho-nam','kiem-hiep'],            img: null,                                                                                                                                                 desc: 'Cô Phong — thiên tài kiếm thuật bị hại chết, trùng sinh trở lại, quyết tâm báo thù và đạt vô địch thiên hạ.' },
    { id: mkBId(12), slug: 'bat-bai-thanh-than',        title: 'Bất Bại Thành Thần',              author: 'Vạn Gia Bình',           status: 'complete', views: 340000,  rating: 4.5, chapters: 1100, cats: ['danh-cho-nam','do-thi-nam'],           img: null,                                                                                                                                                 desc: 'Đô thị dị năng, chàng trai bình thường giác thức siêu năng lực, bảo vệ thành phố và người thân.' },
    { id: mkBId(13), slug: 'lao-gia-the-gia',           title: 'Lão Gia Thế Gia',                 author: 'Ngã Thị Tiểu Thất',     status: 'ongoing',  views: 320000,  rating: 4.6, chapters: 432,  cats: ['danh-cho-nu','do-thi-ngon-tinh'],      img: null,                                                                                                                                                 desc: 'Hào môn thế gia, tranh đấu quyền lực và tình yêu. Cô gái bình thường bước vào thế giới giới thượng lưu.' },
    { id: mkBId(14), slug: 'mot-thon-tuong-tu',         title: 'Nhất Thốn Tương Tư',              author: 'Cố Mạn',                status: 'complete', views: 890000,  rating: 4.9, chapters: 680,  cats: ['danh-cho-nu','ngon-tinh'],            img: null,                                                                                                                                                 desc: 'Câu chuyện tình yêu ngọt ngào buồn bã suốt mười năm, một tấc tương tư, hai nơi thương đau.' },
    { id: mkBId(15), slug: 'tinh-ra-anh-nhu-the',       title: 'Biết Ra Anh Như Thế',             author: 'Thiên Y Hữu Phong',     status: 'complete', views: 760000,  rating: 4.8, chapters: 520,  cats: ['danh-cho-nu','ngon-tinh'],            img: null,                                                                                                                                                 desc: 'Cô thiết kế thời trang và anh giám đốc lạnh lùng — hôn nhân sắp đặt dần dần trở thành tình yêu thật sự.' },
    { id: mkBId(16), slug: 'xuyen-ve-thoi-co-dai',      title: 'Xuyên Về Thời Cổ Đại Làm Vương Phi', author: 'Linh Tiêu',         status: 'complete', views: 540000,  rating: 4.7, chapters: 890,  cats: ['danh-cho-nu','xuyen-khong','co-dai'], img: null,                                                                                                                                                 desc: 'Cô gái hiện đại xuyên không về cổ đại, trở thành vương phi, dùng trí tuệ hiện đại để tồn tại và yêu.' },
    { id: mkBId(17), slug: 'vo-chong-hoan-my',          title: 'Vợ Chồng Hoàn Mỹ',               author: 'Nhã Lệ',                status: 'ongoing',  views: 410000,  rating: 4.6, chapters: 348,  cats: ['danh-cho-nu','do-thi-ngon-tinh'],      img: null,                                                                                                                                                 desc: 'Hôn nhân sắp đặt giữa hai gia đình danh giá. Tình yêu nảy sinh từ gần gũi.' },
    { id: mkBId(18), slug: 'hoa-tan-dau-quan',          title: 'Hoa Tàn Đầu Quân',               author: 'Mộc Phù Sinh',          status: 'complete', views: 480000,  rating: 4.7, chapters: 760,  cats: ['danh-cho-nu','co-dai'],               img: null,                                                                                                                                                 desc: 'Nữ tướng quân tài ba sống trong thời loạn, bảo vệ giang sơn. Giữa lửa đạn, tình yêu nảy sinh bất ngờ.' },
    { id: mkBId(19), slug: 'ngot-sung-hang-ngay',       title: 'Ngọt Sủng Hằng Ngày',             author: 'Điền Trư Bão Báo',      status: 'ongoing',  views: 290000,  rating: 4.5, chapters: 265,  cats: ['danh-cho-nu','ngot-sung'],            img: null,                                                                                                                                                 desc: 'Tổng tài uy nghiêm ngoài đường, về nhà ngọt sủng vợ mỗi ngày. Cuộc sống hôn nhân ngọt như mật.' },
    { id: mkBId(20), slug: 'to-moc-thanh-huong',        title: 'Tô Mộc Thanh Hương',              author: 'Tam Sinh Tam Thế',      status: 'complete', views: 370000,  rating: 4.6, chapters: 500,  cats: ['danh-cho-nu','xuyen-khong'],          img: null,                                                                                                                                                 desc: 'Linh hồn cô gái hiện đại xuyên không vào tiểu thư bị hại, dùng trí tuệ lật ngược số phận.' },
  ];

  const insBook = db.prepare(`
    INSERT OR REPLACE INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
    VALUES (@id,@slug,@title,@author,@genres,@chapters,@status,@rating,@img,@desc,@category_ids,@views,@created_at)
  `);
  const insChapter = db.prepare(`
    INSERT OR REPLACE INTO chapters(book_slug,ch,title,content,created_at)
    VALUES (@book_slug,@ch,@title,@content,@created_at)
  `);

  const sampleContent = (title, ch) => `<p>Đây là nội dung chương ${ch} của truyện <strong>${title}</strong>.</p><p>Bầu trời xanh thẳm như tấm gương phản chiếu ánh mặt trời buổi sớm. Nhân vật chính bước ra khỏi căn phòng nhỏ, hít thở không khí trong lành và bắt đầu ngày mới đầy thử thách.</p><p>"Hôm nay ta nhất định phải vượt qua giới hạn của mình!" — anh ta tự nhủ, ánh mắt kiên định hướng về phía chân trời xa.</p>`;

  const doSeed = db.transaction(() => {
    booksData.forEach((b, i) => {
      const catIds = b.cats.map(s => catBySlug[s]).filter(Boolean);
      insBook.run({
        id: b.id, slug: b.slug, title: b.title, author: b.author,
        genres: b.cats.slice(1).map(s => subCats.find(c => c.slug === s)?.name || s).join(', '),
        chapters: b.chapters, status: b.status, rating: b.rating,
        img: b.img || null, desc: b.desc,
        category_ids: JSON.stringify(catIds),
        views: b.views,
        created_at: new Date(Date.now() - (booksData.length - i) * 3600000).toISOString(),
      });
      const total = Math.min(b.chapters, 5);
      const chTitles = ['Khởi Đầu', 'Giác Ngộ', 'Thử Thách', 'Đột Phá', 'Bí Ẩn'];
      for (let ch = 1; ch <= total; ch++) {
        insChapter.run({
          book_slug: b.slug, ch,
          title: `Chương ${ch}: ${chTitles[ch - 1]}`,
          content: sampleContent(b.title, ch),
          created_at: new Date(Date.now() - (total - ch) * 86400000).toISOString(),
        });
      }
    });
  });

  doSeed();

  res.json({
    ok: true,
    books: booksData.length,
    categories: subCats.length + 2,
    chapters: booksData.reduce((s, b) => s + Math.min(b.chapters, 5), 0),
  });
});

// ===== HELPERS =====
function toSlug(str) {
  return (str || '').replace(/đ/g,'d').replace(/Đ/g,'D')
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function parseBook(b) {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    genres: b.genres || '',
    chapters: b.chapters || 0,
    status: b.status || 'ongoing',
    rating: b.rating || 4.5,
    img: b.img || null,
    desc: b.desc || '',
    categoryIds: JSON.parse(b.category_ids || '[]'),
    views: b.views || 0,
    createdAt: b.created_at,
  };
}

function parseCat(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon || '📁',
    parent_id: c.parent_id || null,
    showOnHome: !!c.show_on_home,
    order: c.sort_order || 0,
    createdAt: c.created_at,
  };
}

// ===== START =====
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
