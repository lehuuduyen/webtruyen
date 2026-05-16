import type { Book, Category, Chapter, ChapterListItem } from './types';
export { formatViews, statusLabel } from './utils';

// Server-side only: uses internal API URL directly
const API = process.env.API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function getBooks(): Promise<Book[]> {
  return (await apiFetch<Book[]>('/api/books')) ?? [];
}

export async function getBook(slug: string): Promise<Book | null> {
  return apiFetch<Book>(`/api/books/${slug}`);
}

export async function getCategories(): Promise<Category[]> {
  return (await apiFetch<Category[]>('/api/categories')) ?? [];
}

export async function getChapterList(slug: string): Promise<ChapterListItem[]> {
  return (await apiFetch<ChapterListItem[]>(`/api/chapters/${slug}`)) ?? [];
}

export async function getChapter(slug: string, ch: number): Promise<Chapter | null> {
  return apiFetch<Chapter>(`/api/chapters/${slug}/${ch}`);
}

