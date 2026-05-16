import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBook, getBooks, getChapterList, getCategories, statusLabel, formatViews } from '@/lib/api';
import BookCard from '@/components/BookCard';
import JsonLd from '@/components/JsonLd';
import BookshelfButton from '@/components/BookshelfButton';
import ChapterList from '@/components/ChapterList';
import type { Category } from '@/lib/types';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: 'Không tìm thấy truyện' };

  const title = `Đọc Truyện ${book.title} — ${book.author}`;
  const description = book.desc
    ? `${book.desc.slice(0, 150)}...`
    : `Đọc truyện ${book.title} của tác giả ${book.author} tại WebTruyện. ${book.chapters} chương, ${statusLabel(book.status)}.`;
  const url = `${SITE_URL}/truyen/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'book',
      url,
      title,
      description,
      ...(book.img ? { images: [{ url: book.img, alt: `Ảnh bìa ${book.title}` }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(book.img ? { images: [book.img] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const books = await getBooks();
  return books.map(b => ({ slug: b.slug }));
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const [book, chapters, categories] = await Promise.all([
    getBook(slug),
    getChapterList(slug),
    getCategories(),
  ]);
  if (!book) notFound();

  const allBooks = await getBooks();
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const similar = allBooks
    .filter(b => b.slug !== slug && b.categoryIds.some(id => book.categoryIds.includes(id)))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const bookCats = book.categoryIds.map(id => catMap[id]).filter(Boolean) as Category[];
  const primaryCat = bookCats[0];
  const url = `${SITE_URL}/truyen/${slug}`;

  const firstCh = chapters[0];
  const lastCh  = chapters[chapters.length - 1];

  // Star rating helper
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = book.rating >= i + 1;
    const half   = !filled && book.rating >= i + 0.5;
    return filled ? 'full' : half ? 'half' : 'empty';
  });

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.title,
        author: { '@type': 'Person', name: book.author },
        description: book.desc,
        url,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: book.rating,
          bestRating: 5,
          ratingCount: Math.max(book.views, 1),
        },
        numberOfPages: book.chapters,
        inLanguage: 'vi',
        ...(book.img ? { image: book.img } : {}),
      }} />

      {/* ── HERO BANNER ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 320 }}>
        {/* Blurred cover backdrop */}
        {book.img && (
          <div className="absolute inset-0">
            <Image
              src={book.img}
              alt=""
              fill
              sizes="100vw"
              className="object-cover scale-110 blur-2xl opacity-25"
              priority
            />
          </div>
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-site-bg via-site-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-site-bg/60 to-transparent" />

        {/* Breadcrumb */}
        <div className="relative max-w-6xl mx-auto px-4 pt-4">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex flex-wrap items-center gap-1 mb-6">
            <Link href="/" className="hover:text-purple-400 transition-colors">Trang Chủ</Link>
            {primaryCat && (
              <>
                <span className="text-gray-700">›</span>
                <Link href={`/the-loai/${primaryCat.slug}`} className="hover:text-purple-400 transition-colors">
                  {primaryCat.name}
                </Link>
              </>
            )}
            <span className="text-gray-700">›</span>
            <span className="text-gray-300 truncate max-w-[200px]">{book.title}</span>
          </nav>

          {/* Hero content */}
          <div className="flex flex-row gap-4 sm:gap-6 pb-8 sm:pb-10 items-end">
            {/* Cover */}
            <div className="shrink-0">
              <div className="relative w-[110px] sm:w-[200px] aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                   style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                {book.img ? (
                  <Image
                    src={book.img}
                    alt={`Ảnh bìa ${book.title}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                    <span className="text-6xl font-black text-white/10 select-none">
                      {book.title[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-end">
              {/* Category tags */}
              {bookCats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {bookCats.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/the-loai/${cat.slug}`}
                      className="text-[11px] px-2.5 py-0.5 rounded-full border border-purple-700/50 bg-purple-900/30 text-purple-300 hover:bg-purple-700/40 transition-colors"
                    >
                      {cat.icon} {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="text-lg sm:text-4xl font-black text-white leading-tight mb-1 drop-shadow-lg">
                {book.title}
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-4">
                Tác giả: <span className="text-gray-200 font-medium">{book.author}</span>
              </p>

              {/* Star rating */}
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${book.rating}/5`}>
                  {stars.map((s, i) => (
                    <svg key={i} className={`w-4 h-4 ${s === 'empty' ? 'text-gray-700' : 'text-yellow-400'}`}
                         fill={s === 'empty' ? 'none' : s === 'full' ? 'currentColor' : 'url(#half)'}
                         viewBox="0 0 20 20">
                      {s === 'half' && (
                        <defs>
                          <linearGradient id="half">
                            <stop offset="50%" stopColor="currentColor"/>
                            <stop offset="50%" stopColor="transparent"/>
                          </linearGradient>
                        </defs>
                      )}
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-yellow-400 font-bold text-sm">{book.rating.toFixed(1)}</span>
                <span className="text-gray-600 text-xs">/5.0</span>
              </div>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-5">
                <StatChip
                  value={statusLabel(book.status)}
                  color={book.status === 'complete' ? 'emerald' : 'sky'}
                />
                <StatChip icon="📖" value={`${book.chapters.toLocaleString()} chương`} />
                <StatChip icon="👁" value={`${formatViews(book.views)} lượt đọc`} />
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2">
                {firstCh && (
                  <Link
                    href={`/truyen/${slug}/chuong/${firstCh.ch}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  >
                    <span>📖</span> Đọc từ đầu
                  </Link>
                )}
                {lastCh && lastCh.ch !== firstCh?.ch && (
                  <Link
                    href={`/truyen/${slug}/chuong/${lastCh.ch}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-200 border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <span>⚡</span> Chương mới nhất
                  </Link>
                )}
                <BookshelfButton book={book} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: main content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            {book.desc && (
              <section aria-labelledby="desc-heading">
                <SectionLabel id="desc-heading" text="Giới Thiệu" />
                <div className="bg-site-card/50 border border-site-border rounded-2xl p-5">
                  <p className="text-gray-300 text-sm leading-[1.9]">{book.desc}</p>
                </div>
              </section>
            )}

            {/* Chapter list */}
            {chapters.length > 0 && (
              <section aria-labelledby="chapters-heading">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel id="chapters-heading" text={`Danh Sách Chương (${chapters.length})`} />
                </div>

                {/* Quick jump */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {firstCh && (
                    <Link
                      href={`/truyen/${slug}/chuong/${firstCh.ch}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/30 border border-purple-700/40 text-purple-300 hover:bg-purple-700/30 transition-colors"
                    >
                      ↩ Chương đầu
                    </Link>
                  )}
                  {lastCh && lastCh.ch !== firstCh?.ch && (
                    <Link
                      href={`/truyen/${slug}/chuong/${lastCh.ch}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-sky-900/30 border border-sky-700/40 text-sky-300 hover:bg-sky-700/30 transition-colors"
                    >
                      ⚡ Chương mới nhất
                    </Link>
                  )}
                </div>

                <ChapterList slug={slug} chapters={chapters} />
              </section>
            )}

            {/* Similar books */}
            {similar.length > 0 && (
              <section aria-labelledby="similar-heading">
                <SectionLabel id="similar-heading" text="Có Thể Bạn Thích" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {similar.slice(0, 8).map(b => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: sidebar ── */}
          <aside className="space-y-5">

            {/* Book stats card */}
            <div className="bg-site-card border border-site-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-site-border">
                <h3 className="text-sm font-bold text-white">Thông Tin Truyện</h3>
              </div>
              <dl className="divide-y divide-site-border/50">
                {[
                  { label: 'Tác giả',      value: book.author },
                  { label: 'Trạng thái',   value: statusLabel(book.status),
                    accent: book.status === 'complete' ? 'text-emerald-400' : 'text-sky-400' },
                  { label: 'Số chương',    value: book.chapters.toLocaleString() },
                  { label: 'Đánh giá',     value: `⭐ ${book.rating.toFixed(1)} / 5.0`, accent: 'text-yellow-400' },
                  { label: 'Lượt đọc',     value: formatViews(book.views) },
                  { label: 'Cập nhật',     value: new Date(book.createdAt).toLocaleDateString('vi-VN') },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <dt className="text-xs text-gray-500 shrink-0">{row.label}</dt>
                    <dd className={`text-xs font-medium text-right truncate ${row.accent ?? 'text-gray-200'}`}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Thể loại */}
            {bookCats.length > 0 && (
              <div className="bg-site-card border border-site-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Thể Loại</h3>
                <div className="flex flex-wrap gap-2">
                  {bookCats.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/the-loai/${cat.slug}`}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-purple-700/50 bg-purple-900/20 text-purple-300 hover:bg-purple-700/30 transition-colors"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent chapters sidebar */}
            {chapters.length > 0 && (
              <div className="bg-site-card border border-site-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-site-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Chương Mới Nhất</h3>
                </div>
                <div className="divide-y divide-site-border/50">
                  {[...chapters].slice(-5).reverse().map(ch => (
                    <Link
                      key={ch.ch}
                      href={`/truyen/${slug}/chuong/${ch.ch}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-900/20 transition-colors group"
                    >
                      <span className="text-[10px] font-mono text-gray-600 w-6 shrink-0">{ch.ch}</span>
                      <span className="text-xs text-gray-300 group-hover:text-white transition-colors flex-1 truncate">
                        {ch.title}
                      </span>
                    </Link>
                  ))}
                </div>
                {firstCh && (
                  <div className="px-4 py-2.5 border-t border-site-border">
                    <Link
                      href={`/truyen/${slug}/chuong/${firstCh.ch}`}
                      className="text-xs text-purple-400 hover:text-purple-200 transition-colors"
                    >
                      Xem tất cả {chapters.length} chương →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ── */
function SectionLabel({ id, text }: { id: string; text: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-base font-bold text-white mb-3">
      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-indigo-600 inline-block" />
      {text}
    </h2>
  );
}

function StatChip({
  icon, value, color,
}: {
  icon?: string; value: string; color?: 'emerald' | 'sky';
}) {
  const colorClass =
    color === 'emerald' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40' :
    color === 'sky'     ? 'bg-sky-500/15 text-sky-300 border-sky-700/40' :
                          'bg-white/5 text-gray-300 border-white/10';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {value}
    </span>
  );
}
