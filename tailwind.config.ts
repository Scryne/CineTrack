import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#080808',
        base: '#0E0E10',
        raised: '#141416',
        overlay: '#1C1C1F',
        subtle: '#242428',
        'border-dim': '#1F1F23',
        'border-mid': '#2C2C32',
        'border-bright': '#3D3D45',
        'purple-950': '#130B2E',
        'purple-800': '#3D1FA8',
        'purple-600': '#5B3FBF',
        'purple-500': '#7B5CF0',
        'purple-400': '#9D7FF4',
        'purple-300': '#BBA8F8',
        'text-pri': '#F2F2F7',
        'text-sec': '#9494A0',
        'text-muted': '#55555F',
        'text-dim': '#35353D',
        'ok': '#34D399',
        'warn': '#FBBF24',
        'err': '#F87171',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '16px', xl: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.5), 0 0 0 1px #1F1F23',
        'card-up': '0 8px 32px rgba(0,0,0,.6), 0 0 0 1px #7B5CF0',
        glow: '0 0 40px rgba(123,92,240,.25)',
        'glow-sm': '0 0 16px rgba(123,92,240,.15)',
      },
      backgroundImage: {
        'fade-b': 'linear-gradient(to bottom, transparent, #080808)',
        'fade-l': 'linear-gradient(to left,   transparent, #080808)',
        'fade-bl': 'linear-gradient(to bottom left, transparent 40%, #080808)',
        'purple-shine': 'linear-gradient(135deg, #1A0F3D 0%, #0E0E10 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
        'count-up': 'count-up 0.4s ease-out forwards',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
