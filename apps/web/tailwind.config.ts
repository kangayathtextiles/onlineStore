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
        canvas: "#F0EFED",
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
    },
  },
  plugins: [],
};

export default config;
