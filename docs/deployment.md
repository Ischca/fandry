# デプロイメントガイド

## Railway + Neon + Cloudflare R2 構成

### 前提条件

- GitHubアカウント
- Neonアカウント
- Cloudflareアカウント
- Railwayアカウント
- Clerkアカウント（認証）
- Segpayアカウント（決済）

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

### 3. Clerkのセットアップ

1. [Clerk Dashboard](https://dashboard.clerk.com/) にアクセス
2. 新しいアプリケーションを作成
3. APIキーを取得
   - Publishable key（フロントエンド用）
   - Secret key（バックエンド用）
4. サインイン方法を設定（Email、OAuth等）

### 4. Segpayのセットアップ（決済）

1. [Segpay](https://segpay.com/become-a-client/) にアカウント申請
2. 審査通過後、Merchant Portalにアクセス
3. Package IDとPrice Pointを設定
4. One-Click機能を有効化
5. Webhook URLを設定
   - エンドポイント: `https://your-app.railway.app/api/segpay/webhook`
6. IPホワイトリストにサーバーIPを登録

**Segpayの特徴:**
- アダルトコンテンツ対応
- 日本語決済ページ（`&paypagelanguage=JA`）
- 日本円（JPY）対応
- One-Click Service APIで2回目以降の決済はワンクリック

### 5. Railwayへのデプロイ

1. [Railway](https://railway.app/) にアクセス
2. GitHubアカウントでログイン
3. 新しいプロジェクトを作成
   - 「Deploy from GitHub repo」を選択
   - `Ischca/fandry` リポジトリを選択
4. 環境変数を設定

#### 必須の環境変数

```env
# データベース
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# 認証（Clerk）
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...  # フロントエンド用（CLERK_PUBLISHABLE_KEYと同じ値）

# ストレージ（Cloudflare R2）
S3_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_BUCKET=fandry-storage
S3_REGION=auto

# 決済（Segpay）- 審査通過後に設定
SEGPAY_PACKAGE_ID=your-package-id
SEGPAY_API_KEY=your-api-key

# その他
NODE_ENV=production
PORT=3000
```

5. デプロイを実行
   - Railwayが自動的にビルドとデプロイを開始
   - デプロイ完了後、URLが発行される

### 6. デプロイ後の確認

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

- SegpayのAPIキーが正しいか確認
- WebhookエンドポイントURLが正しく設定されているか確認
- サーバーIPがSegpayでホワイトリスト登録されているか確認
- One-Click機能がPrice Pointで有効になっているか確認

### スケーリング

Railwayは自動的にスケーリングしますが、以下の点に注意：

- データベース接続数の上限（Neon Free: 100接続）
- R2のストレージ容量（無料枠: 10GB）
- Segpayの決済手数料（10-15%）

### バックアップ

- Neonは自動バックアップを提供
- R2のデータは定期的にバックアップを推奨
- 環境変数は安全な場所に保管

### モニタリング

- Railwayのログを定期的に確認
- Segpay Merchant Portalで決済状況を確認
- Neonのダッシュボードでデータベースのパフォーマンスを確認
- Clerkダッシュボードでユーザー認証状況を確認

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
