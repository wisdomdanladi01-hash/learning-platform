/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        ink: {
          50: '#f4f7fb',
          100: '#e7eef6',
          200: '#cad9ea',
          300: '#9bb8d4',
          400: '#5f8ab8',
          500: '#3a6a9c',
          600: '#2c5380',
          700: '#244266',
          800: '#1c3553',
          900: '#0e1f3d',
          950: '#0a1730',
        },
        teal: {
          50: '#edfafa',
          100: '#d0f2f2',
          200: '#a6e7e7',
          300: '#6fd5d5',
          400: '#3bbcbc',
          500: '#1fa3a3',
          600: '#128585',
          700: '#0f6a6a',
          800: '#0e5555',
          900: '#0c4646',
          950: '#042d2d',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde58a',
          300: '#fbd24e',
          400: '#f9bf24',
          500: '#e9a40f',
          600: '#c97e06',
          700: '#a45c08',
          800: '#87490e',
          900: '#733d11',
          950: '#432005',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,31,61,0.04), 0 4px 16px rgba(14,31,61,0.06)',
        card: '0 1px 3px rgba(14,31,61,0.05), 0 10px 24px rgba(14,31,61,0.06)',
        pop: '0 12px 40px rgba(14,31,61,0.14)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      maxWidth: {
        content: '78rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
