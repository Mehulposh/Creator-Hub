/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      colors: {
        hub: {
          bg: '#0d0b14',
          surface: '#211b31',
          border: 'rgba(216, 201, 255, 0.12)',
          muted: '#9d94ad',
          accent: '#916dfa',
          violet: '#9b79fa'
        }
      },
      animation: {
        spin: 'spin 1s linear infinite',
        'pulse-ring': 'pulse-ring 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease'
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' }
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' }
        }
      }
    }
  },
  plugins: []
};
