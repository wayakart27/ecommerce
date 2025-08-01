/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-gold': {
          DEFAULT: '#916A2D',
          50: '#F4E6CC',
          100: '#E8D4AE',
          200: '#D4B174',
          300: '#C08E3A',
          400: '#916A2D', // Our main dark gold color
          500: '#785623',
          600: '#5F421A',
          700: '#462E11',
          800: '#2D1A08',
          900: '#140B00',
        },
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
} 