'use client';

import { useEffect, useState } from 'react';
import type { Book } from '@/lib/types';
import BookCard from './BookCard';

const KEY = 'webtruyen_shelf';

export default function BookshelfClient({ allBooks }: { allBooks: Book[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setSlugs(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      setSlugs([]);
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const saved = slugs.map(s => allBooks.find(b => b.slug === s)).filter(Boolean) as Book[];

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">📭</p>
        <p>Tủ sách trống. Hãy lưu truyện yêu thích để đọc sau!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {saved.map(book => <BookCard key={book.id} book={book} />)}
    </div>
  );
}
