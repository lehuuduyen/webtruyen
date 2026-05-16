'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category } from '@/lib/types';

export default function MobileCategorySidebar({
  rootCats,
  subCats,
}: {
  rootCats: Category[];
  subCats: Category[];
}) {
  const pathname = usePathname();

  function isActive(slug: string) {
    return pathname === `/the-loai/${slug}`;
  }

  const isAll = pathname === '/the-loai';

  return (
    <nav className="flex flex-col">
      {/* Tất cả */}
      <Link
        href="/the-loai"
        className={`py-3 px-2 text-[11px] font-semibold leading-snug text-center transition-all border-r-2 ${
          isAll
            ? 'text-purple-300 border-purple-500 bg-purple-900/30'
            : 'text-gray-500 border-transparent hover:text-gray-300'
        }`}
      >
        Tất cả
      </Link>

      {rootCats.map(cat => {
        const children = subCats.filter(c => c.parent_id === cat.id);
        const rootActive = isActive(cat.slug);

        return (
          <div key={cat.id}>
            {/* Root category */}
            <Link
              href={`/the-loai/${cat.slug}`}
              className={`flex flex-col items-center gap-0.5 py-3 px-1 text-center transition-all border-r-2 ${
                rootActive
                  ? 'text-white border-purple-500 bg-purple-900/30'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="text-[10px] font-semibold leading-tight break-words w-full">{cat.name}</span>
            </Link>

            {/* Subcategories */}
            {children.map(child => {
              const childActive = isActive(child.slug);
              return (
                <Link
                  key={child.id}
                  href={`/the-loai/${child.slug}`}
                  className={`block py-2.5 px-2 text-[10px] leading-snug text-center transition-all border-r-2 ${
                    childActive
                      ? 'text-purple-300 border-purple-500 bg-purple-900/20'
                      : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {child.name}
                </Link>
              );
            })}

            {/* Divider between root groups */}
            <div className="mx-2 my-1 border-t border-site-border/50" />
          </div>
        );
      })}
    </nav>
  );
}
