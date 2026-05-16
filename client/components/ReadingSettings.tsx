'use client';

import { useEffect, useRef, useState } from 'react';

type Theme = 'dark' | 'sepia' | 'light';
type FontFamily = 'system' | 'serif' | 'mono';

const FAMILIES: Record<FontFamily, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  serif:  'Georgia, "Times New Roman", serif',
  mono:   '"Courier New", Courier, monospace',
};

const DEFAULTS = { size: 18, line: 1.9, family: 'system' as FontFamily, theme: 'dark' as Theme, width: 720 };

function save(key: string, val: string) { localStorage.setItem(`rd_${key}`, val); }
function load(key: string, def: string) { return localStorage.getItem(`rd_${key}`) ?? def; }

function applyAll(s: { size: number; line: number; family: FontFamily; theme: Theme; width: number }) {
  const r = document.documentElement;
  r.style.setProperty('--rd-size',  `${s.size}px`);
  r.style.setProperty('--rd-font',  FAMILIES[s.family]);
  r.style.setProperty('--rd-line',  String(s.line));
  document.body.classList.remove('reading-sepia', 'reading-light');
  if (s.theme !== 'dark') document.body.classList.add(`reading-${s.theme}`);
  const article = document.getElementById('reading-article');
  if (article) article.style.maxWidth = `${s.width}px`;
}

export default function ReadingSettings() {
  const [open,   setOpen]   = useState(false);
  const [size,   setSize]   = useState(DEFAULTS.size);
  const [line,   setLine]   = useState(DEFAULTS.line);
  const [family, setFamily] = useState<FontFamily>(DEFAULTS.family);
  const [theme,  setTheme]  = useState<Theme>(DEFAULTS.theme);
  const [width,  setWidth]  = useState(DEFAULTS.width);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = {
      size:   parseInt(load('size',   String(DEFAULTS.size))),
      line:   parseFloat(load('line', String(DEFAULTS.line))),
      family: load('family', DEFAULTS.family) as FontFamily,
      theme:  load('theme',  DEFAULTS.theme)  as Theme,
      width:  parseInt(load('width',  String(DEFAULTS.width))),
    };
    setSize(s.size); setLine(s.line); setFamily(s.family); setTheme(s.theme); setWidth(s.width);
    applyAll(s);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function update(patch: Partial<typeof DEFAULTS>) {
    const next = { size, line, family, theme, width, ...patch };
    if (patch.size   !== undefined) { setSize(next.size);     save('size',   String(next.size));   }
    if (patch.line   !== undefined) { setLine(next.line);     save('line',   String(next.line));   }
    if (patch.family !== undefined) { setFamily(next.family); save('family', next.family);         }
    if (patch.theme  !== undefined) { setTheme(next.theme);   save('theme',  next.theme);          }
    if (patch.width  !== undefined) { setWidth(next.width);   save('width',  String(next.width));  }
    applyAll(next);
  }

  const themeOpts: { value: Theme; label: string; bg: string; text: string }[] = [
    { value: 'dark',  label: '🌙 Tối',   bg: '#0d0d1a', text: '#d1d5db' },
    { value: 'sepia', label: '☕ Sepia',  bg: '#fdf6e3', text: '#4a3728' },
    { value: 'light', label: '☀️ Sáng',  bg: '#ffffff', text: '#1a1a1a' },
  ];

  const familyOpts: { value: FontFamily; label: string; preview: string }[] = [
    { value: 'system', label: 'Mặc định', preview: 'Aa' },
    { value: 'serif',  label: 'Serif',    preview: 'Aa' },
    { value: 'mono',   label: 'Mono',     preview: 'Aa' },
  ];

  const lineOpts = [
    { value: 1.6, label: 'Hẹp' },
    { value: 1.9, label: 'Vừa' },
    { value: 2.2, label: 'Rộng' },
  ];

  const widthOpts = [
    { value: 640, label: 'Hẹp' },
    { value: 720, label: 'Vừa' },
    { value: 860, label: 'Rộng' },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Cài đặt đọc truyện"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm border transition-colors ${
          open
            ? 'bg-purple-700 border-purple-500 text-white'
            : 'bg-site-card border-site-border text-gray-300 hover:border-purple-500 hover:text-white'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span className="hidden sm:inline">Cài đặt</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#1a1a2e] border border-[#2a2a45] rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">

          {/* Theme */}
          <div className="p-4 border-b border-[#2a2a45]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Màu nền</p>
            <div className="grid grid-cols-3 gap-2">
              {themeOpts.map(t => (
                <button
                  key={t.value}
                  onClick={() => update({ theme: t.value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    theme === t.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-[#2a2a45] text-gray-400 hover:border-purple-700/50'
                  }`}
                >
                  <span className="w-8 h-5 rounded" style={{ background: t.bg, border: '1px solid #555' }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div className="p-4 border-b border-[#2a2a45]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Cỡ chữ</p>
              <span className="text-xs font-mono text-purple-400">{size}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => update({ size: Math.max(14, size - 1) })}
                className="w-8 h-7 flex items-center justify-center bg-[#0d0d1a] border border-[#2a2a45] rounded text-gray-300 hover:text-white hover:border-purple-500 text-xs transition-colors">
                A-
              </button>
              <input type="range" min={14} max={28} value={size}
                onChange={e => update({ size: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500 h-1" />
              <button onClick={() => update({ size: Math.min(28, size + 1) })}
                className="w-8 h-7 flex items-center justify-center bg-[#0d0d1a] border border-[#2a2a45] rounded text-gray-300 hover:text-white hover:border-purple-500 transition-colors">
                A+
              </button>
            </div>
          </div>

          {/* Font family */}
          <div className="p-4 border-b border-[#2a2a45]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Kiểu chữ</p>
            <div className="grid grid-cols-3 gap-2">
              {familyOpts.map(f => (
                <button key={f.value} onClick={() => update({ family: f.value })}
                  className={`py-1.5 px-2 rounded-lg border text-xs transition-all ${
                    family === f.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-[#2a2a45] text-gray-400 hover:border-purple-700/50'
                  }`}
                  style={{ fontFamily: FAMILIES[f.value] }}>
                  {f.preview} <span style={{ fontFamily: 'system-ui' }} className="text-[10px] block">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Line height */}
          <div className="p-4 border-b border-[#2a2a45]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Giãn dòng</p>
            <div className="grid grid-cols-3 gap-2">
              {lineOpts.map(l => (
                <button key={l.value} onClick={() => update({ line: l.value })}
                  className={`py-1.5 rounded-lg border text-xs transition-all ${
                    line === l.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-[#2a2a45] text-gray-400 hover:border-purple-700/50'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Width */}
          <div className="p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Độ rộng trang</p>
            <div className="grid grid-cols-3 gap-2">
              {widthOpts.map(w => (
                <button key={w.value} onClick={() => update({ width: w.value })}
                  className={`py-1.5 rounded-lg border text-xs transition-all ${
                    width === w.value
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-[#2a2a45] text-gray-400 hover:border-purple-700/50'
                  }`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
