'use strict';

try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }); } catch {}

const Database = require('better-sqlite3');
const cheerio = require('cheerio');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');


function openDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

function toSlug(str) {
  return (str || '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

// FlareSolverr proxy (optional): set FLARESOLVERR_URL=http://localhost:8191
// Set FLARESOLVERR_ALWAYS=true to skip direct fetch entirely for every request
// Read at call-time so server hot-reload / late dotenv loading works correctly
const FLARESOLVERR_URL  = () => process.env.FLARESOLVERR_URL || '';
const FLARESOLVERR_ALWAYS = () => process.env.FLARESOLVERR_ALWAYS === 'true';

// Active session ID — set by fsCreateSession(), cleared by fsDestroySession()
let _fsSession = null;

async function _fsCall(body) {
  const res = await fetch(`${FLARESOLVERR_URL()}/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(70000),
  });
  const json = await res.json();
  if (json.status !== 'ok') throw new Error(`FlareSolverr: ${json.message || json.status}`);
  return json;
}

async function fsCreateSession(sessionId) {
  if (!FLARESOLVERR_URL()) return;
  try {
    await _fsCall({ cmd: 'sessions.create', session: sessionId });
    _fsSession = sessionId;
    console.log(`[FlareSolverr] Session created: ${sessionId}`);
  } catch (e) {
    console.warn(`[FlareSolverr] Could not create session: ${e.message}`);
  }
}

async function fsDestroySession(sessionId) {
  if (!FLARESOLVERR_URL() || !sessionId) return;
  try {
    await _fsCall({ cmd: 'sessions.destroy', session: sessionId });
    _fsSession = null;
    console.log(`[FlareSolverr] Session destroyed: ${sessionId}`);
  } catch {}
}

async function fetchViaFlareSolverr(url) {
  const body = { cmd: 'request.get', url, maxTimeout: 60000 };
  if (_fsSession) body.session = _fsSession;
  const json = await _fsCall(body);
  return json.solution.response;
}

// Detect Cloudflare JS challenge returned as HTTP 200 (not a real page)
function isCloudflareChallenge(html) {
  return /challenge-platform|cf-chl-bypass|__cf_chl_tk__|jschl-answer|cf_clearance/i.test(html) ||
         /<title>[^<]*(Just a moment|Checking your browser|DDoS protection)[^<]*<\/title>/i.test(html);
}

async function fetchText(url, retries = 3) {
  // ALWAYS mode: skip direct fetch, go straight to FlareSolverr
  if (FLARESOLVERR_ALWAYS() && FLARESOLVERR_URL()) {
    return await fetchViaFlareSolverr(url);
  }

  let origin;
  try { origin = new URL(url).origin; } catch { origin = ''; }

  for (let i = 0; i < retries; i++) {
    const ua = USER_AGENTS[i % USER_AGENTS.length];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Connection': 'keep-alive',
          'DNT': '1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': origin + '/',
          'Origin': origin,
          'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
        },
        signal: AbortSignal.timeout(25000),
      });

      // 403 / 503 → Cloudflare block, try FlareSolverr
      if ((res.status === 403 || res.status === 503) && FLARESOLVERR_URL()) {
        console.log(`[fetchText] HTTP ${res.status} — thử qua FlareSolverr: ${url}`);
        return await fetchViaFlareSolverr(url);
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

      const html = await res.text();

      // 200 but Cloudflare JS challenge page → try FlareSolverr
      if (isCloudflareChallenge(html) && FLARESOLVERR_URL()) {
        console.log(`[fetchText] CF challenge detected — thử qua FlareSolverr: ${url}`);
        return await fetchViaFlareSolverr(url);
      }

      return html;
    } catch (e) {
      if (i === retries - 1) {
        if (/HTTP 40[03]|HTTP 503/.test(e.message) && !FLARESOLVERR_URL()) {
          throw new Error(
            `${e.message}\n` +
            `Site này dùng Cloudflare. Để bypass, chạy FlareSolverr:\n` +
            `  docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest\n` +
            `Sau đó thêm FLARESOLVERR_URL=http://localhost:8191 vào file server/.env`
          );
        }
        // Enhance generic "fetch failed" with the actual underlying cause
        if (e.cause) {
          const cause = e.cause.message || e.cause.code || String(e.cause);
          throw new Error(`fetch failed — ${cause} (${url})`);
        }
        throw new Error(`${e.message} (${url})`);
      }
      await delay(3000 * (i + 1));
    }
  }
}

