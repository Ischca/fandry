# Fandry

パトロン型ファンサイトプラットフォーム - クリエイターとファンをつなぐ新しい形のコミュニティ

## 概要

Fandryは、クリエイターが自分のファンコミュニティを構築し、収益化できるプラットフォームです。無料投稿、有料投稿、会員限定投稿など、柔軟なコンテンツ配信が可能です。

## 主な機能

### ✅ 実装済み

- **ユーザー認証**: Manus OAuth統合
- **クリエイター機能**:
  - プロフィール設定（アイコン、バナー、自己紹介）
  - 投稿作成（無料/有料/会員限定）
  - サブスクリプションプラン設定（3階層）
- **ファン機能**:
  - クリエイターのフォロー
  - 投稿へのいいね・コメント
  - サブスクリプション購入
- **投稿機能**:
  - 画像付き投稿
  - 投稿タイプ別フィルタリング
  - コメント機能
- **決済機能**: Stripe統合（サブスクリプション、単品購入）

### 🚧 開発中

- 投稿タブ切り替え機能
- 画像アップロード機能の改善
- 投稿編集・削除機能
- 通知機能
- メッセージ機能

## 技術スタック

### フロントエンド
- React 19
- TypeScript
- Tailwind CSS 4
- Wouter (ルーティング)
- shadcn/ui (UIコンポーネント)

### バックエンド
- Node.js
- Express 4
- tRPC 11
- Drizzle ORM

### データベース
- Neon PostgreSQL (サーバーレス)

### ストレージ
- Cloudflare R2 / AWS S3

### 認証
- Manus OAuth

### 決済
- Stripe

### デプロイ
- Railway (予定)

## 開発環境のセットアップ

### 必要な環境

- Node.js 22.x
- pnpm 10.x

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
# .env.example を .env にコピーして必要な値を設定

# データベースのマイグレーション
pnpm db:push

# 開発サーバーの起動
pnpm dev
```

### 環境変数

必要な環境変数は以下の通り：

```env
# データベース
DATABASE_URL=postgresql://...

# 認証
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...

# ストレージ（Cloudflare R2）
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...

# 決済（Stripe）
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## プロジェクト構成

```
fandry/
├── client/              # フロントエンド
│   ├── src/
│   │   ├── pages/      # ページコンポーネント
│   │   ├── components/ # 再利用可能なコンポーネント
│   │   ├── lib/        # ユーティリティ
│   │   └── App.tsx     # ルーティング
│   └── public/         # 静的ファイル
├── server/             # バックエンド
│   ├── routers.ts      # tRPCルーター
│   ├── db.ts           # データベースヘルパー
│   └── _core/          # フレームワークコア
├── drizzle/            # データベーススキーマ
│   └── schema.ts
├── storage/            # ストレージヘルパー
└── shared/             # 共有型定義
```

## 開発ワークフロー

1. `drizzle/schema.ts` でスキーマを更新
2. `pnpm db:push` でマイグレーション
3. `server/db.ts` でクエリヘルパーを追加
4. `server/routers.ts` でtRPCプロシージャを追加
5. `client/src/pages/` でUIを実装
6. `pnpm test` でテスト実行

## デプロイ

### Railway

1. GitHubリポジトリと連携
2. 環境変数を設定
3. 自動デプロイ

詳細は `docs/deployment.md` を参照

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
