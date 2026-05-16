import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import { formatViews } from '@/lib/utils';

// Generate a deterministic gradient color from book title
function titleGradient(title: string) {
  const palettes = [
    'from-violet-900 via-purple-800 to-indigo-900',
    'from-blue-900 via-indigo-800 to-violet-900',
    'from-rose-900 via-pink-800 to-purple-900',
    'from-amber-900 via-orange-800 to-red-900',
    'from-teal-900 via-emerald-800 to-cyan-900',
    'from-indigo-900 via-blue-800 to-sky-900',
    'from-fuchsia-900 via-purple-800 to-pink-900',
    'from-cyan-900 via-teal-800 to-emerald-900',
  ];
  const idx = title.charCodeAt(0) % palettes.length;
  return palettes[idx];
}

export default function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
  const initial = (book.title[0] || '?').toUpperCase();

  return (
    <article className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-purple-900/40 transition-all duration-300 hover:-translate-y-1">
      <Link href={`/truyen/${book.slug}`} className="block h-full" aria-label={`Đọc truyện ${book.title}`}>

        {/* Background image or gradient placeholder */}
        <div className={`absolute inset-0 bg-gradient-to-br ${titleGradient(book.title)}`}>
          {book.img ? (
            <Image
              src={book.img}
              alt={`Ảnh bìa ${book.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center select-none">
              <span className="text-7xl font-black text-white/10">{initial}</span>
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
            book.status === 'complete'
              ? 'bg-emerald-500 text-white'
              : 'bg-sky-500 text-white'
          }`}>
            {book.status === 'complete' ? 'Full' : 'Đang ra'}
          </span>
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-yellow-500/90 text-yellow-950">
            ★ {book.rating.toFixed(1)}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-purple-200 transition-colors">
            {book.title}
          </h3>
          <p className="text-[11px] text-gray-300/80 truncate mt-0.5">{book.author}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
            <span>{book.chapters.toLocaleString()} chương</span>
            <span className="opacity-50">·</span>
            <span>{formatViews(book.views)} lượt đọc</span>
          </div>
        </div>

        {/* Hover shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </Link>
    </article>
  );
}
