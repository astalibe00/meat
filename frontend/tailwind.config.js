/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgMain: "rgb(var(--color-bg-main) / <alpha-value>)",
        dark: "rgb(var(--color-dark) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        "primary-soft": "rgb(var(--color-primary-soft) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        textPrimary: "rgb(var(--color-text-primary) / <alpha-value>)",
        textSecondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
