import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Không Tìm Thấy Trang',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🐧</div>
      <h1 className="text-3xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 mb-6">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
      >
        Về Trang Chủ
      </Link>
    </div>
  );
}
