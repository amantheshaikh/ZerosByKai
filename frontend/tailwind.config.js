/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        'comic': ['var(--font-bangers)', 'system-ui', 'cursive'],
        'body': ['var(--font-courier-prime)', 'monospace'],
      },
    },
  },
  plugins: [],
}
