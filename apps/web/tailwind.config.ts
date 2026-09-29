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
      colors: {
        background: '#090a0f',
        card: '#11131a',
        'card-hover': '#161922',
        border: '#1f2430',
        'border-subtle': '#181b24',
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
