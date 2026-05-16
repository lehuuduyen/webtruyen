'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';

export default function Header({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const router = useRouter();
  const roots = categories.filter(c => !c.parent_id);
  const genreRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); setGenreOpen(false); }, []);

  return (
    <header className="sticky top-0 z-50 bg-site-header border-b border-site-border shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group" aria-label="WebTruyện">
          <span className="text-xl leading-none">🐧</span>
          <span className="text-base font-bold text-white group-hover:text-purple-300 transition-colors hidden sm:block">
            WebTruyện
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md" role="search">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm kiếm truyện, tác giả..."
              aria-label="Tìm kiếm truyện"
              className="w-full bg-site-bg border border-site-border rounded-lg px-3 py-1.5 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 shrink-0">
          {/* Genre dropdown */}
          <div ref={genreRef} className="relative">
            <button
              onClick={() => setGenreOpen(v => !v)}
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-site-card"
            >
              📚 Thể loại
              <span className={`text-xs transition-transform ${genreOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {genreOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-site-card border border-site-border rounded-lg shadow-xl shadow-black/50 py-2 grid grid-cols-2 gap-0.5">
                <Link
                  href="/the-loai"
                  onClick={() => setGenreOpen(false)}
                  className="col-span-2 px-3 py-1.5 text-xs text-purple-400 hover:text-white hover:bg-purple-600/20 font-semibold"
                >
                  Tất cả thể loại →
                </Link>
                {roots.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/the-loai/${cat.slug}`}
                    onClick={() => setGenreOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-purple-600/20 rounded"
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/bang-xep-hang"
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-site-card"
          >
            🏆 Xếp hạng
          </Link>
          <Link
            href="/tu-sach"
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-site-card"
          >
            📖 Tủ sách
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-expanded={mobileOpen}
          aria-label="Mở menu"
          className="sm:hidden ml-auto p-2 text-gray-300 hover:text-white"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav aria-label="Menu di động" className="sm:hidden border-t border-site-border bg-site-card">
          <ul className="px-4 py-2 space-y-0.5">
            <li>
              <Link href="/the-loai" className="flex items-center gap-2 py-2 text-sm text-gray-300 hover:text-white">
                📚 Thể loại
              </Link>
            </li>
            <li>
              <Link href="/bang-xep-hang" className="flex items-center gap-2 py-2 text-sm text-gray-300 hover:text-white">
                🏆 Xếp hạng
              </Link>
            </li>
            <li>
              <Link href="/tu-sach" className="flex items-center gap-2 py-2 text-sm text-gray-300 hover:text-white">
                📖 Tủ sách
          </Link>
            </li>
            <li className="border-t border-site-border pt-1 mt-1">
              <p className="text-xs text-gray-500 py-1">Thể loại</p>
            </li>
            {roots.map(cat => (
              <li key={cat.id}>
                <Link
                  href={`/the-loai/${cat.slug}`}
                  className="flex items-center gap-2 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
