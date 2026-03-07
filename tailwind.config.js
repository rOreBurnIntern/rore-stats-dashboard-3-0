/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: 'class',
  theme: {},
  plugins: [
    require('daisyui'),
    require('flowbite/plugin')
  ],
}
