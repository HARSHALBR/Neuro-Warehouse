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
        surface: {
          bg: "#06080e",
          card: "#0d121d",
          sub: "#080b12",
        },
        border: {
          subtle: "#1e293b",
          focus: "#38bdf8",
        },
        semantic: {
          success: "#10b981",
          failure: "#f43f5e",
          recovery: "#d946ef",
          info: "#38bdf8",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
