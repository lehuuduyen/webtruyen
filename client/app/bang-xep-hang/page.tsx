import type { Metadata } from 'next';
import { getBooks, getCategories } from '@/lib/api';
import Breadcrumb from '@/components/Breadcrumb';
import JsonLd from '@/components/JsonLd';
import RankClient from './RankClient';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PAGE_URL = `${SITE_URL}/bang-xep-hang`;

export const metadata: Metadata = {
  title: 'Bảng Xếp Hạng Truyện — WebTruyện',
  description: 'Bảng xếp hạng truyện online: Truyện Hot, Truyện Mới, Truyện Đã Hoàn Thành. Cập nhật liên tục tại WebTruyện.',
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: 'Bảng Xếp Hạng Truyện — WebTruyện' },
};

export default async function RankingPage() {
  const [books, categories] = await Promise.all([getBooks(), getCategories()]);
  const rootCats = categories.filter(c => !c.parent_id && c.showOnHome);

  const byViews    = [...books].sort((a, b) => b.views - a.views).slice(0, 50);
  const byNewest   = [...books].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
  const byComplete = books.filter(b => b.status === 'complete').sort((a, b) => b.views - a.views).slice(0, 50);

  const columns = [
    { id: 'hot',      label: 'Truyện Hot',      icon: '🔥', books: byViews,    metricType: 'views'    as const },
    { id: 'newest',   label: 'Truyện Mới',      icon: '⚡', books: byNewest,   metricType: 'newest'   as const },
    { id: 'complete', label: 'Đã Hoàn Thành',   icon: '✅', books: byComplete, metricType: 'complete' as const },
  ];

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Bảng Xếp Hạng Truyện',
        description: 'Top truyện online tại WebTruyện',
        url: PAGE_URL,
        numberOfItems: books.length,
      }} />

      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-site-border"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, #2d1b69 0%, #1a1a2e 60%, #0d0d1a 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {([
            { top: '20%', left: '5%',   right: undefined, size: 3, dur: '3s',   delay: '0s' },
            { top: '60%', left: '12%',  right: undefined, size: 2, dur: '4.2s', delay: '1s' },
            { top: '35%', left: undefined, right: '7%',   size: 4, dur: '2.8s', delay: '0.5s' },
            { top: '75%', left: undefined, right: '15%',  size: 2, dur: '3.5s', delay: '1.8s' },
            { top: '10%', left: '40%',  right: undefined, size: 3, dur: '3.8s', delay: '0.3s' },
          ] as const).map((s, i) => (
            <span key={i} className="star absolute rounded-full bg-white"
              style={{ width: s.size, height: s.size, top: s.top, left: s.left, right: s.right,
                ['--dur' as string]: s.dur, animationDelay: s.delay } as React.CSSProperties} />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600/20 border border-purple-600/40 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
              🏆
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-white">Bảng Xếp Hạng</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Top {books.length.toLocaleString()} truyện · Cập nhật liên tục
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { name: 'Trang Chủ', href: '/' },
          { name: 'Bảng Xếp Hạng' },
        ]} />

        <RankClient columns={columns} categories={categories} rootCats={rootCats} />
      </div>
    </>
  );
}
