const konstaConfig = require('konsta/config');

/** @type {import('tailwindcss').Config} */
module.exports = konstaConfig({
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy iOS tokens (still referenced by some primitives).
        'ios-blue': '#0a84ff',
        'ios-green': '#30d158',
        'ios-red': '#ff453a',
        'ios-orange': '#ff9f0a',
        'ios-bg': '#f2f2f7',
        'ios-bg-dark': '#000000',
        'ios-card': '#ffffff',
        'ios-card-dark': '#1c1c1e',

        // New card-based design language.
        app: '#F1F2F4',
        'app-dark': '#0B0B0E',
        surface: '#FFFFFF',
        'surface-dark': '#17181C',
        'surface-2-dark': '#202127',
        ink: '#0E0F12',
        coral: '#FF6F61',
        'coral-soft': '#FBDAD4',
        mint: '#1FD0B0',
        lilac: '#B7A6F3',
        'lilac-soft': '#E7E0FB',
        peach: '#F0C18B',
        'peach-soft': '#F8E7CF',
        amber: '#F4A93C',
        gain: '#27C281',
      },
      boxShadow: {
        nav: '0 10px 30px -8px rgba(17, 24, 39, 0.22)',
      },
      fontFamily: {
        ios: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
});
