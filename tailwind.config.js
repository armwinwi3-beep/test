/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#0B192C',
        'brand-card': '#11223A',
        'brand-yellow': '#FACC15',
        'brand-blue': '#0066FF',
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'sans-serif'],
      }
    },
  },
  plugins: [],
}