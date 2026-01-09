/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: '#0f172a', // Deep Navy (Backgrounds)
          800: '#1e293b', // Lighter Navy (Cards)
          600: '#2563eb', // Standard Police Blue
          500: '#3b82f6', // Hover Blue
        }
      }
    },
  },
  plugins: [],
}