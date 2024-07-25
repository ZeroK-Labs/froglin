/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/pages/**/*.{html,ts,tsx}", "./src/components/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "main-purple": "rgba(88, 28, 135, 0.5)",
        "main-purple-hover": "rgba(102, 34, 155, 0.8)",
      },
      grayscale: {
        50: "50%",
        80: "80%",
      },
      animation: {
        "fade-in-out": "fade-in-out 2s infinite",
        "toast-in": "toast-in 1s ease",
        "toast-out": "toast-out 1s ease",
      },
      keyframes: {
        "fade-in-out": {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
        "toast-in": {
          from: { opacity: 0, transform: "translate(10rem)" },
          to: { opacity: 1, transform: "translate(0)" },
        },
        "toast-out": {
          from: { opacity: 1, transform: "translate(0)" },
          to: { opacity: 0, transform: "translate(10rem)" },
        },
      },
    },
  },
  plugins: [],
};
