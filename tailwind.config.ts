import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
        "overlay-show": "overlayShow 0.3s ease-in-out",
        "frame-action-content-show": "frameActionContentShow 0.3s ease-in-out",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        overlayShow: {
          "from": { opacity: "0", transform: "translateY(10px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        frameActionContentShow: {
          "from": { opacity: "0", transform: "scale(0.95)" },
          "to": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
