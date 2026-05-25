/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F1FF',
          100: '#E9E2FF',
          200: '#D2C4FF',
          300: '#B49DFF',
          400: '#956FFF',
          500: '#7C5CFF',
          600: '#6647E6',
          700: '#5235BF',
          800: '#3F2899',
          900: '#2C1B73',
        },
        accent: {
          DEFAULT: '#5B8DEF',
          dark: '#3D6FD1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F8FA',
          subtle: '#EEF0F4',
          dark: '#1A1D2B',
          'dark-muted': '#252836',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 8px 32px rgba(20, 20, 40, 0.12)',
        bubble: '0 4px 16px rgba(124, 92, 255, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pop-in': 'pop-in 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 200ms ease-out',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
