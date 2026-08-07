/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F5F7",
        surface: "#FFFFFF",
        surfaceMuted: "#F9FAFB",
        line: "#E5E7EB",
        panel: "#FFFFFF",
        panelMuted: "#F9FAFB",
        borderSubtle: "#E5E7EB",
        textStrong: "#1A1C1E",
        textMuted: "#6B7280",
        textSubtle: "#9CA3AF",
        accent: "#7C5CFC",
        accentSoft: "#EDE9FE",
        accentForeground: "#FFFFFF",
        success: {
          DEFAULT: "#2E7D32",
          soft: "#E8F5E9",
        },
        warning: {
          DEFAULT: "#F57C00",
          soft: "#FFF8E1",
        },
        danger: {
          DEFAULT: "#D32F2F",
          soft: "#FFEBEE",
        },
        info: {
          DEFAULT: "#7B1FA2",
          soft: "#F3E5F5",
        },
        neutralBadge: {
          DEFAULT: "#4B5563",
          soft: "#F3F4F6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        // Reserved for live/console-style moments (support queue, ops rails) — used deliberately, not app-wide.
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        // Match the app's two most common bespoke card radii so they're named, not magic numbers.
        card: "22px",
        panel: "28px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
        "nav-active": "0 1px 3px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.05)",
        soft: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.72" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-16px, 18px)" },
        },
        fillBar: {
          "0%": { width: "0%" },
          "100%": { width: "var(--fill-to, 100%)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out forwards",
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite",
        "fill-bar": "fillBar 1.1s 0.3s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
