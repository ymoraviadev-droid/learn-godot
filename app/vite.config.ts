import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { contentPlugin } from "./src/vite-plugin-content";

export default defineConfig({
  plugins: [react(), tailwindcss(), contentPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: ["**/content/chapters/**"],
    },
  },
});
