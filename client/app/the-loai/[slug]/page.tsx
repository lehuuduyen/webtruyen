import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBooks, getCategories } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import BooksClient from './BooksClient';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find(c => c.slug === slug);
  if (!cat) return { title: 'Không tìm thấy thể loại' };

  const title = `Truyện ${cat.name} — Đọc Online Miễn Phí`;
  const description = `Danh sách truyện thể loại ${cat.name} tại WebTruyện. Cập nhật liên tục, miễn phí hoàn toàn.`;
  const url = `${SITE_URL}/the-loai/${slug}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description },
  };
}

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map(c => ({ slug: c.slug }));
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const [categories, allBooks] = await Promise.all([getCategories(), getBooks()]);

  const cat = categories.find(c => c.slug === slug);
  if (!cat) notFound();

  const parent     = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
  const childCats  = categories.filter(c => c.parent_id === cat.id);
  const allCatIds  = [cat.id, ...childCats.map(c => c.id)];
  const books      = allBooks.filter(b => b.categoryIds.some(id => allCatIds.includes(id)));
  const ongoing    = books.filter(b => b.status === 'ongoing').length;
  const complete   = books.filter(b => b.status === 'complete').length;
  const url        = `${SITE_URL}/the-loai/${slug}`;

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Truyện ${cat.name}`,
        description: `Danh sách truyện thể loại ${cat.name}`,
        url,
        numberOfItems: books.length,
      }} />

      <Breadcrumb items={[
        { name: 'Trang Chủ', href: '/' },
        { name: 'Thể Loại', href: '/the-loai' },
        ...(parent ? [{ name: parent.name, href: `/the-loai/${parent.slug}` }] : []),
        { name: cat.name },
      ]} />

      {/* Category header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-site-border">
        <span className="text-4xl shrink-0" aria-hidden="true">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white">{cat.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            <span><strong className="text-white">{books.length}</strong> truyện</span>
            <span className="text-sky-400"><strong>{ongoing}</strong> đang ra</span>
            <span className="text-emerald-400"><strong>{complete}</strong> hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Subcategory chips */}
      {childCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Link
            href={`/the-loai/${cat.slug}`}
            className="px-2.5 py-1 rounded-full text-xs border border-purple-600/50 bg-purple-600/20 text-purple-300 font-medium"
          >
            Tất cả
          </Link>
          {childCats.map(c => (
            <Link
              key={c.id}
              href={`/the-loai/${c.slug}`}
              className="px-2.5 py-1 rounded-full text-xs border border-site-border text-gray-400 hover:text-white hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Interactive book list */}
      {books.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Chưa có truyện trong thể loại này.</p>
        </div>
      ) : (
        <BooksClient books={books} />
      )}
    </>
  );
}
