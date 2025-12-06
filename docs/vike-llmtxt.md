# Vike (vite-plugin-ssr) LLM Reference

> Vikeは、Next.js/Nuxtの代替となるモジュラーフレームワーク。既存のVite + Expressに統合可能。

## インストール

```bash
pnpm add vike vike-react
```

## 基本設定

### vite.config.ts
```typescript
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'

export default {
  plugins: [
    react(),
    vike({
      prerender: true, // オプション: ビルド時プリレンダリング
    })
  ]
}
```

### pages/+config.ts (グローバル設定)
```typescript
import type { Config } from 'vike/types'
import vikeReact from 'vike-react/config'

export default {
  ssr: true, // SSR有効化
  extends: [vikeReact]
} satisfies Config
```

## Express統合

### server/index.ts
```typescript
import express from 'express'
import { apply } from 'vike-server/express'
import { serve } from 'vike-server/express/serve'

function startServer() {
  const app = express()

  // 既存のAPIルート
  app.use('/api', apiRouter)

  // Vikeミドルウェア
  apply(app)

  return serve(app, { port: 3000 })
}

export default startServer()
```

### 手動統合 (より細かい制御)
```typescript
import express from 'express'
import { createDevMiddleware, renderPage } from 'vike/server'

const app = express()
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  app.use(express.static('dist/client'))
} else {
  const { devMiddleware } = await createDevMiddleware({ root: process.cwd() })
  app.use(devMiddleware)
}

app.get('*', async (req, res) => {
  const pageContext = await renderPage({
    urlOriginal: req.originalUrl,
    headersOriginal: req.headers,
    user: req.user // カスタムコンテキスト
  })

  const { httpResponse } = pageContext
  httpResponse.headers.forEach(([name, value]) => res.setHeader(name, value))
  res.status(httpResponse.statusCode)
  httpResponse.pipe(res)
})

app.listen(3000)
```

## ファイル構造

```
pages/
├── +config.ts          # グローバル設定
├── +Layout.tsx         # グローバルレイアウト
├── +Head.tsx           # グローバルhead要素
├── index/
│   └── +Page.tsx       # / ルート
├── creator/
│   └── @username/
│       ├── +Page.tsx   # /creator/:username
│       ├── +data.ts    # サーバーサイドデータ取得
│       ├── +title.ts   # 動的タイトル
│       └── +route.ts   # カスタムルート (オプション)
└── post/
    └── @id/
        ├── +Page.tsx   # /post/:id
        └── +data.ts
```

## データ取得 (+data.ts)

```typescript
// pages/creator/@username/+data.ts
// Environment: server

export { data }
export type Data = Awaited<ReturnType<typeof data>>

import type { PageContextServer } from 'vike/types'

async function data(pageContext: PageContextServer) {
  const { username } = pageContext.routeParams

  // サーバーサイドのみで実行 - DB直接アクセス可
  const creator = await db.select().from(creators)
    .where(eq(creators.username, username))
    .limit(1)

  return {
    creator: creator[0],
  }
}
```

## コンポーネントでデータ使用 (useData)

```tsx
// pages/creator/@username/+Page.tsx

import { useData } from 'vike-react/useData'
import type { Data } from './+data'

export default function Page() {
  const { creator } = useData<Data>()

  return (
    <div>
      <h1>{creator.displayName}</h1>
      <p>@{creator.username}</p>
    </div>
  )
}
```

## pageContext アクセス

```tsx
import { usePageContext } from 'vike-react/usePageContext'

export function Page() {
  const pageContext = usePageContext()

  // 利用可能なプロパティ
  pageContext.urlParsed.pathname  // /creator/john
  pageContext.routeParams.username // john
  pageContext.user // カスタムプロパティ (サーバーから渡す)
}
```

## SEO: Head タグ

### グローバル設定
```typescript
// pages/+config.ts
import type { Config } from 'vike/types'
import vikeReact from 'vike-react/config'
import image from './og-image.png'

export default {
  title: 'Fandry - クリエイター支援プラットフォーム',
  description: 'クリエイターとファンをつなぐ',
  image,
  extends: [vikeReact]
} satisfies Config
```

### グローバルHead
```tsx
// pages/+Head.tsx
import favicon from './favicon.svg'

export function Head() {
  return (
    <>
      <link rel="icon" href={favicon} type="image/svg+xml" />
      <meta name="theme-color" content="#E05A3A" />
    </>
  )
}
```

