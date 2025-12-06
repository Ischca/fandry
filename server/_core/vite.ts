import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { renderPage } from "vike/server";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Vike SSR middleware
  app.get("*", async (req, res, next) => {
    // APIリクエストはスキップ
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      const pageContextInit = {
        urlOriginal: req.originalUrl,
        headersOriginal: req.headers,
      };

      const pageContext = await renderPage(pageContextInit);
      const { httpResponse } = pageContext;

      if (!httpResponse) {
        return next();
      }

      const { statusCode, headers, body } = httpResponse;
      headers.forEach(([name, value]) => res.setHeader(name, value));
      res.status(statusCode).send(body);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export async function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "client")
      : path.resolve(import.meta.dirname, "client");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // 静的アセットを提供
  app.use(express.static(distPath));

  // Vike SSR for production
  app.get("*", async (req, res, next) => {
    // APIリクエストはスキップ
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      const pageContextInit = {
        urlOriginal: req.originalUrl,
        headersOriginal: req.headers,
      };

      const pageContext = await renderPage(pageContextInit);
      const { httpResponse } = pageContext;

      if (!httpResponse) {
        return next();
      }

      const { statusCode, headers, body } = httpResponse;
      headers.forEach(([name, value]) => res.setHeader(name, value));
      res.status(statusCode).send(body);
    } catch (e) {
      console.error("SSR Error:", e);
      next(e);
    }
  });
}
