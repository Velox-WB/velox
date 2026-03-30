/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Velox Design System — Dark Mode Primary
        velox: {
          bg:       '#0a0a0f',
          bg2:      '#111118',
          bg3:      '#16161f',
          surface:  '#1e1e2a',
          surface2: '#252535',
          border:   'rgba(255,255,255,0.07)',
          border2:  'rgba(255,255,255,0.13)',
          text:     '#e8e8f0',
          text2:    '#9898b0',
          text3:    '#5a5a72',
          accent:   '#6c63ff',
          accent2:  '#8b85ff',
          green:    '#22d3a0',
          amber:    '#f59e0b',
          red:      '#f87171',
          blue:     '#60a5fa',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm:   ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'fade-up':    'fadeUp 0.25s ease both',
        'slide-in':   'slideIn 0.22s ease both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
