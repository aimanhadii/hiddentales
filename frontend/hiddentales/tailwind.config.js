module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"],
        arabic: ["Amiri", "serif"],
      },
      lineHeight: {
        relaxedArabic: "2.2",
      },
    },
  },
  plugins: [],
};
