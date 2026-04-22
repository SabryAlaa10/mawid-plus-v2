/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A73E8',
      },
      keyframes: {
        'grid-shift': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        'rotate-cross': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-stat': {
          '0%': { transform: 'translateX(12px)', opacity: '0.85' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'slide-in-panel': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'error-slide': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'grid-shift': 'grid-shift 18s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'rotate-cross': 'rotate-cross 12s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'slide-stat': 'slide-stat 6s ease-in-out infinite alternate',
        'bounce-soft': 'bounce-soft 4s ease-in-out infinite',
        'slide-in-panel': 'slide-in-panel 0.65s ease-out',
        'error-slide': 'error-slide 0.35s ease-out',
        'check-pop': 'check-pop 0.45s ease-out',
      },
    },
  },
  plugins: [],
}
