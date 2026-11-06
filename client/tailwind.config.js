/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] },
      colors: {
        neon: { pink: "#ff006e", purple: "#8338ec", blue: "#3a86ff", green: "#06d6a0", yellow: "#ffbe0b", cyan: "#00f5d4" },
      },
      boxShadow: { glow: "0 0 24px rgba(131,56,236,0.45)" },
      animation: {
        "aurora": "aurora 12s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        aurora: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(10%,5%) scale(1.1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
      },
    },
  },
  plugins: [],
};
