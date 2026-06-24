import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        fg: 'hsl(var(--fg))',
        surface: 'hsl(var(--surface))',
        'surface-card': 'hsl(var(--surface-card))',
        border: 'hsl(var(--border))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          fg: 'hsl(var(--accent-fg))',
        },
        glow: 'hsl(var(--glow))',
        // Gurukul / Saffron / Copper palette tokens (used heavily throughout the app)
        saffron: {
          50:  'hsl(35,100%,95%)',
          100: 'hsl(35,100%,88%)',
          200: 'hsl(35,98%,78%)',
          300: 'hsl(35,96%,67%)',
          400: 'hsl(35,92%,58%)',
          DEFAULT: 'hsl(var(--saffron))',
          500: 'hsl(var(--saffron))',
          600: 'hsl(35,88%,44%)',
          700: 'hsl(35,84%,34%)',
          800: 'hsl(35,80%,24%)',
          900: 'hsl(35,76%,14%)',
        },
        copper: {
          400: 'hsl(28,62%,60%)',
          DEFAULT: 'hsl(var(--copper))',
          500: 'hsl(var(--copper))',
          600: 'hsl(28,60%,40%)',
        },
        beige: {
          DEFAULT: 'hsl(var(--beige))',
          500: 'hsl(var(--beige))',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 25px rgba(16, 185, 129, 0.15)',
        'glow-strong': '0 0 30px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.20)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.20)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)' },
          '50%': { boxShadow: '0 0 35px rgba(16, 185, 129, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
