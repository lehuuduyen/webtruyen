import { getCategories } from '@/lib/api';
import CategorySidebar from '@/components/CategorySidebar';

export default async function TheLoaiLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const rootCats = categories.filter(c => !c.parent_id);
  const subCats  = categories.filter(c =>  c.parent_id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Mobile: horizontal scrollable category pills */}
      <div className="sm:hidden mb-4 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          {rootCats.map(cat => (
            <a
              key={cat.id}
              href={`/the-loai/${cat.slug}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-site-border bg-site-card text-gray-300 whitespace-nowrap hover:border-purple-500 hover:text-white transition-colors"
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <aside className="hidden sm:block w-52 shrink-0 sticky top-20">
          <div className="rounded-2xl border border-site-border bg-site-card/40 p-3">
            <CategorySidebar rootCats={rootCats} subCats={subCats} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
