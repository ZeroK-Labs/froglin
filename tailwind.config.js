/** @type {import('tailwindcss').Config} */

const colors = {
  "main-purple": "rgba(88, 28, 135, 0.5)",
  //[#6c5ce7]
  "main-purple-hover": "rgba(102, 34, 155, 0.8)",
  "text-shadow-normal": "rgb(5, 5, 5)",
  "text-shadow-hover": "rgb(255, 5, 5)",
};

export default {
  content: [
    "./frontend/pages/**/*.{html,ts,tsx}",
    "./frontend/components/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors,
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
  plugins: [
    function ({ addUtilities }) {
      addUtilities(
        {
          ".text-shadow-default": {
            textShadow: `${colors["text-shadow-normal"]} 1px 1px 3px`,
          },
          ".text-shadow-hover": {
            textShadow: `${colors["text-shadow-hover"]} 2px 2px 4px`,
          },
        },
        ["responsive", "hover"],
      );
    },
  ],
};
