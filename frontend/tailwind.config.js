/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
          hover: '#2f2f2f',
        },
        border: {
          subtle: '#2a2a2a',
          default: '#3a3a3a',
        },
        text: {
          primary: '#ececec',
          secondary: '#a0a0a0',
          tertiary: '#6b6b6b',
        },
      },
    },
  },
  plugins: [],
}

