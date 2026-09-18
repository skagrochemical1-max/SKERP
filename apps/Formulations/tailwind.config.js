/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': 'var(--bg)',
        'cyber-panel': 'var(--surface)',
        'cyber-border': 'var(--border)',
        'cyber-lime': 'var(--accent)',
        'cyber-emerald': 'var(--success)',
        'cyber-gray': 'var(--text-secondary)',
        'cyber-light': 'var(--text-muted)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'lime-glow': '0 0 20px rgba(204, 255, 0, 0.3)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
}
