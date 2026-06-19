/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '960px',
        lg: '1280px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f7fa',
          100: '#d6e8ef',
          200: '#aad1de',
          300: '#73b3c8',
          400: '#458ea7',
          500: '#1a4a5e',
          600: '#153d4e',
          700: '#11303e',
          800: '#0d242e',
          900: '#09181e',
        },
        accent: {
          50: '#fdf5ee',
          100: '#fae6d2',
          200: '#f3c9a3',
          300: '#eaa66e',
          400: '#e58a46',
          500: '#e07b39',
          600: '#c96430',
          700: '#a74e28',
          800: '#873f23',
          900: '#6c341e',
        },
        tendency: {
          sympathy: '#4a90d9',
          accountability: '#c94a4a',
          wait_and_see: '#8e7cc3',
          sceptical: '#d4a017',
          neutral: '#3d8b5c',
        },
        paper: {
          50: '#fdfcf8',
          100: '#f8f4ea',
          200: '#efe7d2',
          300: '#e5d8b4',
        },
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Source Han Sans SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 74, 94, 0.08)',
        'card': '0 4px 20px rgba(26, 74, 94, 0.10)',
        'lift': '0 8px 30px rgba(26, 74, 94, 0.12)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(26,74,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,74,94,0.04) 1px, transparent 1px)",
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'flip': 'flip 0.5s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { 
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-4px)' },
          '40%,80%': { transform: 'translateX(4px)' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
