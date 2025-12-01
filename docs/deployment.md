# デプロイメントガイド

## Railway + Neon + Cloudflare R2 構成

### 前提条件

- GitHubアカウント
- Neonアカウント
- Cloudflareアカウント
- Railwayアカウント
- Stripeアカウント

### 1. Neon PostgreSQLのセットアップ

1. [Neon Console](https://console.neon.tech/) にアクセス
2. 新しいプロジェクトを作成
   - プロジェクト名: `fandry`
   - リージョン: Asia Pacific (推奨)
3. 接続文字列をコピー
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

### 2. Cloudflare R2のセットアップ

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にアクセス
2. R2セクションに移動
3. 新しいバケットを作成
   - バケット名: `fandry-storage`
   - リージョン: Asia Pacific (推奨)
4. R2 APIトークンを作成
   - 権限: Read & Write
   - アクセスキーIDとシークレットアクセスキーをコピー

### 3. Stripeのセットアップ

1. [Stripe Dashboard](https://dashboard.stripe.com/) にアクセス
2. APIキーを取得
   - Publishable key
   - Secret key
3. Webhookを設定
   - エンドポイント: `https://your-app.railway.app/api/stripe/webhook`
   - イベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Webhook署名シークレットをコピー

### 4. Railwayへのデプロイ

1. [Railway](https://railway.app/) にアクセス
2. GitHubアカウントでログイン
3. 新しいプロジェクトを作成
   - 「Deploy from GitHub repo」を選択
   - `Ischca/fandry` リポジトリを選択
4. 環境変数を設定

#### 必須の環境変数

```env
# データベース
DATABASE_URL=postgresql://neondb_owner:...@ep-summer-morning-a1xui7l9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# 認証（Manusから提供される）
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=your-owner-name

# ストレージ（Cloudflare R2）
S3_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_BUCKET=fandry-storage
S3_REGION=auto

# 決済（Stripe）
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# その他
NODE_ENV=production
PORT=3000
```

5. デプロイを実行
   - Railwayが自動的にビルドとデプロイを開始
   - デプロイ完了後、URLが発行される

### 5. デプロイ後の確認

1. アプリケーションURLにアクセス
2. ログイン機能をテスト
3. クリエイター登録をテスト
4. 投稿作成をテスト
5. 決済機能をテスト（テストモード）

### トラブルシューティング

#### データベース接続エラー

- `DATABASE_URL` が正しく設定されているか確認
- Neonデータベースが起動しているか確認
- SSL接続が有効になっているか確認（`sslmode=require`）

#### ストレージエラー

- R2のアクセスキーが正しいか確認
- バケット名が正しいか確認
- CORSポリシーが設定されているか確認

#### 決済エラー

- Stripeのシークレットキーが正しいか確認
- Webhookエンドポイントが正しく設定されているか確認
- Webhook署名シークレットが正しいか確認

### スケーリング

Railwayは自動的にスケーリングしますが、以下の点に注意：

- データベース接続数の上限（Neon Free: 100接続）
- R2のストレージ容量（無料枠: 10GB）
- Stripeの決済手数料

### バックアップ

- Neonは自動バックアップを提供
- R2のデータは定期的にバックアップを推奨
- 環境変数は安全な場所に保管

### モニタリング

- Railwayのログを定期的に確認
- Stripeのダッシュボードで決済状況を確認
- Neonのダッシュボードでデータベースのパフォーマンスを確認

## 代替構成

### Vercel（サーバーレス）

フロントエンドのみをVercelにデプロイし、バックエンドをRailwayに分離する構成も可能。

### AWS（フルマネージド）

- Frontend: S3 + CloudFront
- Backend: Lambda + API Gateway
- Database: RDS PostgreSQL
- Storage: S3

コストは高いが、スケーラビリティとパフォーマンスが向上。

## セキュリティ

- 環境変数は絶対にコミットしない
- APIキーは定期的にローテーション
- HTTPS通信を必須にする
- CSRFトークンを実装（tRPCが自動処理）
- SQLインジェクション対策（Drizzle ORMが自動処理）
