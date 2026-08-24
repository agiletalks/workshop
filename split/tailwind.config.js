/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fubon: {
          blue: {
            DEFAULT: '#0e9aa0', // Card Teal
            dark: '#0a7a7e',
            light: 'rgba(14, 154, 160, 0.08)',
            glow: 'rgba(14, 154, 160, 0.15)',
          },
          green: {
            DEFAULT: '#F59E0B', // Card Amber/Yellow
            dark: '#D97706',
            light: 'rgba(245, 158, 11, 0.08)',
            glow: 'rgba(245, 158, 11, 0.15)',
          },
          orange: {
            DEFAULT: '#F59E0B',
            dark: '#D97706',
            light: 'rgba(245, 158, 11, 0.08)',
          }
        }
      },
      fontFamily: {
        sans: [
          'Outfit',
          'Noto Sans TC',
          'PingFang TC',
          'Microsoft JhengHei',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
