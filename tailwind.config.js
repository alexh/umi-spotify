module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'pantone-165': '#FF5F00',
          'pantone-165-dark': '#CC4C19',
          'pantone-165-darker': '#963b18',
        },
        fontFamily: {
          'nickel': ['nickel-gothic-variable', 'sans-serif'],
          'receipt': ['receipt-narrow', 'monospace'],
        },
        keyframes: {
          marquee: {
            '0%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        },
        animation: {
          'marquee': 'marquee 30s linear infinite',
        },
      },
    },
    plugins: [
      function({ addUtilities }) {
        const newUtilities = {
          '.font-nickel-slanted': {
            'font-variation-settings': '"slnt" 15, "wdth" 100',
          },
        }
        addUtilities(newUtilities, ['responsive', 'hover'])
      }
    ],
  }