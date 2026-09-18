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
        background: "#09090b", // Zinc 950
        foreground: "#fafafa", // Zinc 50
        card: "#18181b", // Zinc 900
        "card-foreground": "#fafafa",
        popover: "#18181b",
        "popover-foreground": "#fafafa",
        primary: "#6366f1", // Indigo 500
        "primary-foreground": "#ffffff",
        secondary: "#27272a", // Zinc 800
        "secondary-foreground": "#fafafa",
        muted: "#27272a",
        "muted-foreground": "#a1a1aa", // Zinc 400
        accent: "#27272a",
        "accent-foreground": "#fafafa",
        destructive: "#ef4444", // Red 500
        "destructive-foreground": "#fafafa",
        border: "#27272a",
        input: "#27272a",
        ring: "#6366f1",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
