/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: '#09090b',
                    card: 'rgba(24, 24, 27, 0.8)',
                    border: 'rgba(255, 255, 255, 0.1)'
                },
                primary: {
                    DEFAULT: '#3b82f6',
                    glow: 'rgba(59, 130, 246, 0.5)'
                }
            },
            fontFamily: {
                sans: ['"Outfit"', 'sans-serif'],
            }
        },
    },
    plugins: [],
    darkMode: 'class',
}
