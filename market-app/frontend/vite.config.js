import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Codes that are normal transient disconnects — don't log these
const SILENT_CODES = new Set(["ECONNABORTED", "ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"]);

function silentProxy(proxy) {
  // Suppress http-proxy error events for known transient codes
  proxy.on("error", (err) => {
    if (SILENT_CODES.has(err.code)) return;
    console.warn("[proxy error]", err.message);
  });

  // Suppress errors on the raw underlying socket used by the WS proxy
  proxy.on("proxyReqWs", (_proxyReq, _req, socket) => {
    socket.on("error", () => {});
  });

  // Suppress errors on the proxy target socket
  proxy.on("open", (proxySocket) => {
    proxySocket.on("error", () => {});
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        configure: silentProxy,
      },
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true,
        changeOrigin: true,
        configure: silentProxy,
      },
    },
  },
});
