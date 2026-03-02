import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0D0D0F",
          card: "#16161A",
          hover: "#1E1E24",
        },
        border: {
          DEFAULT: "#2A2A35",
        },
        purple: {
          DEFAULT: "#7B5CF0",
          light: "#9D7FF4",
          dark: "#5A3FD4",
          glow: "rgba(123,92,240,0.15)",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#8B8B99",
          muted: "#4A4A5A",
        },
        success: "#22C55E",
        rating: "#F59E0B",
        // Legacy aliases for backward compatibility
        background: "#0D0D0F",
        card: "#16161A",
        accent: "#7B5CF0",
        "accent-hover": "#9D7FF4",
        foreground: "#F0F0F5",
        muted: "#8B8B99",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        // Legacy alias
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px #2A2A35",
        "card-hover":
          "0 0 0 1px #7B5CF0, 0 0 24px rgba(123,92,240,0.15)",
        "purple-glow": "0 0 32px rgba(123,92,240,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
