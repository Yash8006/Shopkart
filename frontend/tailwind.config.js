/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#141414',
        cream: '#FFF7EB',
        paper: '#FFFDF8',
        tomato: { DEFAULT: '#FF5A36', dark: '#E2441F', soft: '#FFE3DA' },
        sun: { DEFAULT: '#FFC93C', soft: '#FFF1C7' },
        mint: { DEFAULT: '#2EC4A0', dark: '#1F9E80', soft: '#D5F5EC' },
        lilac: { DEFAULT: '#A78BFA', soft: '#EDE6FF' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brut: '4px 4px 0 0 #141414',
        'brut-sm': '2px 2px 0 0 #141414',
        'brut-lg': '7px 7px 0 0 #141414',
      },
    },
  },
  plugins: [],
}
