/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ncTeal: "#1e3a38",    // Deep Green/Teal Sidebar
        ncGold: "#bfa34a",    // Mustard Yellow Highlights
        ncBg: "#f8f9fa",      // Light Gray Background
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}