import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  future: {
    // Hover styles only apply on devices that actually support :hover (mouse/trackpad) —
    // otherwise a tapped element on touch screens can get stuck showing its hover state.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        // Additive only — sm/md/lg/xl/2xl stay at Tailwind's defaults since
        // business-card.tsx's mobile/desktop split and every form's grid
        // columns already depend on those exact values.
        xs: "22.5rem", // 360px — smallest common Android width this app targets
      },
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
        // Semantic aliases onto the scales above — NOT new hex values. Lets new
        // components reach for bg-primary-600/text-trust-600/bg-warn-500 by
        // intent without renaming crimson/brand/gold (which stay exactly as
        // they are everywhere they're already used, e.g. VerifiedBadge's
        // bg-brand-600, every Button variant="primary"'s bg-crimson-600).
        primary: {
          50: "#FDECEC", 100: "#FBD5D3", 200: "#F4A9A3", 300: "#EA7D73", 400: "#DE5347",
          500: "#D32323", 600: "#B71C1C", 700: "#961818", 800: "#731212", 900: "#4F0C0C",
        },
        trust: {
          50: "#EAF5F0", 100: "#CDE7DA", 200: "#9FD0B7", 300: "#69B393", 400: "#3D9576",
          500: "#1F7A5C", 600: "#136348", 700: "#0F5039", 800: "#0C3E2D", 900: "#092E22",
        },
        warn: {
          50: "#FBF5E7", 100: "#F4E4B9", 200: "#ECD088", 300: "#E1B959", 400: "#D2A238",
          500: "#B9862A", 600: "#976B20", 700: "#75521A", 800: "#553D15", 900: "#3A2A0F",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "var(--font-noto-bengali)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "var(--font-noto-bengali)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
        card: "12px",
        sheet: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(22,30,26,0.08), 0 1px 0 rgba(22,30,26,0.04)",
        pop: "0 8px 24px rgba(22,30,26,0.12)",
        lift: "0 16px 32px rgba(22,30,26,0.16), 0 2px 8px rgba(22,30,26,0.08)",
      },
      keyframes: {
        cardFadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        heroFadeIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeInSoft: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        kenBurns: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        shimmerMove: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "card-in": "cardFadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "hero-in": "heroFadeIn 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeInSoft 0.5s ease-out both",
        "ken-burns": "kenBurns 18s ease-out forwards",
        shimmer: "shimmerMove 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;