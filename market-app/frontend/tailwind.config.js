/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    // ── Custom screens (mobile-first) ─────────────────────────────────────
    screens: {
      xs:  "400px",   // small phones (SE, Moto)
      sm:  "640px",   // large phones / phablets
      md:  "768px",   // tablets
      lg:  "1024px",  // small laptops
      xl:  "1280px",  // desktops
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        // "DM Serif Display" — editorial weight for key numbers & headlines
        serif:  ["DM Serif Display", "Georgia", "serif"],
        // "Sora" — humanist grotesque, warm and readable for UI text
        sans:   ["Sora", "system-ui", "sans-serif"],
        // "DM Mono" — optical mono that pairs naturally with DM Serif
        mono:   ["DM Mono", "monospace"],
      },
      colors: {
        // ── Brand palette: "The Bombay Chronicle" ──────────────────────
        // Warm charcoal ink — not cold navy, not pure black
        ink:        "#0b0b09",
        surface:    "#111110",
        "surface-2":"#1a1917",
        "surface-3":"#232220",

        // Warm amber-gold accent — the colour of the trading floor bell,
        // of old financial print, of the first light through Dalal Street
        accent:     "#d4963a",
        "accent-dim":"#a07028",
        "accent-glow":"rgba(212,150,58,0.18)",

        // Bull/Bear — kept standard for universal financial literacy
        bull:       "#22c55e",
        "bull-dim": "#16a34a",
        bear:       "#ef4444",
        "bear-dim": "#dc2626",

        // Text hierarchy — warm off-whites, not cold slate
        "text-primary":  "#ede8df",
        "text-secondary":"#b8af9e",
        "text-muted":    "#7a7060",
        "text-faint":    "#4a4540",

        // Border tokens — warm, not indigo
        "border-subtle": "rgba(212,150,58,0.08)",
        "border-dim":    "rgba(212,150,58,0.14)",
        "border-strong": "rgba(212,150,58,0.28)",
      },
      backgroundImage: {
        // Noise grain texture — layered over backgrounds to add tactility
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",

        // Subtle crosshatch grid — felt, not noticed
        "grid-fine":
          "linear-gradient(rgba(212,150,58,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,150,58,0.03) 1px, transparent 1px)",

        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-bull":    "linear-gradient(135deg, #14532d, #22c55e)",
        "gradient-bear":    "linear-gradient(135deg, #7f1d1d, #ef4444)",
        "gradient-accent":  "linear-gradient(135deg, #92400e, #d4963a)",
        "gradient-surface": "linear-gradient(160deg, #111110 0%, #161512 60%, #111110 100%)",
      },
      backgroundSize: {
        "grid-fine": "24px 24px",
      },
      animation: {
        "fade-in":        "fadeIn 0.45s ease forwards",
        "slide-up":       "slideUp 0.32s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in-right": "slideInRight 0.38s cubic-bezier(0.19,1,0.22,1) forwards",
        "ticker":         "ticker 40s linear infinite",
        "pulse-soft":     "pulseSoft 2.4s ease-in-out infinite",
        "shimmer":        "shimmer 1.8s infinite",
        "blink":          "blink 1s step-end infinite",
        "spin-slow":      "spin 3s linear infinite",
        "glow-pulse":     "glowPulse 3s ease-in-out infinite",
        "float":          "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: 0, transform: "translateX(100%)" },
          to:   { opacity: 1, transform: "translateX(0)" },
        },
        ticker:      { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        pulseSoft:   { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.45 } },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
        glowPulse: {
          "0%,100%": { boxShadow: "0 0 12px rgba(212,150,58,0.2)" },
          "50%":     { boxShadow: "0 0 28px rgba(212,150,58,0.4)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-4px)" },
        },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "glow-bull":   "0 0 24px rgba(34,197,94,0.18)",
        "glow-bear":   "0 0 24px rgba(239,68,68,0.18)",
        "glow-accent": "0 0 32px rgba(212,150,58,0.22)",
        "glow-accent-lg": "0 0 60px rgba(212,150,58,0.15)",
        "card":        "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.02) inset",
        "card-hover":  "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,150,58,0.2)",
        "terminal":    "0 0 0 1px rgba(212,150,58,0.12), 0 24px 80px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};
