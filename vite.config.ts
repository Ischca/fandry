import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import path from "path";
import { defineConfig } from "vite";

const plugins = [
  react(),
  tailwindcss(),
  vike(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Clerk authentication
          if (id.includes("node_modules/@clerk/")) {
            // Clerk depends on React; keeping them in the same chunk avoids
            // circular chunk imports (vendor-react <-> vendor-clerk) that can
            // break ESM initialization in production builds.
            return "vendor-react";
          }
          // tRPC and React Query
          if (id.includes("node_modules/@trpc/") || id.includes("node_modules/@tanstack/")) {
            return "vendor-trpc";
          }
          // Radix UI components
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // Lucide icons
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          // Other large libraries
          if (id.includes("node_modules/superjson/") || id.includes("node_modules/zod/")) {
            return "vendor-utils";
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
