import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        site: {
          bg: '#0d0d1a',
          card: '#1a1a2e',
          border: '#2a2a45',
          header: '#16213e',
          accent: '#7c3aed',
          'accent-light': '#a78bfa',
        },
      },
      fontFamily: {
        reading: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
