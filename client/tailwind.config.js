/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arvind: {
          50: '#f0f6fc',
          100: '#e1ecf8',
          200: '#c3dbf2',
          300: '#95c2e9',
          400: '#60a4dc',
          500: '#3986cf',
          600: '#256bb8',
          700: '#1e5595',
          800: '#1c487b',
          900: '#002b49', // Arvind signature deep indigo
          950: '#001a30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}

