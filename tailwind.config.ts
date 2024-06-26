import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          DEFAULT: "#eaa520",
          dark: "#a16207",
        },
        muted: {
          DEFAULT: "#707070",
          dark: "#949494",
        },
        dark: {
          DEFAULT: "#d0d0d0",
          background: "#1c1c1c",
          foreground: "#d0d0d0",
        },
        light: {
          DEFAULT: "#3c3c3c",
          background: "#f5f5f5",
          foreground: "#3c3c3c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
