/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fm: {
          primary: '#FF8A65',
          'primary-light': '#FFAB91',
          'primary-dark': '#E64A19',
          secondary: '#4DB6AC',
          'secondary-light': '#80CBC4',
          'secondary-dark': '#00897B',
          bg: '#FFF8F0',
          'bg-card': '#FFFFFF',
          'bg-input': '#FFF3E8',
          text: '#3E2723',
          'text-light': '#8D6E63',
          'text-muted': '#BCAAA4',
          yellow: '#FFD54F',
          pink: '#F48FB1',
          purple: '#CE93D8',
          blue: '#81D4FA',
          green: '#A5D6A7',
          border: '#F5E6D8',
          'border-focus': '#FF8A65',
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        input: '10px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(62, 39, 35, 0.08)',
        'card-hover': '0 8px 24px rgba(62, 39, 35, 0.12)',
        btn: '0 4px 12px rgba(255, 138, 101, 0.3)',
        soft: '0 1px 4px rgba(62, 39, 35, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'bounce-in': 'bounceIn 0.5s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
