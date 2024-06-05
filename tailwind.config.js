/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "src/pages/**/*.{html,ts,tsx}",
    "src/components/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in-out": {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        "fade-in-out": "fade-in-out 2s infinite",
      },
    },
  },
  plugins: [],
};
