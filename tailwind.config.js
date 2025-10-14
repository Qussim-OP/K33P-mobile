/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        main: '#fdd331',
        neutral800: '#0E0E0E',
        neutral100:'#B8B8B8',
        neutral200:'#969696',
        success500:'#4CAF50',
        error500: '#F44336',
        mainBlack: '#1A1A1A',
        neutral300:'#666666',
        neutral50:'#E8E8E8',
        primary100: '#FFF3C2',
      },
      fontFamily: {
        sora: ['Sora-Regular'],
        'sora-semibold': ['Sora-SemiBold'],
        'sora-bold': ['Sora-Bold'],
        'space-mono': ['Space-Mono'],
        'space-mono-bold': ['Space-Mono-Bold'],
      },
          },
  },
  plugins: [],
}