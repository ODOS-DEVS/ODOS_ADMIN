/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#07111F",
        panel: "#0F1C2D",
        panelMuted: "#15253A",
        borderSubtle: "#243348",
        textStrong: "#F8FAFC",
        textMuted: "#8CA0B9",
        accent: "#F97316",
        accentSoft: "#FED7AA",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#38BDF8"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(15, 23, 42, 0.45)",
      },
      backgroundImage: {
        "panel-gradient":
          "linear-gradient(135deg, rgba(249,115,22,0.16), rgba(56,189,248,0.08))",
      },
    },
  },
  plugins: [],
};
