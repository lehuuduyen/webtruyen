'use strict';
// Script nhập danh sách thể loại từ TruyenQQ vào database
// Chạy: node server/import-categories.js

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

const CATEGORIES = [
  { slug: 'action',              name: 'Hành Động',              icon: '⚔️' },
  { slug: 'adventure',           name: 'Phiêu Lưu',              icon: '🗺️' },
  { slug: 'anime',               name: 'Anime',                   icon: '🎌' },
  { slug: 'chuyen-sinh',         name: 'Chuyển Sinh',             icon: '♻️' },
  { slug: 'comedy',              name: 'Hài Hước',                icon: '😄' },
  { slug: 'comic',               name: 'Comic',                   icon: '📚' },
  { slug: 'cooking',             name: 'Nấu Ăn',                  icon: '🍳' },
  { slug: 'dam-my',              name: 'Đam Mỹ',                  icon: '💙' },
  { slug: 'doujinshi',           name: 'Doujinshi',               icon: '📖' },
  { slug: 'drama',               name: 'Kịch Tính',               icon: '🎭' },
  { slug: 'ecchi',               name: 'Ecchi',                   icon: '🌶️' },
  { slug: 'fantasy',             name: 'Giả Tưởng',               icon: '🔮' },
  { slug: 'gender-bender',       name: 'Chuyển Giới',             icon: '🔄' },
  { slug: 'harem',               name: 'Harem',                   icon: '👑' },
  { slug: 'historical',          name: 'Lịch Sử',                 icon: '🏛️' },
  { slug: 'horror',              name: 'Kinh Dị',                 icon: '👻' },
  { slug: 'josei',               name: 'Josei',                   icon: '💄' },
  { slug: 'live-action',         name: 'Live Action',             icon: '🎬' },
  { slug: 'manga',               name: 'Manga',                   icon: '📕' },
  { slug: 'manhua',              name: 'Manhua',                  icon: '📗' },
  { slug: 'manhwa',              name: 'Manhwa',                  icon: '📘' },
  { slug: 'martial-arts',        name: 'Võ Thuật',                icon: '🥊' },
  { slug: 'mature',              name: 'Trưởng Thành',            icon: '⚠️' },
  { slug: 'mecha',               name: 'Mecha',                   icon: '🤖' },
  { slug: 'mystery',             name: 'Bí Ẩn',                   icon: '🔍' },
  { slug: 'one-shot',            name: 'One Shot',                icon: '⚡' },
  { slug: 'psychological',       name: 'Tâm Lý',                  icon: '🧠' },
  { slug: 'romance',             name: 'Lãng Mạn',                icon: '❤️' },
  { slug: 'school-life',         name: 'Học Đường',               icon: '🏫' },
  { slug: 'sci-fi',              name: 'Khoa Học Viễn Tưởng',     icon: '🚀' },
  { slug: 'seinen',              name: 'Seinen',                  icon: '👨' },
  { slug: 'shoujo',              name: 'Shoujo',                  icon: '🌸' },
  { slug: 'shoujo-ai',           name: 'Shoujo Ai',               icon: '🌷' },
  { slug: 'shounen',             name: 'Shounen',                 icon: '💪' },
  { slug: 'shounen-ai',          name: 'Shounen Ai',              icon: '🌟' },
  { slug: 'slice-of-life',       name: 'Cuộc Sống Hàng Ngày',    icon: '☀️' },
  { slug: 'smut',                name: 'Smut',                    icon: '🔥' },
  { slug: 'soft-yaoi',           name: 'Soft Yaoi',               icon: '💙' },
  { slug: 'soft-yuri',           name: 'Soft Yuri',               icon: '💗' },
  { slug: 'sports',              name: 'Thể Thao',                icon: '⚽' },
  { slug: 'supernatural',        name: 'Siêu Nhiên',              icon: '👁️' },
  { slug: 'tap-chi-truyen-tranh',name: 'Tạp Chí Truyện Tranh',   icon: '📰' },
  { slug: 'thieu-nhi',           name: 'Thiếu Nhi',               icon: '🧒' },
  { slug: 'tragedy',             name: 'Bi Kịch',                 icon: '💔' },
  { slug: 'trinh-tham',          name: 'Trinh Thám',              icon: '🕵️' },
  { slug: 'truyen-mau',          name: 'Truyện Màu',              icon: '🎨' },
  { slug: 'truyen-scan',         name: 'Truyện Scan',             icon: '📷' },
  { slug: 'viet-nam',            name: 'Việt Nam',                icon: '🇻🇳' },
  { slug: 'webtoon',             name: 'Webtoon',                 icon: '📱' },
  { slug: 'adult',               name: '18+',                     icon: '🔞' },
  { slug: 'co-dai',              name: 'Cổ Đại',                  icon: '🏯' },
  { slug: 'ngon-tinh',           name: 'Ngôn Tình',               icon: '💕' },
  { slug: 'xuyen-khong',         name: 'Xuyên Không',             icon: '🌀' },
];

function main() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  const existing = new Set(
    db.prepare('SELECT slug FROM categories').all().map(r => r.slug)
  );

  const insert = db.prepare(`
    INSERT INTO categories(id, slug, name, icon, parent_id, show_on_home, sort_order, created_at)
    VALUES(@id, @slug, @name, @icon, NULL, 0, 0, @created_at)
  `);

  let added = 0, skipped = 0;

  const insertMany = db.transaction(() => {
    for (const cat of CATEGORIES) {
      if (existing.has(cat.slug)) {
        console.log(`  skip (exists): ${cat.slug}`);
        skipped++;
        continue;
      }
      insert.run({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        created_at: new Date().toISOString(),
      });
      console.log(`  + ${cat.slug} → ${cat.name}`);
      added++;
    }
  });

  insertMany();
  db.close();

  console.log(`\nXong: +${added} mới, ${skipped} bỏ qua`);
}

main();
