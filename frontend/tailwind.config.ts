import type { Config } from "tailwindcss";

// Tailwind v4 — основные настройки в globals.css через @theme
// Этот файл нужен только для content paths
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
