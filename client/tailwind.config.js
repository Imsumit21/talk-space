import defaultTheme from "tailwindcss/defaultTheme.js";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
          DEFAULT: "#6366f1",
        },
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          DEFAULT: "#3b82f6",
        },
        voice: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
          DEFAULT: "#10b981",
        },
        social: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
          DEFAULT: "#f59e0b",
        },
        surface: {
          900: "#0f0f23",
          800: "#1a1a2e",
          700: "#2a2a3e",
          600: "#3a3a4e",
        },
        glass: {
          white: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.12)",
          hover: "rgba(255, 255, 255, 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        heading: ["Space Grotesk", "Inter", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0px 0px var(--tw-shadow-color)" },
          "50%": { boxShadow: "0 0 8px 2px var(--tw-shadow-color)" },
        },
        meshGradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-8px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
        fadeOut: "fadeOut 150ms ease-in",
        slideUp: "slideUp 200ms ease-out",
        slideDown: "slideDown 200ms ease-out",
        scaleIn: "scaleIn 150ms ease-out",
        ripple: "ripple 600ms ease-out",
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        meshGradient: "meshGradient 15s ease-in-out infinite",
        shake: "shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
      },
      boxShadow: {
        "glow-sm": "0 0 8px -2px var(--tw-shadow-color)",
        "glow-md": "0 0 16px -4px var(--tw-shadow-color)",
        "glow-lg": "0 0 24px -6px var(--tw-shadow-color)",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
