export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string;
  chapters: number;
  status: 'ongoing' | 'complete';
  rating: number;
  img: string | null;
  desc: string;
  categoryIds: string[];
  views: number;
  createdAt: string;
}

export interface ChapterListItem {
  ch: number;
  title: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  book_slug: string;
  ch: number;
  title: string;
  content: string;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  parent_id: string | null;
  showOnHome: boolean;
  order: number;
  createdAt: string;
}
