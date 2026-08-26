import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF6EE",
          soft: "#F3EEE1",
          card: "#FFFEFB",
        },
        forest: {
          DEFAULT: "#2C3323",
          light: "#3B4530",
          soft: "#4B5740",
        },
        clay: {
          DEFAULT: "#D08A5C",
          soft: "#E8B692",
          pale: "#F5E1D0",
        },
        sage: {
          DEFAULT: "#7C8A5E",
          soft: "#A9B48C",
          pale: "#E6EADB",
        },
        ink: "#2A2A22",
        muted: "#8A8574",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 14px 0 rgba(44, 51, 35, 0.06)",
        card: "0 1px 3px 0 rgba(44, 51, 35, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
