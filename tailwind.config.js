/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Values come from BRIEF.md section 2. The NAMES are deliberately
        // unchanged: 236 usages of `accent`, 66 of `shadow-*` and 37 of
        // `rounded-card` already exist across 29 pages, and redefining the
        // token moves all of them at once. Renaming would have meant touching
        // every page to achieve the same result, and would have left the
        // undesigned pages behind — which is exactly the unevenness this is
        // meant to remove.
        canvas: "#F4F4F1",
        surface: "#FFFFFF",
        surfaceMuted: "#FAFAF8",
        line: "#E3E2DD",
        lineSoft: "#EEEDE8",
        panel: "#FFFFFF",
        panelMuted: "#FAFAF8",
        borderSubtle: "#E3E2DD",

        ink: "#15171A",
        ink2: "#3B4047",
        // textStrong/textMuted/textSubtle keep their names so existing pages
        // inherit the new ink scale untouched.
        textStrong: "#15171A",
        textMuted: "#61666F",
        textSubtle: "#61666F",

        navSelected: "#E4E3DD",
        navHover: "#EAE9E4",

        // Was #7C5CFC. The purple is the single most template-looking thing
        // in the UI, and it appears on every primary button and active nav
        // item; one value change retires it everywhere.
        accent: "#1E5B47",
        accentSoft: "#E6EDE9",
        accentForeground: "#FFFFFF",

        success: { DEFAULT: "#2F8F5B", soft: "#E8F1EC", text: "#1E6B3F" },
        warning: { DEFAULT: "#C27C0E", soft: "#F7EFE0", text: "#8A4B08" },
        danger: { DEFAULT: "#D1453B", soft: "#F7E7E6", text: "#A12A21" },
        info: { DEFAULT: "#1E5B47", soft: "#E6EDE9" },
        neutral: "#A3A6AC",
        neutralBadge: { DEFAULT: "#61666F", soft: "#F1F0EC" },
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
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
        // The brief specifies 6px controls / 8px containers. These two names
        // are used 37 times; repointing them is what makes the soft, rounded
        // look give way to the squarer tool aesthetic everywhere at once.
        control: "6px",
        card: "8px",
        panel: "8px",
      },
      boxShadow: {
        // "No box-shadows anywhere. 1px borders only." Rather than edit 66
        // call sites across pages this redesign does not otherwise touch,
        // the tokens resolve to nothing — so every existing `shadow-card`
        // silently stops painting and no page is left with a stray shadow.
        card: "none",
        "nav-active": "none",
        soft: "none",
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
