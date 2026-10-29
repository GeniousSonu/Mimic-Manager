import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0C10',
        surface: '#10131A',
        raised: '#161A23',
        overlay: '#1C212C',
        inset: '#0D1016',
        border: {
          subtle: '#1F2430',
          default: '#2A3040',
          strong: '#626D85'
        },
        text: {
          primary: '#E9ECF3',
          secondary: '#A5AEC0',
          tertiary: '#747E92',
          disabled: '#4B5365'
        },
        accent: {
          default: '#7C6CFF',
          hover: '#8F81FF',
          pressed: '#6A59F0'
        },
        semantic: {
          success: '#2FBF8F',
          warning: '#F5A524',
          danger: '#F2555A',
          info: '#4DA3FF'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
