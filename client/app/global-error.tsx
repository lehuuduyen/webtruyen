'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ background: '#0d0d1a', color: '#e2e8f0', fontFamily: 'monospace', padding: '2rem' }}>
        <h1 style={{ color: '#f87171', marginBottom: '1rem' }}>Lỗi ứng dụng</h1>
        <pre style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', lineHeight: '1.6' }}>
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
