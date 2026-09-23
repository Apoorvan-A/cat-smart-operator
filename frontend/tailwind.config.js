/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Industrial cab surfaces — deep, low-glare charcoals.
        ink: {
          900: "#0B0E14", // app background
          800: "#0F131B", // rail / deepest panel
          700: "#12161F", // surface
          600: "#171C27", // raised surface
          500: "#1E2431", // hover / elevated
          400: "#2A3242", // borders (strong)
        },
        line: "#232A36", // hairline border
        // CAT hi-vis yellow — reserved for primary action + brand only.
        cat: {
          DEFAULT: "#FFCD11",
          bright: "#FFD740",
          dim: "#C9A21A",
        },
        // Text ramp.
        fg: {
          DEFAULT: "#E7ECF3",
          muted: "#93A0B4",
          faint: "#66738A",
        },
        // Severity ramp — used consistently everywhere severity appears.
        sev: {
          info: "#3B82F6",
          warning: "#F5A623",
          high: "#F97316",
          critical: "#EF4444",
        },
        // Machine / health states.
        ok: "#22C55E",
        degraded: "#F5A623",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Barlow Semi Condensed'", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 30px -12px rgba(0,0,0,0.6)",
        pop: "0 20px 50px -20px rgba(0,0,0,0.75)",
        "glow-cat": "0 0 0 1px rgba(255,205,17,0.4), 0 8px 30px -8px rgba(255,205,17,0.25)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        sweep: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
        sweep: "sweep 3.5s linear infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
