import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCategories } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'WebTruyện';
const SITE_DESC = 'Đọc truyện online miễn phí — Hơn 50,000 truyện Tiên Hiệp, Kiếm Hiệp, Ngôn Tình, Đô Thị cập nhật liên tục.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Nền Tảng Đọc Truyện Online Số 1`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Nền Tảng Đọc Truyện Online Số 1`,
    description: SITE_DESC,
    locale: 'vi_VN',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Nền Tảng Đọc Truyện Online Số 1`,
    description: SITE_DESC,
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <html lang="vi">
      <body>
        <Header categories={categories} />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
