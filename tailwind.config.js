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
        slot: "1s cubic-bezier(0.65, 0, 0.35, 1) infinite",
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
        slot: {
          "0%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-100%)" },
          "40%": { transform: "translateY(-200%)" },
          "60%": { transform: "translateY(-300%)" },
          "80%": { transform: "translateY(-400%)" },
          "100%": { transform: "translateY(0)" },
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
