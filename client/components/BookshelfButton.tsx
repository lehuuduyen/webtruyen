'use client';

import { useEffect, useState } from 'react';
import type { Book } from '@/lib/types';

const KEY = 'webtruyen_shelf';

function getShelf(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export default function BookshelfButton({ book }: { book: Book }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getShelf().includes(book.slug));
  }, [book.slug]);

  function toggle() {
    const shelf = getShelf();
    if (shelf.includes(book.slug)) {
      localStorage.setItem(KEY, JSON.stringify(shelf.filter(s => s !== book.slug)));
      setSaved(false);
    } else {
      localStorage.setItem(KEY, JSON.stringify([book.slug, ...shelf]));
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        saved
          ? 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40 hover:bg-yellow-600/30'
          : 'bg-site-bg text-gray-300 border-site-border hover:border-yellow-600/40 hover:text-yellow-300'
      }`}
      aria-pressed={saved}
    >
      {saved ? '📌 Đã lưu' : '🔖 Lưu truyện'}
    </button>
  );
}
