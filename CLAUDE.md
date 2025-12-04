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
│   │   ├── PurchaseDialog.tsx   # Content purchase with payment method selection
│   │   ├── SubscribeDialog.tsx  # Subscription with points/Stripe
│   │   ├── TipDialog.tsx        # Tipping with hybrid payment
│   │   ├── PointBalance.tsx     # Header point balance display
│   │   └── ...
│   └── lib/trpc.ts   # tRPC client setup

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

**Path Aliases**:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

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
- S3/R2 storage: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

## Deployment

- **Hosting**: Railway
- **Database**: Neon PostgreSQL
- **Storage**: Cloudflare R2
- **Domain**: fndry.app (via Cloudflare DNS)

## Document Maintenance

When making significant changes, update the relevant documentation:
- `todo.md` - Project progress and remaining tasks
- `CLAUDE.md` - Architecture and development guidance
- `README.md` - User-facing documentation
