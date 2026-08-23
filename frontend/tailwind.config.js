/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mission: {
          bg:      '#000000',
          surface: '#050811',
          card:    '#070B14',
          border:  '#141E33',
          cyan:    '#00F0FF',
          emerald: '#10B981',
          amber:   '#F59E0B',
          crimson: '#EF4444',
          muted:   '#64748B',
          text:    '#F1F5F9',
        },
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.25)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.3)',
        'neon-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        pulse_slow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink:      'blink 1s step-end infinite',
        scan:       'scan 2s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        scan: {
          '0%':   { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
