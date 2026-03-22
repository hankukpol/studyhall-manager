import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        none: "none",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        police: {
          DEFAULT: "#1B4FBB",
          light: "#EBF0FB",
          dark: "#0D2D6B",
        },
        fire: {
          DEFAULT: "#C55A11",
          light: "#FEF3EC",
          dark: "#7A3608",
        },
        attend: {
          present: "#16A34A",
          tardy: "#CA8A04",
          absent: "#DC2626",
          excused: "#2563EB",
          holiday: "#6B7280",
          unprocessed: "#F97316",
        },
        warn: {
          1: "#EAB308",
          2: "#F97316",
          interview: "#DC2626",
          withdraw: "#7F1D1D",
        },
      },
    },
  },
  plugins: [],
};
export default config;
