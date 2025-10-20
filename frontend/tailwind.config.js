/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(217 33% 17%)',
        background: 'hsl(222 47% 11%)',
        foreground: 'hsl(210 40% 98%)',
        primary: { 
          DEFAULT: 'hsl(142 76% 36%)',
          foreground: 'hsl(0 0% 100%)' 
        },
        destructive: { 
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(0 0% 100%)' 
        },
        muted: {
          DEFAULT: 'hsl(217 33% 17%)',
          foreground: 'hsl(215 20% 65%)'
        },
        accent: {
          DEFAULT: 'hsl(217 33% 17%)',
          foreground: 'hsl(210 40% 98%)'
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
