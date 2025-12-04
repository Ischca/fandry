# Fandry

パトロン型ファンサイトプラットフォーム - クリエイターとファンをつなぐ新しい形のコミュニティ

## 概要

Fandryは、クリエイターが自分のファンコミュニティを構築し、収益化できるプラットフォームです。無料投稿、有料投稿、会員限定投稿など、柔軟なコンテンツ配信が可能です。

## 主な機能

### ポイント決済システム
- **ポイント購入**: Stripe Checkoutでポイントを購入（500pt〜10,000pt）
- **1ポイント = 1円**: シンプルな換算レート
- **アダルトコンテンツ対応**: ポイントのみで決済可能（Stripe制限回避）
- **ハイブリッド決済**: ポイントとカードを組み合わせて支払い

### コンテンツ販売
- **無料投稿**: 誰でも閲覧可能
- **有料投稿**: ポイントまたはカードで購入
- **会員限定投稿**: サブスクリプション加入者のみ閲覧

### サブスクリプション
- **月額プラン**: 3階層まで設定可能
- **ポイント決済**: 毎月自動でポイントから引き落とし
- **Stripe決済**: クレジットカードで月額課金

### 投げ銭（チップ）
- **カスタム金額**: 100円〜任意の金額
- **メッセージ付き**: 応援メッセージを添えられる
- **複数の決済方法**: ポイント / カード / ハイブリッド

## 技術スタック

### フロントエンド
- React 19 + TypeScript
- Tailwind CSS 4
- Wouter (ルーティング)
- shadcn/ui (UIコンポーネント)
- tRPC (型安全API)

### バックエンド
- Node.js + Express 4
- tRPC 11
- Drizzle ORM
- Stripe (決済)

### データベース
- Neon PostgreSQL (サーバーレス)

### 認証
- Clerk

### デプロイ
- Railway (ホスティング)
- Cloudflare R2 (ストレージ)

## 開発環境のセットアップ

### 必要な環境
- Node.js 22.x
- pnpm 10.x

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .env を編集して必要な値を設定

# データベースのマイグレーション
pnpm db:push

# 開発サーバーの起動
pnpm dev
```

### 環境変数

```env
# データベース
DATABASE_URL=postgresql://...

# 認証 (Clerk)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# 決済 (Stripe)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...

# ストレージ (Cloudflare R2 / S3互換)
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

## プロジェクト構成

```
fandry/
├── client/              # フロントエンド
│   ├── src/
│   │   ├── pages/       # ページコンポーネント
│   │   ├── components/  # 再利用可能なコンポーネント
│   │   ├── lib/         # ユーティリティ
│   │   └── App.tsx      # ルーティング
│   └── public/          # 静的ファイル
├── server/              # バックエンド
│   ├── routers.ts       # tRPCルーター（メイン）
│   ├── routers/         # モジュラールーター（15ファイル）
│   ├── stripe/          # Stripe Webhook
│   ├── db.ts            # データベースヘルパー
│   └── _core/           # フレームワークコア
├── drizzle/             # データベーススキーマ
│   └── schema.ts
├── storage/             # ストレージヘルパー
└── shared/              # 共有型定義
```

## 開発コマンド

```bash
pnpm dev        # 開発サーバー起動
pnpm check      # TypeScript型チェック
pnpm test       # テスト実行
pnpm build      # プロダクションビルド
pnpm db:push    # データベースマイグレーション
```

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
