import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
