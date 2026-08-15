import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          dark:         '#161B20',
          green:        '#E7EAEE',
          'green-deep': '#6B7280',
          gray:         '#F3F5F8',
          mint:         '#F1F5F9',
          muted:        '#50565C',
          border:       '#2A3038',
        },
        // Semantic tokens (reference CSS vars — work in dark + light)
        app: {
          bg:       'var(--bg)',
          surface:  'var(--surface)',
          surface2: 'var(--surface-2)',
          border:   'var(--border)',
          text:     'var(--text)',
          muted:    'var(--text-muted)',
          subtle:   'var(--text-subtle)',
        },
        // Overlay tokens (context-adaptive transparency)
        overlay: {
          DEFAULT: 'var(--overlay)',
          md:      'var(--overlay-md)',
          lg:      'var(--overlay-lg)',
          border:  'var(--overlay-border)',
        },
        sidebar: {
          bg:     'var(--sidebar-bg)',
          border: 'var(--sidebar-border)',
          active: 'var(--sidebar-active)',
          'active-text': 'var(--sidebar-active-text)',
          text:   'var(--sidebar-text)',
          muted:  'var(--sidebar-muted)',
        },
      },
      fontFamily: {
        sora:  ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'card-md': '0 4px 12px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
export default config
