/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#181d26',
        'primary-active': '#0d1218',
        ink: '#181d26',
        body: '#333840',
        muted: '#41454d',
        hairline: '#e8e8e8',
        canvas: '#ffffff',
        'surface-soft': '#f8fafc',
        'surface-mid': '#f0f2f5',
        'sig-coral': '#aa2d00',
        'sig-forest': '#0a2e0e',
        'sig-cream': '#f5e9d4',
        'sig-mint': '#a8d8c4',
        'sig-mint-dark': '#2e7d65',
        'sig-mustard': '#c8912a',
        'sig-coral-light': '#fff1ec',
        'sig-mint-light': '#eef8f4',
        'sig-mustard-light': '#fdf6e3',
        success: '#1a7a3c',
        'success-bg': '#e8f5ee',
        danger: '#c0392b',
        'danger-bg': '#fdecea',
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

