/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f4369',
        primary_container: '#d1e4f9',
        on_primary: '#ffffff',
        background: '#fcf9f4',
        surface: '#fcf9f4',
        on_surface: '#1c1c19',
        surface_container_low: '#f6f3ee',
        surface_container_lowest: 'rgba(255, 255, 255, 0.7)',
        surface_container_highest: '#e5e2dd',
        tertiary: '#493f36',
        outline: '#72777f',
        outline_variant: '#c2c7cf',
        error: '#ba1a1a',

        // Map the old tokens to new ones to prevent complete breakage while migrating
        'technical-blue': '#0f4369',
        'technical-green': '#493f36', // Replacing green with tertiary earthy tone
        'technical-gray': '#72777f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'], // Replace old mono with Space Grotesk for the technical look
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(28, 28, 25, 0.1)',
        'hard-md': '6px 6px 0px 0px rgba(28, 28, 25, 0.15)',
        'hard-lg': '8px 8px 0px 0px rgba(28, 28, 25, 0.2)',
        'hard-glass': '8px 8px 0px 0px rgba(28, 28, 25, 0.05)',
      }
    },
  },
  plugins: [],
}
