/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/pages/**/*.{html,ts,tsx}", "./src/components/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in-out": "fade-in-out 2s infinite",
      },
      colors: {
        "main-purple": "rgba(88, 28, 135, 0.5)",
        "main-purple-hover": "rgba(102, 34, 155, 0.8)",
      },
      keyframes: {
        "fade-in-out": {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
