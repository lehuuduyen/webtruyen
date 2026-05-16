'use client';

import { useEffect, useRef } from 'react';

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const el = document.getElementById('reading-article');
      if (!el || !barRef.current) return;
      const { top, height } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const read = Math.max(0, -top);
      const total = Math.max(1, height - vh);
      const pct = Math.min(100, (read / total) * 100);
      barRef.current.style.width = `${pct}%`;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div ref={barRef} className="reading-progress-bar" aria-hidden="true" />;
}
