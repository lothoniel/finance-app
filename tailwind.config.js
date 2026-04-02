/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6B3FA0',
        'primary-light': '#8B5CC8',
        income: '#22C55E',
        expense: '#EF4444',
        transfer: '#3B82F6',
        debt: '#F59E0B',
        gain: '#F59E0B',
        deposit: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

