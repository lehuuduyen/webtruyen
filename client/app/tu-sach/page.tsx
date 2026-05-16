import type { Metadata } from 'next';
import { getBooks } from '@/lib/api';
import BookshelfClient from '@/components/BookshelfClient';

export const metadata: Metadata = {
  title: 'Tủ Sách Của Tôi',
  description: 'Danh sách truyện đã lưu của bạn tại WebTruyện.',
  robots: { index: false },
};

export default async function BookshelfPage() {
  const books = await getBooks();
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">📚 Tủ Sách Của Tôi</h1>
      <BookshelfClient allBooks={books} />
    </div>
  );
}
