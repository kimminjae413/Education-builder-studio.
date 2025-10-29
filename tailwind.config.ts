import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 코발트 블루 메인 팔레트
        cobalt: {
          50: '#E8F0FE',
          100: '#C5DEFF',
          200: '#8BB9FE',
          300: '#5B9BFE',
          400: '#2B7FFF',
          500: '#0066FF',  // 메인 브랜드 컬러 ⭐
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001633',
        },
        // 보조 컬러
        gold: {
          400: '#FFB020',
          500: '#FF9500',
        },
        // shadcn/ui Alias
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0066FF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#FFB020',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cobalt-sm': '0 1px 2px 0 rgba(0, 102, 255, 0.05)',
        'cobalt-md': '0 4px 6px -1px rgba(0, 102, 255, 0.1)',
        'cobalt-lg': '0 10px 15px -3px rgba(0, 102, 255, 0.1)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'rank-up': 'rankUp 0.6s ease-out',
      },
      keyframes: {
        rankUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
