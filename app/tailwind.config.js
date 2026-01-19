/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f172a',
        panel: '#0b1020',
        accent: '#ff8a3d',
        accent2: '#5de4c7',
        muted: '#94a3b8',
      },
      boxShadow: {
        card: '0 12px 40px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}

