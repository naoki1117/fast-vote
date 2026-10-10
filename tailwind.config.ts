import type { Config } from "tailwindcss";

// スキャン対象は App Router 配下。独自色とカード影だけ拡張する
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
        },
      },
      boxShadow: {
        panel: "0 18px 50px -24px rgb(15 23 42 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
