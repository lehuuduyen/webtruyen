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
          bg: '#fdf4f7',
          card: '#ffffff',
          border: '#fecdd3',
          header: '#fce7f3',
          accent: '#e11d74',
          'accent-light': '#f43f7e',
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
