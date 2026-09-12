/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff88',
        'neon-cyan': '#00d4ff',
        'neon-red': '#ff2244',
        'neon-amber': '#ffaa00',
        'neon-orange': '#ff6600',
        'dark-bg': '#0a0e1a',
        'dark-panel': '#0f1629',
        'dark-card': '#141c35',
        'dark-border': '#1e2d50',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
