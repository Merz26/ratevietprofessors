/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "./public/index.html"
  ],
  theme: {
    extend: {
      /** @type {import('tailwindcss').Config} */
      module.exports = {
        content: [
          "./src/**/*.{js,jsx,ts,tsx}",
        ],
        darkMode: 'class', // <--- Enables Dark Mode via a CSS class
        theme: {
          extend: {
            fontFamily: {
              // Overrides the default font so you don't have to declare it everywhere
              sans: ['Inter', 'sans-serif'], 
            },
            colors: {
              // Define your custom brand colors here
              brand: {
                light: '#60a5fa',
                DEFAULT: '#2563eb', // Example: A nice custom blue
                dark: '#1d4ed8',
              }
            }
          },
      },
  plugins: [],
}
    },
  },
  plugins: [],
}
