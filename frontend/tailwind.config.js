/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5", // Indigo
        secondary: "#06b6d4", // Cyan
        bgGradientFrom: "#1e293b", // Slate-800
        bgGradientTo: "#0f172a", // Slate-900
      },
    },
  },
  plugins: [],
};


