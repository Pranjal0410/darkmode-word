/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editor: {
          pink: '#FF69B4',
          purple: '#9370DB',
          blue: '#4169E1',
          dark: '#0A0A1F',
          darker: '#050510',
        }
      },
      boxShadow: {
        'neon': '0 0 15px rgba(147, 112, 219, 0.4)',
      },
      animation: {
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [],
};
