'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import { formatViews, statusLabel } from '@/lib/utils';

type SortKey = 'views' | 'rating' | 'newest' | 'chapters';
type StatusFilter = 'all' | 'ongoing' | 'complete';

const TABS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'views',    label: 'Phổ biến',   icon: '🔥' },
  { key: 'rating',  label: 'Đánh giá',   icon: '⭐' },
  { key: 'newest',  label: 'Mới nhất',   icon: '⚡' },
  { key: 'chapters',label: 'Nhiều chương',icon: '📖' },
];

const STATUS_OPTS: { key: StatusFilter; label: string }[] = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'ongoing',  label: 'Đang ra' },
  { key: 'complete', label: 'Hoàn thành' },
];

export default function BooksClient({ books }: { books: Book[] }) {
  const [sort,   setSort]   = useState<SortKey>('views');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filtered = books
    .filter(b => status === 'all' || b.status === status)
    .sort((a, b) => {
      switch (sort) {
        case 'views':    return b.views   - a.views;
        case 'rating':   return b.rating  - a.rating;
        case 'newest':   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'chapters': return b.chapters - a.chapters;
      }
    });

  return (
    <div>
      {/* Sort + filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-site-border">
        {/* Sort tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setSort(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sort === t.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-site-card border border-site-border text-gray-400 hover:text-white hover:border-purple-600/50'
              }`}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-site-border hidden sm:block" />

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUS_OPTS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === s.key
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/50'
                  : 'bg-site-card border border-site-border text-gray-400 hover:text-white hover:border-emerald-600/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-500">{filtered.length} truyện</span>
      </div>

      {/* Book list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Không có truyện nào phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((book, i) => (
            <BookListRow key={book.id} book={book} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookListRow({ book, rank }: { book: Book; rank: number }) {
  const rankColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600';

  return (
    <Link
      href={`/truyen/${book.slug}`}
      className="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-site-border hover:bg-site-card/50 transition-all"
    >
      {/* Rank */}
      <span className={`w-6 text-center text-sm font-black shrink-0 mt-1 tabular-nums ${rankColor}`}>
        {rank}
      </span>

      {/* Cover */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900 shadow-md">
        {book.img && (
          <Image src={book.img} alt={`Ảnh bìa ${book.title}`} fill sizes="48px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-gray-100 leading-snug group-hover:text-purple-300 transition-colors line-clamp-1">
            {book.title}
          </p>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-gray-200">{formatViews(book.views)}</p>
            <p className="text-[10px] text-gray-500">lượt đọc</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>

        {book.desc && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
            {book.desc}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            book.status === 'complete'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-sky-500/20 text-sky-400'
          }`}>
            {statusLabel(book.status)}
          </span>
          <span className="text-[10px] text-gray-600">{book.chapters.toLocaleString()} chương</span>
          <span className="text-[10px] text-yellow-500">★ {book.rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
