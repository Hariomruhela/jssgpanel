import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiBase = env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1"
  let target = "http://127.0.0.1:8000"
  try {
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      target = new URL(apiBase).origin
    }
  } catch {
    target = "http://127.0.0.1:8000"
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})