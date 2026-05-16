'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Book } from '@/lib/types';
import BookCard from './BookCard';

export default function SearchClient({
  books,
  initialQuery,
}: {
  books: Book[];
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    const url = val.trim() ? `/tim-kiem?q=${encodeURIComponent(val.trim())}` : '/tim-kiem';
    router.replace(url, { scroll: false });
  }

  const needle = query.toLowerCase().trim();
  const results = needle
    ? books.filter(
        b =>
          b.title.toLowerCase().includes(needle) ||
          b.author.toLowerCase().includes(needle) ||
          b.genres.toLowerCase().includes(needle)
      )
    : [];

  return (
    <>
      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={handleInput}
          autoFocus
          placeholder="Nhập tên truyện hoặc tác giả..."
          aria-label="Tìm kiếm truyện"
          className="w-full max-w-xl bg-site-card border border-site-border rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base"
        />
      </div>

      {needle && (
        <p className="text-sm text-gray-400 mb-4">
          {results.length > 0
            ? `Tìm thấy ${results.length} kết quả cho "${query}"`
            : `Không tìm thấy kết quả cho "${query}"`}
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {results.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {needle && results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>Không tìm thấy truyện phù hợp.</p>
          <p className="text-sm mt-1">Thử từ khóa khác hoặc kiểm tra chính tả.</p>
        </div>
      )}

      {!needle && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📚</p>
          <p>Nhập tên truyện hoặc tác giả để tìm kiếm.</p>
        </div>
      )}
    </>
  );
}
