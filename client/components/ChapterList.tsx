'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ChapterListItem } from '@/lib/types';

interface Props {
  slug: string;
  chapters: ChapterListItem[];
}

export default function ChapterList({ slug, chapters }: Props) {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let list = [...chapters];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || String(c.ch).includes(q));
    }
    return order === 'desc' ? list.reverse() : list;
  }, [chapters, query, order]);

  // Group by 100
  const groups: { label: string; items: ChapterListItem[] }[] = [];
  if (chapters.length > 100) {
    for (let i = 0; i < filtered.length; i += 100) {
      const slice = filtered.slice(i, i + 100);
      groups.push({
        label: `Chương ${slice[0].ch} – ${slice[slice.length - 1].ch}`,
        items: slice,
      });
    }
  }

  const [openGroup, setOpenGroup] = useState(0);
  const displayList = groups.length > 0 ? groups[openGroup]?.items ?? [] : filtered;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm chương..."
            className="w-full bg-site-bg border border-site-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 pr-8"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 border border-site-border rounded-lg hover:border-purple-500 hover:text-white transition-colors shrink-0"
          title="Đảo thứ tự"
        >
          {order === 'asc' ? '↑ Cũ → Mới' : '↓ Mới → Cũ'}
        </button>
      </div>

      {/* Group tabs (only when > 100 chapters and no search) */}
      {groups.length > 1 && !query && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {groups.map((g, i) => (
            <button
              key={i}
              onClick={() => setOpenGroup(i)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                openGroup === i
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-site-bg border-site-border text-gray-400 hover:border-purple-600/60 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {query && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length > 0 ? `Tìm thấy ${filtered.length} chương` : 'Không tìm thấy chương nào'}
        </p>
      )}

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-site-border divide-y divide-site-border/60 bg-site-card/40">
        {displayList.map(ch => (
          <Link
            key={ch.ch}
            href={`/truyen/${slug}/chuong/${ch.ch}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-900/20 transition-colors group"
          >
            <span className="text-[11px] text-gray-600 w-8 text-right shrink-0 font-mono">{ch.ch}</span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1 truncate">
              {ch.title}
            </span>
            <span className="text-[11px] text-gray-600 shrink-0 hidden sm:block">
              {new Date(ch.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </span>
          </Link>
        ))}
        {displayList.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-600">Không có chương nào</div>
        )}
      </div>
    </div>
  );
}
