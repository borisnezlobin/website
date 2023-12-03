import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        "primary": {
          DEFAULT: "#ff9d00",
          "dark": "#bf7500",
        },
        "muted": {
          DEFAULT: "#aaa",
          "dark": "#666",
        },
        dark: {
          DEFAULT: "#f5f5f5",
          "background": "#2c2c2c",
          "foreground": "#f5f5f5",
        },
        light: {
          DEFAULT: "#3c3c3c",
          "background": "#f5f5f5",
          "foreground": "#3c3c3c",
        }
      }
    },
  },
  plugins: [],
}
export default config
