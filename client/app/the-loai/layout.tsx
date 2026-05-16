import { getCategories } from '@/lib/api';
import CategorySidebar from '@/components/CategorySidebar';
import MobileCategorySidebar from '@/components/MobileCategorySidebar';

export default async function TheLoaiLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const rootCats = categories.filter(c => !c.parent_id);
  const subCats  = categories.filter(c =>  c.parent_id);

  return (
    <div className="max-w-7xl mx-auto sm:px-4 sm:py-6">
      <div className="flex items-start">

        {/* Mobile sidebar — QiDian-style narrow vertical tabs */}
        <aside className="sm:hidden w-[72px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-site-card border-r border-site-border">
          <MobileCategorySidebar rootCats={rootCats} subCats={subCats} />
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden sm:block w-52 shrink-0 sticky top-20 mr-6">
          <div className="rounded-2xl border border-site-border bg-site-card/40 p-3">
            <CategorySidebar rootCats={rootCats} subCats={subCats} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-3 py-4 sm:p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