function parseSitemapUrls(xml) {
  const matches = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)];
  return matches.map(m => m[1].trim()).filter(u => /^https?:\/\//.test(u));
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml);
}

// Fetch and flatten: if url is a sitemapindex, recursively fetch sub-sitemaps up to depth 2
async function fetchAllSitemapUrls(url, depth = 0) {
  const xml = await fetchText(url);
  const urls = parseSitemapUrls(xml);
  if (!isSitemapIndex(xml) || depth >= 2) return { xml, urls };

  // It's an index — fetch each sub-sitemap and merge
  const all = [];
  for (const subUrl of urls) {
    try {
      const sub = await fetchText(subUrl);
      all.push(...parseSitemapUrls(sub));
    } catch (e) {
      console.warn(`[Sitemap] Could not fetch sub-sitemap ${subUrl}: ${e.message}`);
    }
  }
  return { xml, urls: all };
}

function extractSlug(url) {
  const part = url.split('/').filter(Boolean).pop() || '';
  return toSlug(part.replace(/\.(html?|php)(\?.*)?$/, '').replace(/-\d+$/, s => s));
}

function scrapeNovel(html, url) {
  const $ = cheerio.load(html);

  const title =
    $('h3[itemprop="name"]').text().trim() ||
    $('h1.title-detail').text().trim() ||
    $('h1[itemprop="name"]').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim();

  const author =
    $('a[itemprop="author"]').first().text().trim() ||
    $('[itemprop="author"]').first().text().trim() ||
    $('a[href*="tac-gia"]').first().text().trim() ||
    'Đang cập nhật';

  const img =
    $('meta[property="og:image"]').attr('content') ||
    $('img[itemprop="image"]').attr('src') ||
    $('img.img-thumbnail').attr('src') ||
    null;

  const rawDesc =
    $('[itemprop="description"]').text().trim() ||
    $('meta[name="description"]').attr('content') ||
    '';
  const desc = rawDesc.slice(0, 2000);

  // truyenfull.today: "Trạng thái:</h3><span>Đang ra" — skip the closing/opening tag
  const statusText = (
    html.match(/Trạng\s*thái[^<]*<[^>]*>\s*<[^>]*>([^<]+)/i) ||
    html.match(/Trạng\s*thái[^<]*<[^>]*>([^<]+)/i)
  )?.[1]?.trim() || '';
  const status = /hoàn\s*thành|complete|full/i.test(statusText) ? 'complete' : 'ongoing';

  const genres = [];
  // Use itemprop="genre" first (precise); fall back to info-section links only
  const genreEls = $('a[itemprop="genre"]');
  (genreEls.length ? genreEls : $('.info a[href*="the-loai"], .kind a, .genres a')).each((_, el) => {
    const name = $(el).text().trim();
    if (name && name.length < 40 && !genres.includes(name)) genres.push(name);
  });

  // Chapter count: "100 chương" pattern
  const chText = html.match(/(\d+)\s*chương/i)?.[1] || '';
  const chapters = parseInt(chText) || 0;

  const slug = extractSlug(url);

  return { title: title.trim(), author: author.trim(), img, desc, status, genres, chapters, slug };
}

// Parse novel URLs from a truyenfull.today listing page
function parseListingPageUrls(html) {
  const $ = cheerio.load(html);
  const urls = [];
  const seen = new Set();

  // Primary: rows inside .list-truyen container
  $('.list-truyen .row[itemtype], .list-truyen .row').each((_, row) => {
    $(row).find('a[href]').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (/^https:\/\/truyenfull\.today\/[a-z0-9][a-z0-9-]*\/$/.test(href) && !seen.has(href)) {
        seen.add(href);
        urls.push(href);
      }
    });
  });

  // Fallback: all links matching novel URL pattern (not section pages)
  if (urls.length < 5) {
    const SKIP = /\/(danh-sach|the-loai|tac-gia|tim-kiem|hoan|dang-ra|login|register|ajax)\//;
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (/^https:\/\/truyenfull\.today\/[a-z0-9][a-z0-9-]*\/$/.test(href) &&
          !SKIP.test(href) && !seen.has(href)) {
        seen.add(href);
        urls.push(href);
      }
    });
  }

  return urls;
}

