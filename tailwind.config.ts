import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables (see globals.css) so the whole neutral
        // scale inverts under html.dark with zero per-component changes.
        ink: {
          DEFAULT: "rgb(var(--ink-900) / <alpha-value>)",
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
        },
        // Opaque card/panel surfaces — white in light mode, dark ink in dark mode.
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
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
        crimson: {
          50: "#FDECEC",
          100: "#FBD5D3",
          200: "#F4A9A3",
          300: "#EA7D73",
          400: "#DE5347",
          500: "#D32323",
          600: "#B71C1C",
          700: "#961818",
          800: "#731212",
          900: "#4F0C0C",
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
          DEFAULT: "rgb(var(--sand-100) / <alpha-value>)",
          50: "rgb(var(--sand-50) / <alpha-value>)",
          100: "rgb(var(--sand-100) / <alpha-value>)",
          200: "rgb(var(--sand-200) / <alpha-value>)",
          300: "rgb(var(--sand-300) / <alpha-value>)",
        },
        rose: {
          500: "#B3432C",
          600: "#963727",
        },
        // Fixed (non-theme-swapping) dark scrim for photo-darkening gradients
        // and modal/sheet backdrops — these dim an image or the page behind
        // an overlay and must stay dark in both light and dark mode.
        scrim: "#161E1A",
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(22,30,26,0.08), 0 1px 0 rgba(22,30,26,0.04)",
        pop: "0 8px 24px rgba(22,30,26,0.12)",
        lift: "0 16px 32px rgba(22,30,26,0.16), 0 2px 8px rgba(22,30,26,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
