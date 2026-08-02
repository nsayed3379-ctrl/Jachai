import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#161E1A",
          50: "#F4F6F5",
          100: "#E4E9E6",
          200: "#C7D0CA",
          300: "#9FAEA5",
          400: "#6E8177",
          500: "#4C5D53",
          600: "#374841",
          700: "#293630",
          800: "#1D2621",
          900: "#161E1A",
        },
        brand: {
          50: "#EAF5F0",
          100: "#CDE7DA",
          200: "#9FD0B7",
          300: "#69B393",
          400: "#3D9576",
          500: "#1F7A5C",
          600: "#136348",
          700: "#0F5039",
          800: "#0C3E2D",
          900: "#092E22",
        },
        gold: {
          50: "#FBF5E7",
          100: "#F4E4B9",
          200: "#ECD088",
          300: "#E1B959",
          400: "#D2A238",
          500: "#B9862A",
          600: "#976B20",
          700: "#75521A",
          800: "#553D15",
          900: "#3A2A0F",
        },
        sand: {
          DEFAULT: "#FAF7F0",
          50: "#FFFFFF",
          100: "#FAF7F0",
          200: "#F2ECDD",
          300: "#E7DCC2",
        },
        rose: {
          500: "#B3432C",
          600: "#963727",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,30,26,0.06), 0 1px 0 rgba(22,30,26,0.04)",
        pop: "0 8px 24px rgba(22,30,26,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
