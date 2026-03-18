import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        ink: "#0b0f1a",
        mist: "#f5f7fb",
        ember: "#ff6b4a",
        ocean: "#2b6cff",
        moss: "#1f8f6a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(15, 23, 42, 0.08), 0 20px 60px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