async function run({ sitemapUrl, limit = 50, delayMs = 1500, onProgress } = {}) {
  const sessionId = FLARESOLVERR_URL() ? `run-${Date.now()}` : null;
  if (sessionId) await fsCreateSession(sessionId);
  const db = openDb();
  const upsertBook = db.prepare(`
    INSERT INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
    VALUES(@id,@slug,@title,@author,@genres,@chapters,@status,4.5,@img,@desc,'[]',0,@created_at)
    ON CONFLICT(slug) DO UPDATE SET
      title   = excluded.title,
      author  = excluded.author,
      genres  = excluded.genres,
      status  = excluded.status,
      img     = excluded.img,
      desc    = excluded.desc
    WHERE books.author = 'Đang cập nhật' AND books.desc = '' AND books.img IS NULL
  `);
  // Chỉ skip nếu sách đã có dữ liệu thật (không phải skeleton)
  const existsReal = db.prepare(
    "SELECT id FROM books WHERE slug = ? AND NOT (author = 'Đang cập nhật' AND desc = '' AND img IS NULL)"
  );

  console.log(`[Scraper] Fetching sitemap: ${sitemapUrl}`);
  const { urls: allUrls } = await fetchAllSitemapUrls(sitemapUrl);
  const urls = allUrls.slice(0, limit);
  console.log(`[Scraper] Found ${allUrls.length} URLs, processing ${urls.length}`);

  let added = 0, skipped = 0, failed = 0;
  const total = urls.length;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const current = i + 1;
    if (onProgress) onProgress({ total, current, added, skipped, failed });

    const preSlug = extractSlug(url);
    if (preSlug && existsReal.get(preSlug)) {
      console.log(`[${current}/${total}] Skip (exists): ${preSlug}`);
      skipped++;
      continue;
    }

    try {
      console.log(`[${current}/${total}] Scraping: ${url}`);
      const html = await fetchText(url);
      const data = scrapeNovel(html, url);

      if (!data.title || !data.slug) {
        console.log(`  → Skip (no title/slug)`);
        skipped++;
        continue;
      }

      if (existsReal.get(data.slug)) {
        console.log(`  → Skip (exists): ${data.slug}`);
        skipped++;
        continue;
      }

      const info = upsertBook.run({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        slug: data.slug,
        title: data.title,
        author: data.author,
        genres: data.genres.slice(0, 5).join(', '),
        chapters: data.chapters,
        status: data.status,
        img: data.img || null,
        desc: data.desc,
        created_at: new Date().toISOString(),
      });
      added++;
      const action = info.changes > 0 && info.lastInsertRowid === 0 ? 'Cập nhật skeleton' : 'Đã thêm';
      console.log(`  → ${action}: ${data.title}`);
    } catch (e) {
      console.error(`  → Lỗi: ${e.message}`);
      failed++;
    }

    if (i < urls.length - 1) await delay(delayMs);
  }

  if (sessionId) await fsDestroySession(sessionId);
  const result = { added, skipped, failed, total };
  console.log(`[Scraper] Xong: ${added} thêm mới, ${skipped} bỏ qua, ${failed} lỗi`);
  return result;
}

// ===== CHAPTER SCRAPING =====

