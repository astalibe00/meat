import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function loadRootEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  const parsed = fs.existsSync(envPath)
    ? dotenv.parse(fs.readFileSync(envPath))
    : {};

  return {
    ...parsed,
    ...process.env,
  };
}

export default defineConfig(() => {
  const rootEnv = loadRootEnv();

  return {
    define: {
      __API_BASE_URL__: JSON.stringify(rootEnv.VITE_API_URL || "/api"),
      __DEV_TELEGRAM_ID__: JSON.stringify(
        rootEnv.VITE_DEV_TELEGRAM_ID || rootEnv.DEV_TELEGRAM_ID || "",
      ),
      __SUPABASE_ANON_KEY__: JSON.stringify(
        rootEnv.VITE_SUPABASE_ANON_KEY || rootEnv.SUPABASE_ANON_KEY || "",
      ),
      __SUPABASE_URL__: JSON.stringify(
        rootEnv.VITE_SUPABASE_URL || rootEnv.SUPABASE_URL || "",
      ),
    },
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          changeOrigin: true,
          target: rootEnv.VITE_API_PROXY_TARGET || "http://localhost:3001",
        },
      },
    },
  };
});
