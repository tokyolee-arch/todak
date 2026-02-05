import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        todak: {
          brown: "#8B7355",
          beige: "#D4A574",
          green: "#7B9E89",
          cream: "#F5F1E8",
          orange: "#E07A5F",
        },
      },
      fontSize: {
        body: "18px",
        heading: "24px",
        title: "32px",
      },
      minHeight: {
        touch: "48px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
