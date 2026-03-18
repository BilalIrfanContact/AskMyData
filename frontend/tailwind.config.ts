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
        main: "#0b0b0b",
        ember: "#280905",
        crimson: "#740A03",
        accent: "#E6501B",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(195, 17, 12, 0.25), 0 18px 50px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
