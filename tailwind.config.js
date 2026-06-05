/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        felt: {
          dark: '#123f28',
          DEFAULT: '#1a5c3a',
          light: '#206b44',
        },
        gold: {
          DEFAULT: '#c9a227',
          light: '#e8c04a',
          dim: '#7a6118',
        },
        'card-bg': '#fdf8f0',
        'card-border': '#d4c5a0',
        'card-red': '#c0392b',
        'text-felt': '#f0ead8',
        'text-muted': '#a8c5b0',
      },
      animation: {
        'slide-in': 'slideIn 0.25s ease',
        'fade-in': 'fadeIn 0.2s ease',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
