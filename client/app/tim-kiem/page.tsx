import type { Metadata } from 'next';
import { getBooks } from '@/lib/api';
import SearchClient from '@/components/SearchClient';

export const metadata: Metadata = {
  title: 'Tìm Kiếm Truyện',
  description: 'Tìm kiếm truyện theo tên, tác giả tại WebTruyện. Hơn 50,000 truyện để lựa chọn.',
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const books = await getBooks();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">🔍 Tìm Kiếm Truyện</h1>
      <SearchClient books={books} initialQuery={q || ''} />
    </div>
  );
}
