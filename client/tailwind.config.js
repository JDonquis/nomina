/** @type {import('tailwindcss').Config} */
import colors, { blue } from 'tailwindcss/colors'; // Add this import

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      "color1": "#011140",
      "color2": "#397373",
      "color3": "#7897C8",
      "color4": "#C9EBF2",
      "pink": "#ffa2a2",
      "black": "#000000",
      "dark": "#161616",
      "white": "#FFFFFF",
      "grayBlue": "#c7d2da",
      "red": colors.red,
      "green": colors.green,
      "gray": colors.gray,
      "blue": colors.blue,
      "yellow": colors.yellow,
      "ligthGreen": "#54ffaf",
      "redLight": "#ff6464",
      "background": "#ececec",
      "transparent": "transparent",
      "zelle": "#6a1ccd",
      "binance": "#F3BA2F",
      "orange": "#be5c00",
    },
    extend: {},
  },
  plugins: [],
}

