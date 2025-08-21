import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Definimos el color "muted-foreground" para que no de error
        'muted-foreground': 'hsl(215 20.2% 65.1%)',
      },
    },
  },
  plugins: [],
} satisfies Config
