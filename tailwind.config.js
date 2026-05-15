/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        stock: {
          background: 'rgb(var(--color-stock-background-rgb) / <alpha-value>)',
          header: 'rgb(var(--color-stock-header-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-stock-hover-rgb) / <alpha-value>)',
          negative: 'rgb(var(--color-stock-negative-rgb) / <alpha-value>)',
          neutral: 'rgb(var(--color-stock-neutral-rgb) / <alpha-value>)',
          positive: 'rgb(var(--color-stock-positive-rgb) / <alpha-value>)',
          textMuted: 'rgb(var(--color-stock-text-muted-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
