import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fira Sans"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        primary: '#1E293B',
        'on-primary': '#FFFFFF',
        secondary: '#334155',
        'on-secondary': '#FFFFFF',
        accent: '#22C55E',
        'on-accent': '#0F172A',
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1B2336',
        'card-foreground': '#F8FAFC',
        'card-hover': '#1E293B',
        muted: '#272F42',
        'muted-foreground': '#94A3B8',
        border: '#475569',
        'border-subtle': '#334155',
        destructive: '#EF4444',
        'on-destructive': '#000000',
        ring: '#FFFFFF',
        cf: {
          newbie: '#9e9e9e',
          pupil: '#22c55e',
          specialist: '#06b6d4',
          expert: '#3b82f6',
          candidate: '#a855f7',
          master: '#f97316',
          grandmaster: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
