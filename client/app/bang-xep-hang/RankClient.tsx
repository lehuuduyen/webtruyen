'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Book, Category } from '@/lib/types';
import { formatViews, statusLabel } from '@/lib/utils';

type MetricType = 'views' | 'newest' | 'complete';

interface Column {
  id: string;
  label: string;
  icon: string;
  books: Book[];
  metricType: MetricType;
}

interface Props {
  columns: Column[];
  categories: Category[];
  rootCats: Category[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

const COL_ACCENT: Record<string, { border: string; bg: string; text: string }> = {
  hot:      { border: 'border-orange-600/50', bg: 'bg-orange-600/10', text: 'text-orange-400' },
  newest:   { border: 'border-blue-600/50',   bg: 'bg-blue-600/10',   text: 'text-blue-400'   },
  complete: { border: 'border-emerald-600/50', bg: 'bg-emerald-600/10', text: 'text-emerald-400' },
};

function getMetric(book: Book, type: MetricType): { value: string; label: string } {
  switch (type) {
    case 'views':    return { value: formatViews(book.views), label: 'lượt đọc' };
    case 'newest':   return { value: new Date(book.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), label: 'ngày đăng' };
    case 'complete': return { value: `${book.chapters.toLocaleString()} ch.`, label: 'chương' };
  }
}

function filterByCategory(books: Book[], activeCat: string, categories: Category[]): Book[] {
  if (activeCat === 'all') return books;
  const cat = categories.find(c => c.slug === activeCat);
  if (!cat) return books;
  const childIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
  const allIds = [cat.id, ...childIds];
  return books.filter(b => b.categoryIds.some(id => allIds.includes(id)));
}

export default function RankClient({ columns, categories, rootCats }: Props) {
  const [activeCat, setActiveCat] = useState<string>('all');
  const [activeCol, setActiveCol] = useState(columns[0].id);

  return (
    <div>
      {/* Category filter */}
      {rootCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6 pb-4 border-b border-site-border">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeCat === 'all'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-600/60'
                : 'bg-site-card border border-site-border text-gray-400 hover:text-white hover:border-purple-600/40'
            }`}
          >
            Tất cả
          </button>
          {rootCats.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.slug ? 'all' : cat.slug)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeCat === cat.slug
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-600/60'
                  : 'bg-site-card border border-site-border text-gray-400 hover:text-white hover:border-purple-600/40'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Mobile tab switcher */}
      <div className="flex gap-1 mb-4 lg:hidden">
        {columns.map(col => {
          const accent = COL_ACCENT[col.id];
          return (
            <button
              key={col.id}
              onClick={() => setActiveCol(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeCol === col.id
                  ? `${accent.bg} ${accent.border} ${accent.text}`
                  : 'bg-site-card border-site-border text-gray-500 hover:text-white'
              }`}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
            </button>
          );
        })}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map(col => {
          const filtered = filterByCategory(col.books, activeCat, categories);
          const accent = COL_ACCENT[col.id];
          const visible = activeCol === col.id ? '' : 'hidden lg:block';
          return (
            <div key={col.id} className={`${visible} rounded-2xl border ${accent.border} overflow-hidden`}>
              {/* Column header */}
              <div className={`px-4 py-3 border-b ${accent.border} ${accent.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{col.icon}</span>
                  <h2 className={`text-sm font-black ${accent.text}`}>{col.label}</h2>
                </div>
                <span className="text-xs text-gray-500">{filtered.length} truyện</span>
              </div>

              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-600 text-sm">Không có truyện nào</div>
              ) : (
                <ol className="divide-y divide-site-border/40">
                  {filtered.slice(0, 30).map((book, i) => (
                    <RankRow key={book.id} book={book} rank={i + 1} metricType={col.metricType} />
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankRow({ book, rank, metricType }: { book: Book; rank: number; metricType: MetricType }) {
  const m = getMetric(book, metricType);
  const isMedal = rank <= 3;

  return (
    <li>
      <Link
        href={`/truyen/${book.slug}`}
        className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors group ${
          isMedal ? 'bg-white/[0.02]' : ''
        }`}
      >
        {/* Rank */}
        {isMedal ? (
          <span className="text-lg leading-none w-7 text-center shrink-0 select-none">
            {MEDALS[rank - 1]}
          </span>
        ) : (
          <span className={`w-7 text-center text-xs font-black shrink-0 tabular-nums ${
            rank <= 10 ? 'text-purple-400' : 'text-gray-600'
          }`}>
            {rank}
          </span>
        )}

        {/* Cover */}
        <div className="relative w-9 h-12 rounded-md overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-indigo-900">
          {book.img && (
            <Image src={book.img} alt="" fill sizes="36px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-purple-300 transition-colors leading-snug">
            {book.title}
          </p>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{book.author}</p>
        </div>

        {/* Metric */}
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-gray-300">{m.value}</p>
          <p className="text-[10px] text-gray-600">{m.label}</p>
        </div>
      </Link>
    </li>
  );
}
