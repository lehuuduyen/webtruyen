'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardNav({ prevHref, nextHref }: { prevHref?: string; nextHref?: string }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft'  && prevHref) router.push(prevHref);
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevHref, nextHref, router]);

  return null;
}
