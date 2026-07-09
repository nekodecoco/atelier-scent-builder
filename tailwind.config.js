/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0f0e0c',
        'night-soft': '#161512',
        'night-card': '#1c1a17',
        'night-line': '#2a2620',
        ivory: '#f7f3ea',
        'ivory-soft': '#efe8d9',
        'ivory-line': '#ddd3bd',
        cream: '#e8ddc8',
        gold: '#d4b872',
        'gold-deep': '#a8823e',
        stone: '#8a8272',
        'stone-dim': '#6b6455',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.22em',
      },
    },
  },
  plugins: [],
};
