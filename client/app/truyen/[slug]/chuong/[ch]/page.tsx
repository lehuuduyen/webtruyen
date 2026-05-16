import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBook, getBooks, getChapter, getChapterList } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import ReadingSettings from '@/components/ReadingSettings';
import ReadingProgress from '@/components/ReadingProgress';
import KeyboardNav from '@/components/KeyboardNav';
import ScrollToTop from '@/components/ScrollToTop';
import ChapterList from '@/components/ChapterList';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface Props { params: Promise<{ slug: string; ch: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ch } = await params;
  const chNum = parseInt(ch);
  const [book, chapter] = await Promise.all([getBook(slug), getChapter(slug, chNum)]);
  if (!book || !chapter) return { title: 'Không tìm thấy chương' };

  const title = `${chapter.title} — ${book.title}`;
  const description = `Đọc ${chapter.title} truyện ${book.title} của tác giả ${book.author} tại WebTruyện. Miễn phí, cập nhật nhanh.`;
  const url = `${SITE_URL}/truyen/${slug}/chuong/${ch}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      ...(book.img ? { images: [{ url: book.img, alt: book.title }] } : {}),
    },
    twitter: { card: 'summary', title, description },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const books = await getBooks();
  const params: { slug: string; ch: string }[] = [];
  for (const book of books.slice(0, 50)) {
    const chapters = await getChapterList(book.slug);
    for (const ch of chapters.slice(0, 5)) {
      params.push({ slug: book.slug, ch: String(ch.ch) });
    }
  }
  return params;
}

export default async function ChapterPage({ params }: Props) {
  const { slug, ch } = await params;
  const chNum = parseInt(ch);

  const [book, chapter, chapters] = await Promise.all([
    getBook(slug),
    getChapter(slug, chNum),
    getChapterList(slug),
  ]);
  if (!book || !chapter) notFound();

  const idx    = chapters.findIndex(c => c.ch === chNum);
  const prevCh = idx > 0                  ? chapters[idx - 1] : null;
  const nextCh = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  const prevHref = prevCh ? `/truyen/${slug}/chuong/${prevCh.ch}` : undefined;
  const nextHref = nextCh ? `/truyen/${slug}/chuong/${nextCh.ch}` : undefined;
  const url      = `${SITE_URL}/truyen/${slug}/chuong/${ch}`;

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: chapter.title,
        isPartOf: { '@type': 'Book', name: book.title, url: `${SITE_URL}/truyen/${slug}` },
        author: { '@type': 'Person', name: book.author },
        url,
        inLanguage: 'vi',
        datePublished: chapter.created_at,
      }} />

      {/* Reading progress bar (fixed, very top) */}
      <ReadingProgress />

      {/* Keyboard navigation */}
      <KeyboardNav prevHref={prevHref} nextHref={nextHref} />

      {/* Scroll-to-top fab */}
      <ScrollToTop />

      {/* ── STICKY TOP BAR ── */}
      <div className="doc-chrome sticky top-0 z-40 bg-[#16213e]/95 backdrop-blur-md border-b border-[#2a2a45] shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">

          {/* Back link */}
          <Link
            href={`/truyen/${slug}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0 group"
            title={book.title}
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span className="hidden sm:inline max-w-[160px] truncate">{book.title}</span>
          </Link>

          {/* Center: chapter progress (mobile) / title (desktop) */}
          <div className="flex-1 text-center min-w-0">
            <span className="text-xs text-gray-400 sm:hidden">Ch.{chNum}/{chapters.length}</span>
            <span className="text-sm text-gray-300 hidden md:inline truncate">{chapter.title}</span>
          </div>

          {/* Right: prev/next mini + settings */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={prevHref ?? '#'}
              aria-disabled={!prevHref}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-400 transition-colors ${
                prevHref
                  ? 'border-[#2a2a45] hover:border-purple-500 hover:text-white'
                  : 'border-[#1a1a2e] text-gray-700 pointer-events-none'
              }`}
              title={prevCh ? `← ${prevCh.title}` : undefined}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>
            <Link
              href={nextHref ?? '#'}
              aria-disabled={!nextHref}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-400 transition-colors ${
                nextHref
                  ? 'border-[#2a2a45] hover:border-purple-500 hover:text-white'
                  : 'border-[#1a1a2e] text-gray-700 pointer-events-none'
              }`}
              title={nextCh ? `${nextCh.title} →` : undefined}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
            <div className="w-px h-5 bg-[#2a2a45] mx-1" />
            <ReadingSettings />
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#16213e]/97 backdrop-blur-md border-t border-[#2a2a45] shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-3 h-14">
          {prevHref ? (
            <Link href={prevHref} className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-white active:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              <span className="text-[10px]">Trước</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              <span className="text-[10px]">Trước</span>
            </div>
          )}
          <Link href={`/truyen/${slug}`} className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-white active:bg-white/5 transition-colors border-x border-[#2a2a45]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
            </svg>
            <span className="text-[10px]">Mục lục</span>
          </Link>
          {nextHref ? (
            <Link href={nextHref} className="flex flex-col items-center justify-center gap-0.5 text-purple-400 hover:text-purple-300 active:bg-purple-900/20 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
              <span className="text-[10px]">Tiếp</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
              <span className="text-[10px]">Tiếp</span>
            </div>
          )}
        </div>
      </nav>

      {/* ── READING AREA ── */}
      <div className="doc-content-bg min-h-screen pb-14 sm:pb-0">
        <article
          id="reading-article"
          className="mx-auto px-4 sm:px-6 py-10"
          style={{ maxWidth: 720 }}
          aria-label={chapter.title}
        >
          {/* Chapter header */}
          <header className="text-center mb-10">
            <Link
              href={`/truyen/${slug}`}
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors mb-3 group"
            >
              {book.img && (
                <span className="relative w-5 h-7 rounded overflow-hidden shrink-0 inline-block">
                  <Image src={book.img} alt="" fill sizes="20px" className="object-cover" />
                </span>
              )}
              {book.title}
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
              {chapter.title}
            </h1>

            <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
              <span>{book.author}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700 inline-block" />
              <time dateTime={chapter.created_at}>
                {new Date(chapter.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </time>
              <span className="w-1 h-1 rounded-full bg-gray-700 inline-block" />
              <span>Chương {chNum}/{chapters.length}</span>
            </div>

            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent" />
          </header>

          {/* ── Navigation top ── */}
          <ChapterNav
            slug={slug}
            prevCh={prevCh ? { ch: prevCh.ch, title: prevCh.title } : null}
            nextCh={nextCh ? { ch: nextCh.ch, title: nextCh.title } : null}
          />

          {/* ── Content ── */}
          <div
            className="chapter-content my-10"
            dangerouslySetInnerHTML={{ __html: chapter.content || '<p>Nội dung đang được cập nhật...</p>' }}
          />

          {/* ── Navigation bottom ── */}
          <div className="mt-4 mb-10 h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent" />
          <ChapterNav
            slug={slug}
            prevCh={prevCh ? { ch: prevCh.ch, title: prevCh.title } : null}
            nextCh={nextCh ? { ch: nextCh.ch, title: nextCh.title } : null}
          />

          {/* ── Chapter list ── */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-[#2a2a45] bg-[#1a1a2e]/50">
            <div className="px-4 py-3 border-b border-[#2a2a45] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                Danh Sách Chương
                <span className="ml-2 text-xs text-gray-500 font-normal">({chapters.length})</span>
              </h2>
              <Link href={`/truyen/${slug}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Trang truyện →
              </Link>
            </div>
            <div className="p-4">
              <ChapterList slug={slug} chapters={chapters} />
            </div>
          </div>

          {/* ── Keyboard hint ── */}
          <p className="text-center text-xs text-gray-700 mt-6">
            Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a45] text-gray-500 font-mono text-[10px]">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a45] text-gray-500 font-mono text-[10px]">→</kbd>{' '}
            để chuyển chương
          </p>
        </article>
      </div>
    </>
  );
}

/* ── Chapter navigation component ── */
function ChapterNav({
  slug,
  prevCh,
  nextCh,
}: {
  slug: string;
  prevCh: { ch: number; title: string } | null;
  nextCh: { ch: number; title: string } | null;
}) {
  return (
    <nav className="grid grid-cols-3 items-center gap-2" aria-label="Điều hướng chương">
      {/* Prev */}
      {prevCh ? (
        <Link
          href={`/truyen/${slug}/chuong/${prevCh.ch}`}
          className="group flex flex-col items-start px-4 py-3 rounded-xl border border-[#2a2a45] hover:border-purple-500 hover:bg-purple-900/10 transition-all"
        >
          <span className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5 group-hover:text-purple-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Chương trước
          </span>
          <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate w-full">
            {prevCh.title}
          </span>
        </Link>
      ) : <div />}

      {/* Mục lục */}
      <Link
        href={`/truyen/${slug}`}
        className="flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl border border-[#2a2a45] hover:border-purple-500 hover:bg-purple-900/10 transition-all text-center"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
        </svg>
        <span className="text-[10px] text-gray-600">Mục lục</span>
      </Link>

      {/* Next */}
      {nextCh ? (
        <Link
          href={`/truyen/${slug}/chuong/${nextCh.ch}`}
          className="group flex flex-col items-end px-4 py-3 rounded-xl border border-[#2a2a45] hover:border-purple-500 hover:bg-purple-900/10 transition-all"
        >
          <span className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5 group-hover:text-purple-400 transition-colors">
            Chương tiếp
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
          <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate w-full text-right">
            {nextCh.title}
          </span>
        </Link>
      ) : <div />}
    </nav>
  );
}
