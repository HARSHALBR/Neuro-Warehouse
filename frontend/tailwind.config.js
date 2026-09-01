/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080a0f",
        card: "#0f141f",
        cardBorder: "#1e293b",
        accentBlue: "#3b82f6",
        accentPurple: "#8b5cf6",
        accentRed: "#ef4444",
        accentGreen: "#10b981",
        accentAmber: "#f59e0b",
      },
    },
  },
  plugins: [],
};