function parseChapterUrl(url) {
  let m;

  // /truyen/slug/chuong/N  (our own format — check first, most specific)
  m = url.match(/\/truyen\/([^/]+)\/chuong\/(\d+)/i);
  if (m) return { bookSlug: m[1], ch: parseInt(m[2]) };

  // /truyen/slug/chuong-N
  m = url.match(/\/truyen\/([^/]+)\/chuong[_-](\d+)/i);
  if (m) return { bookSlug: m[1], ch: parseInt(m[2]) };

  // /slug/chapter-N  or  /slug/chapter-N/
  m = url.match(/\/([^/]+)\/chapter[_-](\d+)/i);
  if (m) return { bookSlug: toSlug(m[1]), ch: parseInt(m[2]) };

  // /slug/chuong-N/
  m = url.match(/\/([^/]+)\/chuong[_-](\d+)/i);
  if (m) return { bookSlug: toSlug(m[1]), ch: parseInt(m[2]) };

  // /slug/c-N/
  m = url.match(/\/([^/]+)\/c[_-](\d+)/i);
  if (m) return { bookSlug: toSlug(m[1]), ch: parseInt(m[2]) };

  // /read/slug/chapter-N or /doc/slug/chapter-N
  m = url.match(/\/(?:read|doc|xem)\/([^/]+)\/(?:chapter|chuong)[_-](\d+)/i);
  if (m) return { bookSlug: toSlug(m[1]), ch: parseInt(m[2]) };

  // /prefix/slug-chap-N or /prefix/slug-chap-N-part (truyenqqko, mangatoon, v.v.)
  // e.g. /truyen-tranh/co-ban-gai-hai-mat-18159-chap-132
  // e.g. /truyen-tranh/ten-truyen-15807-chap-37-4
  m = url.match(/\/([^/]+-chap-(\d+)(?:-\d+)?)\/?$/i);
  if (m) {
    const bookSlug = toSlug(m[1].replace(/-chap-\d+(?:-\d+)?$/i, ''));
    const ch = parseInt(m[2]);
    if (bookSlug && ch >= 1) return { bookSlug, ch };
  }

  // /slug/N/ or /slug/N.html (pure number — only when N >= 1 and segment is purely numeric)
  m = url.replace(/\.html?(\?.*)?$/, '/').match(/\/([^/]+)\/(\d{1,6})\/?$/);
  if (m && parseInt(m[2]) >= 1) {
    const bookSlug = toSlug(m[1]);
    // Exclude likely non-chapter paths
    if (!/^(?:page|trang|p|tag|the-loai|category|search|tim-kiem|danh-sach|list)$/i.test(bookSlug)) {
      return { bookSlug, ch: parseInt(m[2]) };
    }
  }

  return null;
}

