import type { Config } from 'tailwindcss';

// NOTE: Preflight is disabled so Tailwind utilities are available (per PRD stack)
// without resetting the ported design-system CSS in app/globals.css, which is the
// primary source of styling for this app.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-deep': 'var(--accent-deep)',
        danger: '#E24B4A',
        warning: '#EF9F27',
      },
      fontFamily: {
        sans: ['Geist', 'Urbanist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
