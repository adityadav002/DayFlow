/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-subtle)',
          100: 'var(--color-primary-light)',
          200: '#a9d9c8',
          300: '#78c1ab',
          400: '#4da58d',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-dark)',
          700: 'var(--color-primary-darker)',
          800: '#1b4036',
          900: '#17342d',
        },
        surface: {
          50: 'var(--color-bg)',
          100: 'var(--color-surface-subtle)',
          150: 'var(--color-hover-bg)',
          200: 'var(--color-border)',
          300: 'var(--color-border-strong)',
          400: 'var(--color-text-muted)',
          500: 'var(--color-text-secondary)',
          600: '#495463',
          700: '#333d4a',
          800: 'var(--color-midnight-80)',
          900: 'var(--color-text)', // Midnight Blue base
          950: '#0f1624',
        },
        accent: {
          50: 'var(--color-taupe-subtle)',
          100: 'var(--color-taupe-light)',
          200: '#eae1d3',
          300: '#dcd0bc',
          400: '#c9b79d',
          500: 'var(--color-taupe)',
          600: '#a48e71',
          700: '#897258',
          800: '#705e4a',
          900: '#5c4d3e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
