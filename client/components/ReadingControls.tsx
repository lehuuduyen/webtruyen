'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'sepia' | 'light';

const FONT_KEY = 'reading_font';
const THEME_KEY = 'reading_theme';

export default function ReadingControls() {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const savedFont = parseInt(localStorage.getItem(FONT_KEY) || '18');
    const savedTheme = (localStorage.getItem(THEME_KEY) || 'dark') as Theme;
    setFontSize(savedFont);
    setTheme(savedTheme);
    applyTheme(savedTheme);
    applyFont(savedFont);
  }, []);

  function applyFont(size: number) {
    document.documentElement.style.setProperty('--reading-font', `${size}px`);
  }

  function applyTheme(t: Theme) {
    document.body.classList.remove('reading-sepia', 'reading-light');
    if (t !== 'dark') document.body.classList.add(`reading-${t}`);
  }

  function changeFont(delta: number) {
    const next = Math.min(28, Math.max(14, fontSize + delta));
    setFontSize(next);
    localStorage.setItem(FONT_KEY, String(next));
    applyFont(next);
  }

  function cycleTheme() {
    const themes: Theme[] = ['dark', 'sepia', 'light'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  const themeLabel = { dark: '🌙', sepia: '☕', light: '☀️' }[theme];

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => changeFont(-1)}
        className="w-8 h-8 flex items-center justify-center text-xs bg-site-card border border-site-border rounded hover:border-purple-500 text-gray-300 hover:text-white transition-colors"
        aria-label="Giảm cỡ chữ"
      >
        A-
      </button>
      <button
        onClick={() => changeFont(1)}
        className="w-8 h-8 flex items-center justify-center text-sm bg-site-card border border-site-border rounded hover:border-purple-500 text-gray-300 hover:text-white transition-colors"
        aria-label="Tăng cỡ chữ"
      >
        A+
      </button>
      <button
        onClick={cycleTheme}
        className="w-8 h-8 flex items-center justify-center bg-site-card border border-site-border rounded hover:border-purple-500 transition-colors"
        aria-label="Đổi màu nền"
        title={`Nền: ${theme}`}
      >
        {themeLabel}
      </button>
    </div>
  );
}
