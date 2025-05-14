/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: "#61418A",     // CI-Lila
        secondary: "#F5F5F5",   // Hellgrau für Hintergründe
        accent: "#A484D4",      // Helles Lila für Hover oder Highlights
        base: "#333333",        // Standard-Textfarbe
      },
    },
  },
  plugins: [],
};
