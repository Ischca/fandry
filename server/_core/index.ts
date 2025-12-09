import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import rateLimit from "express-rate-limit";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import stripeWebhook from "../stripe/webhook";

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "https://fndry.app", "https://fandry.app"];

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => process.env.NODE_ENV === "development", // Skip in development
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // limit each IP to 10 requests per minute
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => process.env.NODE_ENV === "development",
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy - required for rate limiting behind reverse proxy
  // SECURITY: Only enable when behind a trusted proxy (Railway, Heroku, AWS ELB, etc.)
  // If self-hosting or exposing directly to internet, set TRUST_PROXY=0 or remove this
  // See: https://expressjs.com/en/guide/behind-proxies.html
  const trustProxy = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? "1" : "0");
  if (trustProxy !== "0" && trustProxy !== "false") {
    app.set("trust proxy", parseInt(trustProxy) || trustProxy);
  }

  // Stripe webhook (must be before body parser to get raw body)
  app.use("/api/stripe/webhook", stripeWebhook);

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
          frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://*.clerk.accounts.dev", "https://*.clerk.com"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow loading external resources
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        // In development, allow localhost with any port
        if (process.env.NODE_ENV === "development" && origin.startsWith("http://localhost")) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Clerk authentication middleware
  app.use(clerkMiddleware());

  // Rate limiting for API endpoints
  app.use("/api/trpc", apiLimiter);

  // Stricter rate limiting for sensitive operations (payments, auth)
  app.use("/api/trpc/point.purchasePoints", strictLimiter);
  app.use("/api/trpc/purchase", strictLimiter);
  app.use("/api/trpc/subscription", strictLimiter);
  app.use("/api/trpc/tip", strictLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
