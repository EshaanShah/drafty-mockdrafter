/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        black: "#000000",
        primary: "#007AFF",  // iOS Blue
        light: "#F4F6F9",    // light gray bg
        gray: "#4F4F4F",     // dark gray text
      },
      fontFamily: {
        quicksand: ["Quicksand-Regular", "sans-serif"],
        "quicksand-bold": ["Quicksand-Bold", "sans-serif"],
        "quicksand-semibold": ["Quicksand-SemiBold", "sans-serif"],
        "quicksand-light": ["Quicksand-Light", "sans-serif"],
        "quicksand-medium": ["Quicksand-Medium", "sans-serif"],
        pingfang: ["PingFangSC-Regular", "sans-serif"],
        "pingfang-bold": ["PingFangSC-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