### ページ別設定
```typescript
// pages/creator/@username/+config.ts
export default {
  title: 'クリエイターページ',
}
```

### 動的タイトル
```typescript
// pages/creator/@username/+title.ts
import type { PageContext } from 'vike/types'
import type { Data } from './+data'

export default (pageContext: PageContext<Data>) =>
  `${pageContext.data.creator.displayName} (@${pageContext.data.creator.username}) | Fandry`
```

### コンポーネント内でhead設定
```tsx
import { Config } from 'vike-react/Config'
import { Head } from 'vike-react/Head'

function CreatorPage() {
  const { creator } = useData<Data>()

  return (
    <>
      <Config title={`${creator.displayName} | Fandry`} />
      <Head>
        <meta property="og:image" content={creator.avatarUrl} />
        <meta name="description" content={creator.bio} />
      </Head>
      {/* ページコンテンツ */}
    </>
  )
}
```

## レイアウト

### グローバルレイアウト
```tsx
// pages/+Layout.tsx
import './global.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### ネストレイアウト
```tsx
// pages/dashboard/+Layout.tsx
import { DashboardSidebar } from '@/components/DashboardSidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

## ルーティング

### ファイルシステムルーティング (デフォルト)
```
pages/index/+Page.tsx        → /
pages/about/+Page.tsx        → /about
pages/creator/@username/     → /creator/:username
pages/post/@id/+Page.tsx     → /post/:id
```

### カスタムルート
```typescript
// pages/creator/@username/+route.ts
export default '/creator/@username'

// または関数
import type { PageContext } from 'vike/types'
export default (pageContext: PageContext) => {
  const match = pageContext.urlPathname.match(/^\/creator\/([a-z0-9_]+)$/)
  if (!match) return false
  return { routeParams: { username: match[1] } }
}
```

## Wrapper (プロバイダー)

```tsx
// pages/+Wrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, trpcClient } from '@/lib/trpc'

const queryClient = new QueryClient()

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

## クライアントサイドナビゲーション

```tsx
import { navigate } from 'vike/client/router'

// プログラマティックナビゲーション
navigate('/creator/john')

// リンクコンポーネント (vike-reactが提供)
import { Link } from 'vike-react/Link'
<Link href="/creator/john">プロフィール</Link>
```

## SSR無効化 (SPAモード)

```typescript
// pages/admin/+config.ts
export default {
  ssr: false, // このページはSPAとしてレンダリング
  extends: [vikeReact]
}
```

## プリレンダリング

```typescript
// vite.config.ts
vike({
  prerender: true
})

// または特定ページのみ
// pages/about/+config.ts
export default {
  prerender: true
}
```

## 環境変数

```typescript
// サーバーサイド (+data.ts, +onBeforeRender.ts等)
process.env.DATABASE_URL

// クライアントサイド
import.meta.env.VITE_PUBLIC_KEY
```

## ビルド

```bash
# 開発
pnpm vite

# プロダクションビルド
pnpm vite build

# プリレンダリング付きビルド
pnpm vite build && pnpm vite prerender
```

## 出力構造

```
dist/
├── client/          # 静的アセット
│   ├── assets/
│   └── index.html
└── server/          # サーバーバンドル
    └── index.js
```

## tRPC統合パターン

```tsx
// pages/+Wrapper.tsx
import { trpc } from '@/lib/trpc'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Wrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

## 既存SPAからの移行手順

1. `vike` と `vike-react` をインストール
2. `vite.config.ts` に `vike()` プラグイン追加
3. `pages/+config.ts` 作成 (vikeReact extends)
4. `pages/+Layout.tsx` 作成 (既存App.tsxの構造を移動)
5. 各ページを `pages/xxx/+Page.tsx` に移動
6. ルーティング (@param形式に変換)
7. データ取得を `+data.ts` に移動
8. Express統合を設定

## 注意点

- `+` で始まるファイルはVikeの特殊ファイル
- `@` で始まるフォルダ名はルートパラメータ
- `+data.ts` はデフォルトでサーバーサイドのみ実行
- クライアントに渡すデータは最小限に (シリアライズされる)
- pageContextは各リクエストで新しく作成される
