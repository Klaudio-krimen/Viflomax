import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // Note: proyecto no usa directorio src/
  ],
  theme: {
    extend: {
      colors: {
        viflomax: {
          // Tailwind aplana los objetos anidados con guiones: `azul` -> bg-viflomax-azul
          // (clave DEFAULT), `azul.700` -> bg-viflomax-azul-700.
          azul: {
            100: '#eaf6fc',
            200: '#cdeaf7',
            300: '#a3d9f0',
            400: '#6dc2e3',
            DEFAULT: '#2f9fd6',
            600: '#2380ac',
            700: '#1a628a',
            800: '#164a63',
            900: '#0d2f40',
          },
          verde: {
            100: '#eef9e6',
            200: '#d9f0c7',
            300: '#bce39c',
            400: '#97cf6c',
            DEFAULT: '#6ab04c',
            600: '#549140',
            700: '#3f6f31',
            800: '#2c4f23',
            900: '#1c3216',
          },
          // Alias legacy: los usan 39 archivos de /admin y /chofer que no se editan.
          // Como claves hermanas no chocan con las numericas de las escalas.
          'azul-oscuro': '#164a63',
          'verde-claro': '#97cf6c',
        }
      },
      fontFamily: {
        nunito: ['var(--font-nunito)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

export default config
