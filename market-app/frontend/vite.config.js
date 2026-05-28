import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            if (err.code === "ECONNABORTED" || err.code === "ECONNRESET" || err.code === "ECONNREFUSED") return;
            console.warn("api proxy error:", err.message);
          });
        },
      },
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            if (err.code === "ECONNABORTED" || err.code === "ECONNRESET" || err.code === "ECONNREFUSED") return;
            console.warn("ws proxy error:", err.message);
          });
        },
      },
    },
  },
});
