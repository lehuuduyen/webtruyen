import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBooks, getCategories, formatViews, statusLabel } from '@/lib/api';
import BookCard from '@/components/BookCard';
import JsonLd from '@/components/JsonLd';
import type { Book, Category } from '@/lib/types';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Trang Chủ — Đọc Truyện Online Miễn Phí',
  description: 'WebTruyện — Đọc truyện online miễn phí. Hơn 50,000 truyện Tiên Hiệp, Kiếm Hiệp, Ngôn Tình, Đô Thị cập nhật liên tục.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: 'WebTruyện — Đọc Truyện Online Miễn Phí',
    description: 'Hơn 50,000 truyện hay, cập nhật liên tục, hoàn toàn miễn phí.',
  },
};

export default async function HomePage() {
  const [books, categories] = await Promise.all([getBooks(), getCategories()]);

  const rootCats  = categories.filter(c => !c.parent_id && c.showOnHome);
  const allSubCats = categories.filter(c => c.parent_id);

  const byViews  = [...books].sort((a, b) => b.views  - a.views);
  const byRating = [...books].sort((a, b) => b.rating - a.rating);
  const byLatest = [...books].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featured  = byViews[0];
  const spotlight = byViews.slice(1, 5);
  const topRanked = byRating.slice(0, 10);
  const latest    = byLatest.slice(0, 10);

  const booksByRoot = rootCats.map(root => {
    const childIds = allSubCats.filter(c => c.parent_id === root.id).map(c => c.id);
    const catIds   = [root.id, ...childIds];
    const catBooks = books.filter(b => b.categoryIds.some(id => catIds.includes(id)));
    return {
      root,
      children: allSubCats.filter(c => c.parent_id === root.id),
      books: catBooks.slice(0, 10),
      rankings: {
        hot:      [...catBooks].sort((a, b) => b.views  - a.views).slice(0, 8),
        newest:   [...catBooks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
        complete: catBooks.filter(b => b.status === 'complete').sort((a, b) => b.views - a.views).slice(0, 8),
      },
    };
  });

  const totalViews = books.reduce((s, b) => s + b.views, 0);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'WebTruyện',
        url: SITE_URL,
        description: 'Nền tảng đọc truyện online miễn phí Việt Nam',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/tim-kiem?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }} />

      {/* ===== HERO ===== */}
      <Hero totalBooks={books.length} totalViews={totalViews} />

      {/* ===== CATEGORY PILLS ===== */}
      <CategoryNav rootCats={rootCats} subCats={allSubCats} />

      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-10 mt-8">

        {/* ===== SPOTLIGHT ===== */}
        {featured && (
          <section aria-labelledby="spotlight-heading">
            <SectionHeader id="spotlight-heading" emoji="🔥" title="Nổi Bật Nhất" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Hero book */}
              <FeaturedHeroCard book={featured} />
              {/* Side books 2x2 */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                {spotlight.map((b, i) => <BookCard key={b.id} book={b} priority={i < 2} />)}
              </div>
            </div>
          </section>
        )}

        {/* ===== TWO COLUMNS: Latest + Top Ranked ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Mới cập nhật */}
          <section aria-labelledby="latest-heading">
            <SectionHeader id="latest-heading" emoji="⚡" title="Mới Cập Nhật" href="/bang-xep-hang" />
            <div className="space-y-2">
              {latest.slice(0, 8).map((b, i) => (
                <RankRow key={b.id} book={b} rank={i + 1} />
              ))}
            </div>
          </section>

          {/* Đánh giá cao */}
          <section aria-labelledby="top-heading">
            <SectionHeader id="top-heading" emoji="⭐" title="Đánh Giá Cao" href="/bang-xep-hang" />
            <div className="space-y-2">
              {topRanked.slice(0, 8).map((b, i) => (
                <RankRow key={b.id} book={b} rank={i + 1} showRating />
              ))}
            </div>
          </section>
        </div>

        {/* ===== BOOKS BY CATEGORY ===== */}
        {booksByRoot.map(({ root, children, books: catBooks, rankings }) =>
          catBooks.length > 0 ? (
            <section key={root.id} aria-labelledby={`cat-${root.id}`}>
              {/* Header */}
              <SectionHeader
                id={`cat-${root.id}`}
                emoji={root.icon}
                title={root.name}
                href={`/the-loai/${root.slug}`}
                hrefLabel="Xem tất cả"
              />

              {/* Sub-category pills */}
              {children.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5 ml-4">
                  {children.map(c => (
                    <Link
                      key={c.id}
                      href={`/the-loai/${c.slug}`}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-site-card border border-site-border text-gray-400 hover:text-white hover:border-purple-600/60 hover:bg-purple-900/20 transition-all"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Book grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
                {catBooks.map(b => <BookCard key={b.id} book={b} />)}
              </div>

              {/* Rankings */}
              <CategoryRankings
                catName={root.name}
                catSlug={root.slug}
                hot={rankings.hot}
                newest={rankings.newest}
                complete={rankings.complete}
              />
            </section>
          ) : null
        )}
      </div>
    </>
  );
}

/* ─── Category Rankings ───────────────────────────── */
function CategoryRankings({
  catName, catSlug, hot, newest, complete,
}: {
  catName: string; catSlug: string;
  hot: Book[]; newest: Book[]; complete: Book[];
}) {
  const cols = [
    {
      id: 'hot',
      icon: '🔥',
      label: 'Truyện Hot',
      books: hot,
      metric: (b: Book) => formatViews(b.views),
      metricLabel: 'lượt đọc',
      accentClass: 'from-orange-600 to-red-600',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-700/40',
    },
    {
      id: 'new',
      icon: '⚡',
      label: 'Truyện Mới',
      books: newest,
      metric: (b: Book) => new Date(b.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      metricLabel: 'ngày đăng',
      accentClass: 'from-sky-600 to-blue-600',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-700/40',
    },
    {
      id: 'complete',
      icon: '✅',
      label: 'Hoàn Thành',
      books: complete,
      metric: (b: Book) => `${b.chapters.toLocaleString()} ch.`,
      metricLabel: 'số chương',
      accentClass: 'from-emerald-600 to-teal-600',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-700/40',
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-site-border bg-site-card/40">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-site-border flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-indigo-600 inline-block" />
          Bảng xếp hạng — {catName}
        </h3>
        <Link
          href={`/the-loai/${catSlug}`}
          className="text-xs text-purple-400 hover:text-purple-200 transition-colors"
        >
          Xem danh mục →
        </Link>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-site-border">
        {cols.map(col => (
          <div key={col.id}>
            {/* Column header */}
            <div className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${col.accentClass} bg-opacity-10`}>
              <span className="text-base" aria-hidden="true">{col.icon}</span>
              <span className="font-semibold text-white text-sm">{col.label}</span>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-medium ${col.badgeClass}`}>
                Top {col.books.length}
              </span>
            </div>

            {/* Rank list */}
            <ol className="divide-y divide-site-border/50">
              {col.books.length > 0 ? col.books.map((book, i) => (
                <li key={book.id}>
                  <Link
                    href={`/truyen/${book.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                  >
                    {/* Rank */}
                    <span className={`w-5 text-center text-xs font-black shrink-0 ${
                      i === 0 ? 'text-yellow-400' :
                      i === 1 ? 'text-gray-300' :
                      i === 2 ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {i + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900">
                      {book.img && (
                        <Image src={book.img} alt="" fill sizes="32px" className="object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate leading-snug group-hover:text-white transition-colors">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{book.author}</p>
                    </div>

                    {/* Metric */}
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-gray-300">{col.metric(book)}</p>
                    </div>
                  </Link>
                </li>
              )) : (
                <li className="px-4 py-6 text-center text-xs text-gray-600">Chưa có dữ liệu</li>
              )}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────── */
function Hero({ totalBooks, totalViews }: { totalBooks: number; totalViews: number }) {
  return (
    <section
      className="relative overflow-hidden py-6 sm:py-8 px-4"
      style={{ background: 'radial-gradient(ellipse 80% 120% at 50% 0%, #2d1b69 0%, #1a1a2e 60%, #0d0d1a 100%)' }}
      aria-label="WebTruyện banner"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[120px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1.5"
            style={{ background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          🐧 WebTruyện
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          Đọc truyện online miễn phí — {totalBooks.toLocaleString()}+ truyện · {formatViews(totalViews)} lượt đọc
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/tim-kiem"
            className="px-5 py-2 rounded-lg font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            🔍 Tìm truyện
          </Link>
          <Link
            href="/bang-xep-hang"
            className="px-5 py-2 rounded-lg font-semibold text-sm text-gray-300 border border-site-border hover:border-purple-600/60 hover:bg-purple-900/20 transition-all"
          >
            🏆 Xếp hạng
          </Link>
          <Link
            href="/tu-sach"
            className="px-5 py-2 rounded-lg font-semibold text-sm text-gray-300 border border-site-border hover:border-purple-600/60 hover:bg-purple-900/20 transition-all"
          >
            📖 Tủ sách
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Category nav ────────────────────────────────── */
function CategoryNav({ rootCats, subCats }: { rootCats: Category[]; subCats: Category[] }) {
  if (rootCats.length === 0) return null;

  const catColors: Record<number, string> = {
    0: 'from-blue-700 to-indigo-700',
    1: 'from-pink-700 to-rose-700',
    2: 'from-emerald-700 to-teal-700',
    3: 'from-amber-700 to-orange-700',
  };

  return (
    <nav aria-label="Thể loại chính" className="border-t border-b border-site-border bg-site-card/30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rootCats.map((cat, i) => {
            const children = subCats.filter(c => c.parent_id === cat.id);
            const grad = catColors[i % 4];
            return (
              <Link
                key={cat.id}
                href={`/the-loai/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl p-4 border border-site-border hover:border-transparent transition-all duration-300 hover:shadow-lg"
                style={{ background: 'rgba(26,26,46,0.8)' }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                <div className="relative flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white group-hover:text-purple-200 transition-colors">{cat.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {children.slice(0, 3).map(c => c.name).join(' · ')}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ─── Section header ──────────────────────────────── */
function SectionHeader({
  id, emoji, title, href, hrefLabel = 'Xem tất cả →',
}: {
  id: string; emoji: string; title: string; href?: string; hrefLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-400 to-indigo-600 shrink-0" />
      <h2 id={id} className="text-lg font-bold text-white flex items-center gap-2">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h2>
      <div className="flex-1 h-px section-line" />
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs text-purple-400 hover:text-white px-3 py-1 rounded-full border border-purple-800/50 hover:border-purple-500 hover:bg-purple-900/30 transition-all"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

/* ─── Featured hero card ──────────────────────────── */
function FeaturedHeroCard({ book }: { book: Book }) {
  return (
    <article className="lg:col-span-3 group relative rounded-2xl overflow-hidden shadow-2xl min-h-[320px] sm:min-h-[380px]">
      <Link href={`/truyen/${book.slug}`} className="block h-full" aria-label={`Đọc truyện ${book.title}`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
          {book.img && (
            <Image
              src={book.img}
              alt={`Ảnh bìa ${book.title}`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              priority
            />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Hot badge */}
        <div className="absolute top-4 left-4">
          <span className="glow-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
            🔥 Phổ biến nhất
          </span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg leading-tight mb-2 group-hover:text-purple-200 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-gray-300 mb-3">{book.author}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              book.status === 'complete' ? 'bg-emerald-500/80 text-white' : 'bg-sky-500/80 text-white'
            }`}>
              {statusLabel(book.status)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/80 text-yellow-950 font-bold">
              ★ {book.rating.toFixed(1)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
              {book.chapters.toLocaleString()} chương
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
              👁 {formatViews(book.views)}
            </span>
          </div>

          {book.desc && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-4 max-w-lg">{book.desc}</p>
          )}

          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            📖 Đọc ngay
          </span>
        </div>
      </Link>
    </article>
  );
}

/* ─── Rank row ────────────────────────────────────── */
function RankRow({ book, rank, showRating }: { book: Book; rank: number; showRating?: boolean }) {
  const rankColor = rank === 1 ? 'text-yellow-400 font-black' :
                    rank === 2 ? 'text-gray-300 font-black' :
                    rank === 3 ? 'text-amber-600 font-black' :
                    'text-gray-600 font-bold';
  return (
    <Link
      href={`/truyen/${book.slug}`}
      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-site-card border border-transparent hover:border-site-border transition-all"
    >
      {/* Rank number */}
      <span className={`w-6 text-center text-sm shrink-0 ${rankColor}`}>{rank}</span>

      {/* Thumbnail */}
      <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900">
        {book.img && (
          <Image src={book.img} alt="" fill sizes="40px" className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-purple-300 transition-colors leading-snug">
          {book.title}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
      </div>

      {/* Metric */}
      <div className="shrink-0 text-right">
        {showRating ? (
          <span className="text-xs font-bold text-yellow-400">★ {book.rating.toFixed(1)}</span>
        ) : (
          <span className="text-xs text-gray-500">{formatViews(book.views)}</span>
        )}
        <p className={`text-[10px] mt-0.5 ${book.status === 'complete' ? 'text-emerald-500' : 'text-sky-500'}`}>
          {book.status === 'complete' ? 'Full' : 'Đang ra'}
        </p>
      </div>
    </Link>
  );
}