function scrapeChapterContent(html) {
  const $ = cheerio.load(html);

  const title =
    $('h2.chapter-title').text().trim() ||
    $('.chapter-title').first().text().trim() ||
    $('h2.chr-title').text().trim() ||
    $('[class*="chapter-title"]').first().text().trim() ||
    $('[class*="chapter-name"]').first().text().trim() ||
    $('h2[class*="chapter"]').first().text().trim() ||
    $('h1[class*="chapter"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    '';

  // Remove ads, scripts, nav elements before extracting text
  $('script,style,nav,header,footer,.ads,.advertisement,[class*="ads"],[id*="ads"],' +
    '.chapter-nav,.chapter-navigation,.nav-chapter,.pagination,.paging,' +
    '[class*="toolbar"],[class*="social"],[class*="share"],[class*="comment"],' +
    '[id*="comment"],[id*="disqus"]').remove();

  const content =
    $('#chapter-c').html() ||
    $('.chapter-c').html() ||
    $('.chapter-content').html() ||
    $('#bookContentBody').html() ||
    $('.reading-content').html() ||
    $('.chapter-text').html() ||
    $('.chapter-body').html() ||
    $('[id*="chapter-content"]').first().html() ||
    $('[class*="chapter-content"]').first().html() ||
    $('[id*="story-body"]').first().html() ||
    // metruyenchu / tangthuvien style
    $('.box-chap').html() ||
    $('#noidung').html() ||
    $('#content').html() ||
    $('.post-content').html() ||
    $('article .entry-content').html() ||
    $('[id*="content-chapter"]').first().html() ||
    $('[class*="content-chapter"]').first().html() ||
    $('[id*="chapter"]').first().html() ||
    '';

  // Convert HTML to plain text (preserve paragraphs)
  const text = content
    ? cheerio.load(content)('*').not('script,style').map((_, el) => {
        const tag = el.tagName?.toLowerCase();
        const t = cheerio.load(el).text().trim();
        if (!t) return '';
        return (tag === 'p' || tag === 'div' || tag === 'br') ? t + '\n' : t + ' ';
      }).get().join('').replace(/\n{3,}/g, '\n\n').trim()
    : '';

  return { title, content: text.slice(0, 200000) };
}

async function runChapters({ sitemapUrl, limit = 200, delayMs = 1000, onProgress } = {}) {
  const sessionId = FLARESOLVERR_URL() ? `chapters-${Date.now()}` : null;
  if (sessionId) await fsCreateSession(sessionId);
  const db = openDb();

  const upsertChapter = db.prepare(`
    INSERT INTO chapters(book_slug,ch,title,content,created_at) VALUES(@book_slug,@ch,@title,@content,@created_at)
    ON CONFLICT(book_slug,ch) DO UPDATE SET title=excluded.title, content=excluded.content
  `);
  const getBookBySlug = db.prepare('SELECT id FROM books WHERE slug = ?');
  const existsChapter = db.prepare('SELECT 1 FROM chapters WHERE book_slug = ? AND ch = ? AND length(content) > 0');
  const insertBookSkeleton = db.prepare(`
    INSERT OR IGNORE INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
    VALUES(@id,@slug,@title,'Đang cập nhật','',0,'ongoing',4.5,null,'','[]',0,@created_at)
  `);
  const updateChapterCount = db.prepare('UPDATE books SET chapters = (SELECT COUNT(*) FROM chapters WHERE book_slug = ?) WHERE slug = ?');

  console.log(`[ChapterScraper] Fetching sitemap: ${sitemapUrl}`);
  const { urls: rawUrls } = await fetchAllSitemapUrls(sitemapUrl);
  // Pre-filter to chapter-parseable URLs so non-chapter entries don't eat the limit
  const allUrls = rawUrls.filter(u => parseChapterUrl(u) !== null);
  const urls = allUrls.slice(0, limit);
  console.log(`[ChapterScraper] Found ${rawUrls.length} total, ${allUrls.length} chapter URLs, processing ${urls.length}`);

  let added = 0, skipped = 0, failed = 0;
  const total = urls.length;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const current = i + 1;
    if (onProgress) onProgress({ total, current, added, skipped, failed });

    const parsed = parseChapterUrl(url);
    if (!parsed) {
      console.log(`[${current}/${total}] Skip (can't parse): ${url}`);
      skipped++;
      continue;
    }

    const { bookSlug, ch } = parsed;

    // Skip if chapter already exists with content
    if (existsChapter.get(bookSlug, ch)) {
      console.log(`[${current}/${total}] Skip (exists): ${bookSlug} ch.${ch}`);
      skipped++;
      continue;
    }

    // Create book skeleton if not exists
    if (!getBookBySlug.get(bookSlug)) {
      const prettyTitle = bookSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      insertBookSkeleton.run({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        slug: bookSlug,
        title: prettyTitle,
        created_at: new Date().toISOString(),
      });
      console.log(`  → Tạo book skeleton: ${bookSlug}`);
    }

    try {
      console.log(`[${current}/${total}] Scraping: ${url}`);
      const html = await fetchText(url);
      const { title, content } = scrapeChapterContent(html);

      upsertChapter.run({
        book_slug: bookSlug,
        ch,
        title: title || `Chương ${ch}`,
        content,
        created_at: new Date().toISOString(),
      });
      updateChapterCount.run(bookSlug, bookSlug);
      added++;
      console.log(`  → Đã thêm: ${bookSlug} ch.${ch}`);
    } catch (e) {
      console.error(`  → Lỗi: ${e.message}`);
      failed++;
    }

    if (i < urls.length - 1) await delay(delayMs);
  }

  if (sessionId) await fsDestroySession(sessionId);
  const result = { added, skipped, failed, total };
  console.log(`[ChapterScraper] Xong: ${added} thêm mới, ${skipped} bỏ qua, ${failed} lỗi`);
  return result;
}

// CLI: node scraper.js <sitemapUrl> [limit] [delayMs]
if (require.main === module) {
  const [,, sitemapUrl = 'https://truyenqqko.com/sitemap-comic-new.xml', limit = '20', delayMs = '1500'] = process.argv;
  run({ sitemapUrl, limit: parseInt(limit), delayMs: parseInt(delayMs) })
    .catch(e => { console.error(e); process.exit(1); });
}

