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
        // 다크 모드 배경
        'deep-black': '#0a0a0a',
        'dark-bg': '#0f0f0f',
        'dark-card': '#1a1a1a',
        'dark-border': '#262626',
        // 네온 액센트 컬러
        'neon-cyan': '#00f3ff',
        'neon-purple': '#b23aff',
        'neon-blue': '#0066FF',
        'neon-pink': '#ff006e',
        // 코발트 블루 메인 팔레트
        cobalt: {
          50: '#E8F0FE',
          100: '#C5DEFF',
          200: '#8BB9FE',
          300: '#5B9BFE',
          400: '#2B7FFF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001633',
        },
        // 보조 컬러
        gold: {
          400: '#FFB020',
          500: '#FF9500',
          600: '#E68A00',
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
        'neon-cyan': '0 0 20px rgba(0, 243, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(178, 58, 255, 0.5)',
        'neon-blue': '0 0 30px rgba(0, 102, 255, 0.4)',
        'glow': '0 0 40px rgba(0, 102, 255, 0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'rank-up': 'rankUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        rankUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 102, 255, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(15, 15, 15, 0.9) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
