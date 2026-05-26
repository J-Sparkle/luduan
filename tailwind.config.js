/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  // Dark mode is currently unplanned in the new bookish system (paper-tone
  // monochrome is the committed direction). Leave the class hook in place
  // so we can layer dark later without a config change.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF6',
        surface: '#FFFFFF',
        'surface-alt': '#F4F1EA',
        ink: {
          DEFAULT: '#161616',
          soft: 'rgb(22 22 22 / 0.72)',
          mute: 'rgb(22 22 22 / 0.52)',
          faint: 'rgb(22 22 22 / 0.32)',
          rule: 'rgb(22 22 22 / 0.16)',
          hair: 'rgb(22 22 22 / 0.10)',
        },
        accent: {
          // Muted indigo — committed final accent.
          DEFAULT: 'oklch(0.42 0.09 252)',
          soft: 'oklch(0.42 0.09 252 / 0.08)',
          rule: 'oklch(0.42 0.09 252 / 0.22)',
        },
        // Vermillion is reserved for the logo seal at large sizes only;
        // never used on UI controls.
        vermillion: {
          DEFAULT: 'oklch(0.56 0.15 28)',
          soft: 'oklch(0.95 0.03 28)',
        },
        ok: 'oklch(0.52 0.10 155)',
        warn: 'oklch(0.62 0.13 70)',
        err: 'oklch(0.55 0.16 28)',
      },
      fontFamily: {
        // Bookish, all-serif. System fonts on macOS render this without
        // any remote font fetch (Songti SC + Georgia). On other platforms,
        // the chain still resolves to a serif.
        serif: [
          '"Noto Serif SC"',
          '"Songti SC"',
          '"STSong"',
          '"Source Han Serif SC"',
          'Georgia',
          'serif',
        ],
        // Italic Latin asides, captions like "deepseek · chat".
        latin: [
          '"Source Serif 4"',
          '"Source Serif Pro"',
          '"Noto Serif"',
          'Georgia',
          'serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      letterSpacing: {
        'cap-wide': '0.16em',
        'cap-tight': '0.12em',
        'cap-narrow': '0.04em',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        pill: '999px',
      },
      boxShadow: {
        // 命名沿用 design tokens — 见 README 的 shadow scale。
        card: '0 1px 0 rgba(0,0,0,0.02)',
        hover: '0 2px 10px rgba(22,22,22,0.08)',
        float: '0 6px 20px rgba(22,22,22,0.10)',
        pop: '0 8px 28px rgba(22,22,22,0.10)',
        card2: '0 14px 36px rgba(22,22,22,0.16), 0 0 0 1px rgba(22,22,22,0.20)',
        modal: '0 24px 60px rgba(0,0,0,0.18)',
        bubble: '0 2px 10px rgba(22,22,22,0.08)',
        'bubble-hover': '0 6px 20px rgba(22,22,22,0.18)',
      },
      animation: {
        'ld-pulse': 'ld-pulse 1.4s ease-in-out infinite',
        'ld-blink': 'ld-blink 1s infinite',
        'ld-spin': 'ld-spin 0.9s linear infinite',
        'ld-breathe': 'ld-breathe 1.6s ease-in-out infinite',
        'pop-in': 'ld-pop-in 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'ld-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.35' },
        },
        'ld-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'ld-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'ld-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'ld-pop-in': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
