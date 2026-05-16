import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBooks, getCategories } from '@/lib/api';
import { formatViews } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';
import type { Book, Category } from '@/lib/types';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PAGE_URL = `${SITE_URL}/the-loai`;

export const metadata: Metadata = {
  title: 'Tất Cả Thể Loại — WebTruyện',
  description: 'Khám phá tất cả thể loại truyện tại WebTruyện: Tiên Hiệp, Kiếm Hiệp, Ngôn Tình, Đô Thị và nhiều hơn nữa.',
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: 'Tất Cả Thể Loại — WebTruyện' },
};

const ACCENT_COLORS = [
  '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
];

export default async function GenreIndexPage() {
  const [books, categories] = await Promise.all([getBooks(), getCategories()]);

  const rootCats = categories.filter(c => !c.parent_id);
  const subCats  = categories.filter(c =>  c.parent_id);

  const sections = rootCats.map((root, i) => {
    const children = subCats.filter(c => c.parent_id === root.id);
    const allIds   = [root.id, ...children.map(c => c.id)];
    const catBooks = books.filter(b => b.categoryIds.some(id => allIds.includes(id)));
    return {
      root, children,
      total:    catBooks.length,
      ongoing:  catBooks.filter(b => b.status === 'ongoing').length,
      complete: catBooks.filter(b => b.status === 'complete').length,
      top:      [...catBooks].sort((a, b) => b.views - a.views).slice(0, 5),
      accent:   ACCENT_COLORS[i % ACCENT_COLORS.length],
    };
  });

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Tất Cả Thể Loại', url: PAGE_URL }} />

      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-2xl font-black text-white">Tất Cả Thể Loại</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
          {rootCats.length} nhóm · {subCats.length} thể loại · {books.length.toLocaleString()} truyện
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-6">
        {sections.map(({ root, children, total, ongoing, complete, top, accent }) => (
          <section
            key={root.id}
            className="rounded-2xl border border-site-border overflow-hidden"
            aria-labelledby={`cat-${root.id}`}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between border-b border-site-border"
              style={{ background: `linear-gradient(90deg, ${accent}18, transparent)`, borderLeftWidth: 3, borderLeftColor: accent, borderLeftStyle: 'solid' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" aria-hidden="true">{root.icon}</span>
                <div>
                  <h2 id={`cat-${root.id}`} className="text-sm font-bold text-white">{root.name}</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {total} truyện · <span className="text-sky-400">{ongoing} đang ra</span> · <span className="text-emerald-400">{complete} hoàn thành</span>
                  </p>
                </div>
              </div>
              <Link
                href={`/the-loai/${root.slug}`}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105"
                style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}
              >
                Xem tất cả →
              </Link>
            </div>

            {/* Sub tags + books */}
            <div className="p-4 bg-site-card/20">
              {/* Subcategory tags */}
              {children.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {children.map(c => (
                    <Link
                      key={c.id}
                      href={`/the-loai/${c.slug}`}
                      className="px-2.5 py-1 rounded-full text-xs border border-site-border text-gray-400 hover:text-white hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Top books horizontal strip */}
              {top.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                  {top.map((book, i) => (
                    <BookRow key={book.id} book={book} rank={i + 1} accent={accent} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function BookRow({ book, rank, accent }: { book: Book; rank: number; accent: string }) {
  return (
    <Link
      href={`/truyen/${book.slug}`}
      className="group flex items-center gap-2.5 p-2 rounded-xl border border-site-border bg-site-card/50 hover:border-purple-600/50 hover:bg-purple-900/10 transition-all"
    >
      <span
        className="w-5 text-center text-xs font-black shrink-0"
        style={{ color: rank <= 3 ? accent : '#4b5563' }}
      >
        {rank}
      </span>
      <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900">
        {book.img && <Image src={book.img} alt="" fill sizes="32px" className="object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
          {book.title}
        </p>
        <p className="text-[10px] text-gray-500 truncate mt-0.5">{formatViews(book.views)} lượt</p>
      </div>
    </Link>
  );
}
