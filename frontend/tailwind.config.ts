import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pq: {
          blue: "#2e93ff",
          "blue-dark": "#1a7fd9",
          wash: "#f2f8fc",
          ink: {
            strong: "#111827",
            DEFAULT: "#1f2937",
            2: "#4b5563",
            3: "#6b7280",
            4: "#9ca3af",
          },
          line: "#e5e7eb",
          "line-soft": "#f3f4f6",
          muted: "#f9fafb",
          "muted-2": "#f3f4f6",
          navy: { 900: "#121212", 800: "#1d1d1d", 700: "#2a2a2a" },
          success: "#22c55e",
          "success-bg": "#dcfce7",
          danger: "#ef4444",
          "danger-bg": "#fee2e2",
          warning: "#eab308",
          "warning-bg": "#fef3c7",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "'SN Pro'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["ui-monospace", "'SF Mono'", "Menlo", "monospace"],
      },
      letterSpacing: {
        pq: "-0.5px",
        eyebrow: "0.1em",
      },
      borderRadius: {
        "pq-sm": "8px",
        "pq-md": "12px",
        "pq-lg": "16px",
        "pq-btn": "14px",
        "pq-brand": "20px",
        "pq-pill": "25px",
      },
      boxShadow: {
        "pq-card": "0 4px 0 #e5e7eb",
        "pq-card-hover": "0 2px 0 #e5e7eb",
        "pq-card-lift": "0 6px 0 #e5e7eb",
        "pq-stat": "0 3px 0 #e5e7eb",
        "pq-btn": "0 4px 0 #1a7fd9",
        "pq-btn-hover": "0 2px 0 #1a7fd9",
        "pq-btn-sec": "0 4px 0 #e5e7eb",
        "pq-pill": "0 2px 0 #1a7fd9",
        "pq-soft": "0 18px 40px rgba(15, 23, 42, .07)",
        "pq-deep": "0 26px 70px rgba(3, 12, 35, .58)",
      },
      maxWidth: {
        page: "1320px",
      },
      transitionTimingFunction: {
        pq: "cubic-bezier(.22, .61, .36, 1)",
      },
      transitionDuration: {
        pq: "150ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
