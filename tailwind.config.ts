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
                    DEFAULT: "#cc2a26",
                    dark: "#e96457",
                    "light-bg": "#f99d8c",
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
            animation: {
                scroll: 'scroll 20s linear infinite',
            },
            keyframes: {
                scroll: {
                    '0%': {
                        // left: '100%'
                        transform: 'translateX(0%)'
                    },
                    '100%': {
                        // left: '-20%'
                        transform: 'translateX(-50%)'
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
