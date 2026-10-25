/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: {
    preflight: false,
    container: false
  },
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: { DEFAULT: 'var(--primary)', foreground: '#ffffff' },
        secondary: { DEFAULT: 'var(--bg-2)', foreground: 'var(--text)' },
        destructive: { DEFAULT: 'var(--danger)', foreground: '#ffffff' },
        muted: { DEFAULT: 'var(--surface-hover)', foreground: 'var(--muted)' },
        accent: { DEFAULT: 'var(--surface-hover)', foreground: 'var(--text)' },
        popover: { DEFAULT: 'var(--card)', foreground: 'var(--text)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--text)' },
        success: 'var(--success)',
        warning: 'var(--warning)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: '10px',
        sm: '8px'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)']
      },
      boxShadow: {
        popover: 'var(--shadow-lg)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
