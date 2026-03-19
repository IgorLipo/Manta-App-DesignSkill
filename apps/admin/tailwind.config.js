/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
        },
        secondary: '#0D9488',
        accent: '#F97316',
        surface: '#FFFFFF',
        background: '#F8FAFC',
        border: '#E2E8F0',
        text: {
          DEFAULT: '#0F172A',
          muted: '#475569',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};
