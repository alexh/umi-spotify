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
          'pantone-165-darkest': '#341509',
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
          textPulse: {
            '0%, 100%': { textShadow: '0 0 5px #FF5F00, 0 0 10px #FF5F00, 0 0 15px #FF5F00' },
            '50%': { textShadow: '0 0 10px #FF5F00, 0 0 20px #FF5F00, 0 0 30px #FF5F00, 0 0 40px #FF5F00' },
          },
          textGlow: {
            '0%, 100%': { 
              textShadow: '0 0 5px #FF5F00, 0 0 10px #FF5F00, 0 0 10px #FF5F00',
              color: '#FF5F00'
            },
            '50%': { 
              textShadow: '0 0 10px #FF5F00, 0 0 10px #FF5F00, 0 0 5px #FF5F00, 0 0 15px #FF5F00',
              color: '#FF5F00'
            },
          },
        },
        animation: {
          'marquee': 'marquee 30s linear infinite',
          'textPulse': 'textPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'textGlow': 'textGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
    purge: {
      content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
      options: {
        safelist: [
          'opacity-0',
          'opacity-100',
          'transition-opacity',
          'duration-500',
        ],
      },
    },
  }