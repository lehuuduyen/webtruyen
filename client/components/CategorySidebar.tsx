'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Category } from '@/lib/types';

interface Props {
  rootCats: Category[];
  subCats: Category[];
}

export default function CategorySidebar({ rootCats, subCats }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function isActive(slug: string) {
    return pathname === `/the-loai/${slug}`;
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <nav aria-label="Danh mục thể loại" className="space-y-1">
      {/* All categories link */}
      <Link
        href="/the-loai"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
          pathname === '/the-loai'
            ? 'bg-purple-600/20 text-purple-300 border border-purple-600/40'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="text-base" aria-hidden="true">📚</span>
        Tất cả thể loại
      </Link>

      <div className="my-2 border-t border-site-border" />

      {/* Root categories */}
      {rootCats.map(root => {
        const children = subCats.filter(c => c.parent_id === root.id);
        const isRootActive = isActive(root.slug) || children.some(c => isActive(c.slug));
        const isOpen = !collapsed[root.id];

        return (
          <div key={root.id}>
            {/* Root header */}
            <div className="flex items-center">
              <Link
                href={`/the-loai/${root.slug}`}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive(root.slug)
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-600/40'
                    : isRootActive
                    ? 'text-purple-300'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base shrink-0" aria-hidden="true">{root.icon}</span>
                {root.name}
              </Link>
              {children.length > 0 && (
                <button
                  onClick={() => toggleCollapse(root.id)}
                  aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
                  className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Subcategories */}
            {isOpen && children.length > 0 && (
              <div className="ml-3 mt-0.5 border-l border-site-border pl-3 space-y-0.5">
                {children.map(child => (
                  <Link
                    key={child.id}
                    href={`/the-loai/${child.slug}`}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all ${
                      isActive(child.slug)
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive(child.slug) && (
                      <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                    )}
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="my-2 border-t border-site-border" />

      {/* Quick links */}
      <Link
        href="/bang-xep-hang"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <span className="text-base" aria-hidden="true">🏆</span>
        Bảng xếp hạng
      </Link>
      <Link
        href="/tim-kiem"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <span className="text-base" aria-hidden="true">🔍</span>
        Tìm kiếm
      </Link>
    </nav>
  );
}
