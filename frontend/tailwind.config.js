/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#0f172a',
          800: '#1e293b',
        },
        accent: {
          500: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
