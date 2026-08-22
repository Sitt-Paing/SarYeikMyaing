/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00A3FF', // Logo vibrant electric cyan
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        obsidian: {
          900: '#0B0F19', // Logo deep black
          800: '#111827',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Padauk', 'Pyidaungsu', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brand-glow': '0 4px 20px -2px rgba(0, 163, 255, 0.25)',
        'brand-hover': '0 10px 25px -3px rgba(0, 163, 255, 0.35)',
        'card-soft': '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
