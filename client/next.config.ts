import type { NextConfig } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/sitemap.xml', destination: `${API_URL}/sitemap.xml` },
        { source: '/category-sitemap.xml', destination: `${API_URL}/category-sitemap.xml` },
        { source: '/:file(sitemap-comic-\\d+\\.xml)', destination: `${API_URL}/:file` },
        { source: '/:file(sitemap-chapter-\\d{4}-\\d+\\.xml)', destination: `${API_URL}/:file` },
      ],
      afterFiles: [
        { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
        { source: '/admin/:path*', destination: `${API_URL}/admin/:path*` },
      ],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
