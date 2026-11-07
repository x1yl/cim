/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rajdhani", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Orbitron", "Rajdhani", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          contrast: "var(--accent-contrast)",
        },
        arena: {
          gold: "rgb(var(--accent-rgb) / <alpha-value>)",
          crimson: "#ff1744",
          cyan: "rgb(var(--accent-rgb) / <alpha-value>)",
          obsidian: "#05050a",
          steel: "#1a1a24",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgb(var(--accent-rgb) / 0.35)",
        "glow-crimson": "0 0 30px rgba(255,23,68,0.35)",
        "glow-cyan": "0 0 30px rgb(var(--accent-rgb) / 0.35)",
      },
      clipPath: {
        angular: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
      },
      animation: {
        "scan": "scan 6s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "flicker": "flicker 3s linear infinite",
      },
      keyframes: {
        scan: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        pulseGlow: { "0%,100%": { opacity: 0.6 }, "50%": { opacity: 1 } },
        flicker: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.85 } },
      },
    },
  },
  plugins: [],
};
