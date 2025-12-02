# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fandry is a patron-style fan site platform (similar to Patreon/Fanbox) built with React + tRPC + Drizzle ORM. It enables creators to build fan communities with free/paid/membership-only posts and Stripe-based subscriptions.

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
│   └── lib/trpc.ts   # tRPC client setup

server/               # Express + tRPC backend
├── routers.ts        # All tRPC procedures (appRouter)
├── db.ts             # Database query helpers
└── _core/            # Framework internals (auth, tRPC setup, OAuth)
    ├── trpc.ts       # publicProcedure, protectedProcedure, adminProcedure
    ├── context.ts    # Request context with user
    └── oauth.ts      # Manus OAuth integration

drizzle/
└── schema.ts         # All table definitions (users, creators, posts, etc.)

shared/               # Shared types and constants
└── const.ts          # COOKIE_NAME, error messages
```

### Key Patterns

**tRPC Integration**: Frontend uses `@/lib/trpc.ts` which imports `AppRouter` type from `server/routers.ts`. All API calls are type-safe end-to-end.

**Database Flow**:
1. Define tables in `drizzle/schema.ts` (uses MySQL dialect with Neon PostgreSQL)
2. Add query helpers in `server/db.ts` (e.g., `getCreatorByUsername`, `createPost`)
3. Create tRPC procedures in `server/routers.ts`

**Authentication**: Uses Manus OAuth. Three procedure types:
- `publicProcedure` - No auth required
- `protectedProcedure` - Requires logged-in user
- `adminProcedure` - Requires admin role

**Path Aliases**:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Data Model

Core entities: `users` → `creators` (1:1), `creators` → `posts` (1:many)

Post access levels:
- `free` - Public
- `paid` - Requires one-time purchase
- `membership` - Requires active subscription tier

## Testing

Tests are in `server/*.test.ts` using vitest. Run a single test file:
```bash
pnpm vitest run server/creator.test.ts
```

## Environment Variables

Required: `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`
Optional: S3/R2 storage (`S3_ENDPOINT`, etc.), Stripe (`STRIPE_SECRET_KEY`, etc.)