// ===== TARGETED CRAWL — reads listing pages, stops after targetNew new books =====

async function runTargeted({ listingBaseUrl, targetNew = 100, startPage = 1, startOffset = 0, delayMs = 1200, stopFlag = {}, onProgress } = {}) {
  const sessionId = FLARESOLVERR_URL() ? `targeted-${Date.now()}` : null;
  if (sessionId) await fsCreateSession(sessionId);
  const db = openDb();
  const upsertBook = db.prepare(`
    INSERT INTO books(id,slug,title,author,genres,chapters,status,rating,img,desc,category_ids,views,created_at)
    VALUES(@id,@slug,@title,@author,@genres,@chapters,@status,4.5,@img,@desc,'[]',0,@created_at)
    ON CONFLICT(slug) DO UPDATE SET
      title   = excluded.title,
      author  = excluded.author,
      genres  = excluded.genres,
      status  = excluded.status,
      img     = excluded.img,
      desc    = excluded.desc
    WHERE books.author = 'Đang cập nhật' AND books.desc = '' AND books.img IS NULL
  `);
  const existsReal = db.prepare(
    "SELECT id FROM books WHERE slug = ? AND NOT (author = 'Đang cập nhật' AND desc = '' AND img IS NULL)"
  );

  let added = 0, skipped = 0, failed = 0;
  let page = startPage;
  let offset = startOffset;
  let total = 0;
  let exhausted = false;

  outerLoop:
  while (added < targetNew && !stopFlag.stop) {
    const pageUrl = `${listingBaseUrl}trang-${page}/`;
    console.log(`[TF] Fetching listing page ${page}: ${pageUrl}`);

    let pageHtml;
    try {
      pageHtml = await fetchText(pageUrl);
    } catch (e) {
      console.error(`[TF] Error fetching page ${page}: ${e.message}`);
      break;
    }

    const allUrls = parseListingPageUrls(pageHtml);
    if (allUrls.length === 0) {
      console.log(`[TF] No novel URLs found on page ${page} — stopping`);
      exhausted = true;
      break;
    }

    total = allUrls.length;
    let i = offset;

    while (i < allUrls.length && added < targetNew && !stopFlag.stop) {
      const url = allUrls[i];
      if (onProgress) onProgress({ total, current: i - offset + 1 + (page - startPage) * 37, added, skipped, failed });

      const preSlug = extractSlug(url);
      if (preSlug && existsReal.get(preSlug)) {
        skipped++;
        i++;
        continue;
      }

      try {
        console.log(`[TF][page ${page}, ${i + 1}/${allUrls.length}] Scraping: ${url}`);
        const html = await fetchText(url);
        const data = scrapeNovel(html, url);

        if (!data.title || !data.slug || existsReal.get(data.slug)) {
          skipped++;
        } else {
          upsertBook.run({
            id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            slug: data.slug, title: data.title, author: data.author,
            genres: data.genres.slice(0, 5).join(', '), chapters: data.chapters,
            status: data.status, img: data.img || null, desc: data.desc,
            created_at: new Date().toISOString(),
          });
          added++;
          console.log(`  → +${added}/${targetNew}: ${data.title}`);
        }
      } catch (e) {
        console.error(`  → Lỗi: ${e.message}`);
        failed++;
      }

      i++;
      if (added < targetNew && !stopFlag.stop) await delay(delayMs);
    }

    if (i >= allUrls.length) {
      // This listing page is fully consumed, advance to next
      page++;
      offset = 0;
    } else {
      // Stopped mid-page (targetNew reached or stopFlag)
      offset = i;
      break outerLoop;
    }
  }

  db.close();
  if (sessionId) await fsDestroySession(sessionId);
  const result = { added, skipped, failed, total, nextPage: page, nextOffset: offset, exhausted };
  console.log(`[TF] Xong: +${added} mới, ${skipped} bỏ qua, ${failed} lỗi, page=${page}, offset=${offset}`);
  return result;
}

module.exports = { run, runChapters, runTargeted, fsCreateSession, fsDestroySession };
