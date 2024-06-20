import path from "path";

export default {
  plugins: {
    tailwindcss: {
      config: path.resolve("tailwind.config.js"),
    },
    autoprefixer: {},
  },
};
