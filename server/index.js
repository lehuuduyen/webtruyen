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
