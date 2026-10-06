import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "#FAF8F5",
        sand: "#F4EFEA",
        gold: {
          DEFAULT: "#C59B27",
          light: "#E0BD53",
          dark: "#997316",
          muted: "rgba(197, 155, 39, 0.15)",
        },
        burgundy: {
          DEFAULT: "#651714",
          50: "#fbf3f3",
          100: "#f7e5e4",
          200: "#efcfcd",
          300: "#e2adaa",
          400: "#ce7f7a",
          500: "#b85651",
          600: "#993d38",
          700: "#7f2d29",
          800: "#651714",
          900: "#4b110f",
          950: "#2A0D0B",
        },
        wine: "#2A0D0B",
        plum: "#3C2227",
        charcoal: "#333323",
        surface: {
          DEFAULT: "#18181b",
          subtle: "#27272a",
          card: "#1f1f23",
          border: "#3f3f46",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(101, 23, 20, 0.4)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
