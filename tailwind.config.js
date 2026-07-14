/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // editorial palette — primary names
        paper: '#f2efe6',
        'paper-deep': '#ece7d8',
        ink: '#1c1b18',
        line: '#dcd8ca',
        muted: '#5c594e',
        // legacy token names remapped to the light editorial palette so
        // pre-redesign components restyle without per-file edits
        ivory: '#f2efe6',
        'ivory-soft': '#ece7d8',
        'ivory-line': '#dcd8ca',
        cream: '#e8ddc8',
        gold: '#c5a45e',
        'gold-deep': '#a8823e',
        stone: '#5c594e',
        'stone-dim': '#8a867a',
        // dark-theme tokens are inert (class never applied) but kept so
        // untouched files still compile
        night: '#0f0e0c',
        'night-soft': '#161512',
        'night-card': '#1c1a17',
        'night-line': '#2a2620',
        // "Radical Luxury" landing-page palette (assets/DESIGN.md)
        bone: '#F9F8F6',
        'bone-dim': '#E5E5E5',
        graphite: '#444748',
        lime: '#e7eb28',
        'lime-dim': '#cace00',
      },
      fontFamily: {
        grotesk: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        caslon: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        hanken: ['"Hanken Grotesk"', 'Inter', 'sans-serif'],
        jetbrains: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        luxe: '0.22em',
        tightest: '-0.045em',
      },
    },
  },
  plugins: [],
};
