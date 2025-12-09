# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fandry is an adult content creator platform (similar to Fantia/Fanbox) built with React + tRPC + Drizzle ORM. It enables creators to build fan communities with free/paid/membership-only posts.

**Key Features**:
- ポイント決済システム（Point-based payment system）
- 有料コンテンツ販売（Paid content sales）
- メンバーシップ（月額サブスクリプション）
- 投げ銭（Tips）
- アダルトコンテンツ対応（ポイントのみ決済可）

## Commands

```bash
# Development
pnpm dev              # Start dev server (tsx watch)
pnpm check            # TypeScript type check (tsc --noEmit)
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run all tests with vitest

# Database
pnpm db:push          # Generate and run migrations (drizzle-kit generate && drizzle-kit migrate)

# Production
pnpm build            # Build for production (vite + esbuild)
pnpm start            # Run production server
```

## Architecture

### Full-Stack TypeScript Monorepo

```
client/               # React frontend (Vite)
├── src/
│   ├── pages/        # Route components (Home, CreatorPage, Feed, etc.)
│   ├── components/   # Shared UI (shadcn/ui based)
│   │   ├── Header.tsx           # Shared site header (nav, search, user menu)
│   │   ├── PostCard.tsx         # Post card with like/comment actions
│   │   ├── PurchaseDialog.tsx   # Content purchase with payment method selection
│   │   ├── SubscribeDialog.tsx  # Subscription with points/Stripe
│   │   ├── TipDialog.tsx        # Tipping with hybrid payment
│   │   ├── PointBalance.tsx     # Header point balance display
│   │   └── ...
│   └── lib/trpc.ts   # tRPC client setup
├── public/           # Static assets
│   ├── favicon.svg   # SVG favicon (warm coral theme)
│   ├── og-image.svg  # OG image source
│   ├── robots.txt    # Search engine directives
│   ├── sitemap.xml   # Site map for SEO
│   └── site.webmanifest  # PWA manifest

scripts/              # Build/dev scripts
└── generate-images.mjs  # SVG to PNG converter (uses sharp)

server/               # Express + tRPC backend
├── routers.ts        # Main router aggregation
├── routers/          # Modular routers (15 files)
│   ├── _shared.ts    # Shared imports (procedures, schema, helpers)
│   ├── _errors.ts    # Unified error handling
│   ├── creator.ts    # Creator profile management
│   ├── post.ts       # Post CRUD
│   ├── point.ts      # Point balance, transactions, packages
│   ├── purchase.ts   # Content purchase (points/Stripe/hybrid)
│   ├── subscription.ts  # Subscription management
│   ├── tip.ts        # Tipping with payment options
│   └── ...
├── stripe/
│   └── webhook.ts    # Stripe webhook handler (all payment types)
├── lib/
│   ├── crypto.ts     # Encryption utilities (AES-256-GCM)
│   ├── logger.ts     # Structured logging (Railway-compatible JSON)
│   └── auditLogger.ts # Payment audit trail
├── db.ts             # Database query helpers
└── _core/            # Framework internals
    ├── trpc.ts       # publicProcedure, protectedProcedure, adminProcedure
    ├── context.ts    # Request context with Clerk auth
    └── index.ts      # Express server setup

drizzle/
└── schema.ts         # All table definitions

shared/               # Shared types and constants
└── const.ts          # Error messages, constants
```

### Key Patterns

**tRPC Integration**: Frontend uses `@/lib/trpc.ts` which imports `AppRouter` type from `server/routers.ts`. All API calls are type-safe end-to-end.

**Router Organization**: Routers are modular in `server/routers/`. Each router imports from `_shared.ts` which re-exports common dependencies.

**Database Flow**:
1. Define tables in `drizzle/schema.ts` (PostgreSQL with Neon serverless)
2. Add query helpers in `server/db.ts`
3. Create tRPC procedures in `server/routers/*.ts`
4. Export from `server/routers/index.ts`
5. Add to `server/routers.ts` appRouter

**Authentication**: Uses Clerk. Three procedure types:
- `publicProcedure` - No auth required
- `protectedProcedure` - Requires logged-in user
- `adminProcedure` - Requires admin role

**Payment Processing**:
- **Point System**: Virtual currency (1pt = 1 JPY)
- **Adult Content**: Points only (Stripe restriction compliance)
- **Non-Adult Content**: Points, Stripe direct, or hybrid (points + Stripe)
- **Stripe Checkout**: Used for point purchases and direct payments
- **Webhook**: `server/stripe/webhook.ts` handles all payment completions
- **Amount Limits**: All amounts use `bigint` in DB, max 1 billion JPY validation

**Security**:
- **Rate Limiting**: `express-rate-limit` (100 req/15min general, 10 req/min for payments)
- **CORS**: Explicit origin whitelist via `cors` middleware
- **Security Headers**: `helmet.js` with CSP, X-Frame-Options, etc.
- **Bank Account Encryption**: AES-256-GCM via `server/lib/crypto.ts`
- **File Upload Validation**: Magic byte verification for MIME type validation
- **Error Handling**: Production errors hide internal details (tRPC errorFormatter)

**Logging**:
- **Structured Logger**: `server/lib/logger.ts` outputs Railway-compatible JSON logs
- **Log Levels**: `debug`, `info`, `warn`, `error` (configurable via `LOG_LEVEL` env)
- **Usage**: `import { logger } from './lib/logger'; logger.info("message", { userId, amount })`
- **Railway Search**: Filter logs by `@operationType:post_purchase`, `@userId:123`, `@level:error`

**Path Aliases**:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

**SEO**: Comprehensive meta tags in `client/index.html`:
- OGP, Twitter Card, JSON-LD structured data
- Favicon/OG images use "Warm Celebration" theme (coral `#E05A3A`)
- Run `node scripts/generate-images.mjs` to regenerate PNGs from SVGs

### Data Model

Core entities:
- `users` → `creators` (1:1)
- `creators` → `posts` (1:many)
- `users` → `userPoints` (1:1) - Point balance
- `users` → `pointTransactions` (1:many) - Transaction history

Post access levels:
- `free` - Public
- `paid` - Requires one-time purchase (points or Stripe)
- `membership` - Requires active subscription tier

Adult content flags:
- `creators.isAdult` - Creator-level flag
- `posts.isAdult` - Post-level flag
- `subscriptionPlans.isAdult` - Plan-level flag

## Testing

Tests are in `server/*.test.ts` using vitest. Run a single test file:
```bash
pnpm vitest run server/creator.test.ts
```

## Environment Variables

**Required**:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- `CLERK_SECRET_KEY` - Clerk backend key
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk key for Vite
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for frontend

**Optional**:
- Cloudflare R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `ENCRYPTION_KEY` - For bank account encryption (32+ chars recommended)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (defaults: localhost:3000, fndry.app, fandry.app)
- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error` (default: `info` in production, `debug` in dev)
- `SERVICE_NAME` - Service name for log entries (default: `fandry-api`)
- `TRUST_PROXY` - Express trust proxy setting (default: `1` in production, `0` in dev). **SECURITY**: Set to `0` if self-hosting without a reverse proxy. See: https://expressjs.com/en/guide/behind-proxies.html

## Deployment

- **Hosting**: Railway
- **Database**: Neon PostgreSQL
- **Storage**: Cloudflare R2
- **Domain**: fandry.app (via Cloudflare DNS)

## Document Maintenance

When making significant changes, update the relevant documentation:
- `todo.md` - Project progress and remaining tasks
- `CLAUDE.md` - Architecture and development guidance
- `README.md` - User-facing documentation
