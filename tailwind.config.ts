import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#141417",
        elevated: "#1c1c21",
        border: "#2a2a31",
        muted: "#8a8a93",
        text: "#ededf0",
        accent: "#e25822",
        accentMuted: "#a8421a",
        success: "#3fb950",
        danger: "#f85149",
        warning: "#d29922",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(226,88,34,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
