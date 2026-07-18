import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: '#5B5FEF',
        canvas: '#E9EAF5',
        ink: '#1F2937',
        muted: '#9CA3AF',
        coral: '#F43F7E'
      },
      boxShadow: { card: '0 14px 36px rgba(52, 56, 120, 0.08)' },
      borderRadius: { card: '20px' }
    }
  },
  plugins: []
}
export default config
