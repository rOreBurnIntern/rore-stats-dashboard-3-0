/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1f6fff',
        secondary: '#1451cc',
      },
    },
  },
  plugins: [],
}
