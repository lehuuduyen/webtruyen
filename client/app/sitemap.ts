import type { MetadataRoute } from 'next';
import { getBooks, getCategories } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories] = await Promise.all([getBooks(), getCategories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/tim-kiem`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const catRoutes: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${SITE_URL}/the-loai/${cat.slug}`,
    lastModified: new Date(cat.createdAt),
    changeFrequency: 'daily' as const,
    priority: cat.parent_id ? 0.6 : 0.8,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map(book => ({
    url: `${SITE_URL}/truyen/${book.slug}`,
    lastModified: new Date(book.createdAt),
    changeFrequency: book.status === 'ongoing' ? ('daily' as const) : ('monthly' as const),
    priority: 0.9,
  }));

  return [...staticRoutes, ...catRoutes, ...bookRoutes];
}
