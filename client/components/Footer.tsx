import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-site-border bg-site-card/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🐧</span>
              <span className="text-white font-bold">WebTruyện</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nền tảng đọc truyện online miễn phí. Hơn 50,000 truyện Tiên Hiệp,
              Kiếm Hiệp, Ngôn Tình, Đô Thị cập nhật liên tục.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Khám Phá</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-purple-300 transition-colors">Trang Chủ</Link></li>
              <li><Link href="/tim-kiem" className="hover:text-purple-300 transition-colors">Tìm Kiếm</Link></li>
              <li><Link href="/tu-sach" className="hover:text-purple-300 transition-colors">Tủ Sách</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Thông Tin</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><span>📚 50,000+ Truyện</span></li>
              <li><span>⚡ Cập nhật liên tục</span></li>
              <li><span>🆓 Hoàn toàn miễn phí</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-site-border text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} WebTruyện. Nội dung chỉ phục vụ mục đích giải trí.</p>
        </div>
      </div>
    </footer>
  );
}
