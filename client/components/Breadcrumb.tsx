import Link from 'next/link';
import JsonLd from './JsonLd';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const ldItems = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
  }));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: ldItems,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="text-gray-600">›</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-purple-400 transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-200" aria-current="page">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
