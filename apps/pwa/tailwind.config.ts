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
        canvas: '#0A0805',
        surface: '#120E09',
        raised: '#1A140D',
        overlay: '#241C12',
        inset: '#0E0B07',
        border: {
          subtle: '#261C12',
          default: '#3A2B1C',
          strong: '#735639'
        },
        text: {
          primary: '#FFF8EE',
          secondary: '#D4C4B0',
          tertiary: '#9E8C78',
          disabled: '#5E5244'
        },
        accent: {
          default: '#FFB000',
          hover: '#FFC033',
          pressed: '#D99400'
        },
        semantic: {
          success: '#28C76F',
          warning: '#FF9F43',
          danger: '#EA5455',
          info: '#00CFE8'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'SF Pro',
          'San Francisco',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'SFMono-Regular',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'monospace'
        ]
      }
    }
  },
  plugins: []
};

export default config;
