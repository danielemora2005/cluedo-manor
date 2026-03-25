import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mystery / Cluedo palette
        manor: {
          50:  "#fdf8f0",
          100: "#f7ecd8",
          200: "#efd5aa",
          300: "#e4b773",
          400: "#d8923d",
          500: "#c97320",
          600: "#b05a18",
          700: "#8d4115",
          800: "#723419",
          900: "#5e2c18",
          950: "#341409",
        },
        obsidian: {
          50:  "#f4f4f5",
          100: "#e4e4e7",
          200: "#d1d1d6",
          300: "#a0a0ab",
          400: "#6b6b7b",
          500: "#52525e",
          600: "#3f3f4a",
          700: "#2a2a32",
          800: "#18181f",
          900: "#0f0f14",
          950: "#08080b",
        },
        crimson: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        serif:    ["Playfair Display", "Georgia", "serif"],
        body:     ["Lora", "Georgia", "serif"],
        mono:     ["JetBrains Mono", "Consolas", "monospace"],
      },
      backgroundImage: {
        "manor-texture": "url('/textures/manor.png')",
        "candle-glow":
          "radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)",
      },
      animation: {
        "flicker": "flicker 3s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "deal": "deal 0.4s ease-out forwards",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.85" },
          "25%, 75%":  { opacity: "0.95" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(245,158,11,0.4)"  },
          "50%":       { boxShadow: "0 0 24px rgba(245,158,11,0.8)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)"   },
          "25%":       { transform: "translateX(-6px)" },
          "75%":       { transform: "translateX(6px)"  },
        },
        deal: {
          from: { transform: "translateY(-40px) rotate(-5deg)", opacity: "0" },
          to:   { transform: "translateY(0)      rotate(0deg)",  opacity: "1" },
        },
      },
      boxShadow: {
        "manor": "0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(245,158,11,0.1)",
        "card":  "0 2px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.2)",
        "glow":  "0 0 20px rgba(245,158,11,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
