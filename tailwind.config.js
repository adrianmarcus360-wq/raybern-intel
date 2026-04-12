/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A5C',
        'navy-dark': '#102235',
        'navy-mid': '#2B5080',
        'navy-light': '#3D6FA3',
        tan: '#F5F3EE',
        'tan-dark': '#EDE9E0',
        'tan-border': '#D8D2C5',
        'tan-deep': '#C4BDB0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
