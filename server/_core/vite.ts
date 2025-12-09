import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { renderPage } from "vike/server";

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "../..", "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Vike SSR middleware for development
  app.get("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      const pageContext = await renderPage({
        urlOriginal: req.originalUrl,
        headersOriginal: req.headers,
      });
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
  // ビルド出力先: dist/public/client (Vikeクライアントビルド)
  // tsx実行時は import.meta.dirname = server/_core なので ../.. でプロジェクトルートに戻る
  const clientPath = path.resolve(import.meta.dirname, "../..", "dist", "public", "client");

  if (!fs.existsSync(clientPath)) {
    console.error(
      `Could not find the build directory: ${clientPath}, make sure to build the client first`
    );
  }

  // 静的アセットを提供
  app.use(express.static(clientPath));

  // Vike SSR middleware for production
  app.get("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      const pageContext = await renderPage({
        urlOriginal: req.originalUrl,
        headersOriginal: req.headers,
      });
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
