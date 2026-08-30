const config = {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F5F1',
        surface: '#FFFFFF',
        line: '#E5E3DB',
        ink: {
          DEFAULT: '#2B322F',
          soft: '#4C554F',
          muted: '#6E766F',
        },
        sage: {
          50: '#F0F4F1',
          100: '#DDE7E0',
          200: '#C3D3C8',
          300: '#9EB7A6',
          500: '#5B7F6B',
          600: '#4A6B58',
          700: '#3A5445',
        },
        clay: {
          50: '#F8EDE6',
          100: '#F0D9CD',
          500: '#B4633F',
          600: '#9A5232',
          700: '#7A4126',
        },
        wheat: {
          50: '#F8F1E1',
          100: '#EFE3C7',
          600: '#836430',
        },
        slate2: {
          50: '#EEF2F5',
          100: '#DCE4EA',
          600: '#4B6A7E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43,50,47,0.04), 0 10px 30px -18px rgba(43,50,47,0.18)',
        lift: '0 2px 4px rgba(43,50,47,0.05), 0 24px 48px -24px rgba(43,50,47,0.28)',
      },
      transitionTimingFunction: {
        serene: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
}

export default config
