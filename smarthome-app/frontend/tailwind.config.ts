import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          card: '#12121a',
          hover: '#1a1a26',
        },
        border: '#1e1e2e',
        txt: {
          primary: '#c9d1d9',
          secondary: '#6e7681',
          muted: '#3d4450',
        },
        accent: {
          DEFAULT: '#4a9eff',
          dim: '#2a6bbf',
        },
        success: '#3fb950',
        warning: '#f0a500',
        danger: '#f85149',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'San Francisco',
          'Segoe UI', 'Helvetica Neue', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
