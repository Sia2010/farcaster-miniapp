/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#04A8EC",
        accent: "#F4C454",
        darkblue: "#05367F",
        lightblue: "#5A7DAB",
        bg: "#F7F9FB"
      }
    }
  },
  plugins: []
}
