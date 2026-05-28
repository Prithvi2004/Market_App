/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bull: "#10b981",
        bear: "#f43f5e",
        ink: "#080e1a",
        surface: "#0f1729",
        accent: "#6366f1",
        "accent-light": "#a5b4fc",
        border: "rgba(99,102,241,0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-bull": "linear-gradient(135deg, #064e3b, #10b981)",
        "gradient-bear": "linear-gradient(135deg, #4c0519, #f43f5e)",
        "gradient-accent": "linear-gradient(135deg, #312e81, #6366f1)",
        "glass": "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.4))",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.3s ease forwards",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.19,1,0.22,1) forwards",
        "ticker": "ticker 40s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "blink": "blink 1s step-end infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: 0, transform: "translateX(100%)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "glow-bull": "0 0 20px rgba(16,185,129,0.15)",
        "glow-bear": "0 0 20px rgba(244,63,94,0.15)",
        "glow-accent": "0 0 30px rgba(99,102,241,0.2)",
        "card": "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
