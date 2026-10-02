/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azure: {
          50: '#eff6ff',
          500: '#0078d4',
          600: '#005a9e',
          900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
