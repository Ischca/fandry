# Fandry - プロジェクトTODO

## 完了済み機能

### フェーズ1-6: 基盤実装 (完了)
- [x] データベーススキーマ設計
- [x] Drizzle ORM実装（PostgreSQL/Neon）
- [x] tRPC API基盤
- [x] Clerk認証統合
- [x] クリエイター機能（プロフィール、投稿管理）
- [x] フィード・発見ページ
- [x] フォロー機能
- [x] いいね・コメント機能
- [x] 投稿作成・編集機能
- [x] 月額支援プラン機能

### フェーズ7-9: UI/UX改善 (完了)
- [x] レスポンシブデザイン
- [x] エラーハンドリング統一
- [x] ローディング状態
- [x] テストデータ投入

### フェーズ11: SEO・UI改善 (完了)
- [x] SEO Phase 1実装
  - [x] index.html meta tags (description, keywords, author)
  - [x] OGP (Open Graph Protocol) 設定
  - [x] Twitter Card設定
  - [x] JSON-LD構造化データ
  - [x] favicon.svg / favicon-*.png 生成
  - [x] og-image.svg / og-image.png 生成
  - [x] apple-touch-icon.svg / apple-touch-icon.png
  - [x] robots.txt / sitemap.xml
  - [x] site.webmanifest (PWA対応)
- [x] 共通ヘッダーコンポーネント（Header.tsx）
- [x] PostCard UI改善（ホバー効果、相対時間表示、バッジ改善）
- [x] PostDetail UI改善
- [x] CreatorPage UI改善
- [x] いいね・フォローボタンのバグ修正（optimistic updates対応）
- [x] クリエイター登録ページ（BecomeCreator.tsx）

### フェーズ10: ポイント決済システム (完了)
- [x] ポイントテーブル設計（userPoints, pointTransactions, pointPackages）
- [x] isAdultフラグ（creators, posts, subscriptionPlans）
- [x] ポイントAPI実装（残高、取引履歴、パッケージ一覧）
- [x] Stripe Checkoutによるポイント購入
- [x] ポイント購入UI（/points ページ）
- [x] ヘッダーにポイント残高表示
- [x] コンテンツ購入API（purchaseRouter）
  - [x] アダルト: ポイントのみ
  - [x] 非アダルト: ポイント / Stripe / ハイブリッド
- [x] PurchaseDialogコンポーネント（支払い方法選択、ポイント配分スライダー）
- [x] サブスクリプションAPI（subscriptionRouter）
  - [x] アダルト: ポイントのみ（毎月自動引き落とし）
  - [x] 非アダルト: ポイント / Stripe
- [x] SubscribeDialogコンポーネント
- [x] チップAPI（tipRouter拡張）
  - [x] アダルト: ポイントのみ
  - [x] 非アダルト: ポイント / Stripe / ハイブリッド
- [x] TipDialogコンポーネント
- [x] Stripe Webhook（ポイント購入、コンテンツ購入、サブスク、チップ）
- [x] ルーター分割（800行→15モジュール）
- [x] エラーハンドリング統一（_errors.ts）

---

## 進行中・今後の実装

### インフラ・運用
- [x] カスタムドメイン（fandry.app）設定
- [x] Cloudflare R2ストレージ統合（server/upload.ts実装済み）
- [x] ポイント自動更新（サブスク月次課金）用のcronジョブ（server/cron/processSubscriptions.ts）
- [x] 7日間猶予期間ロジック（残高不足時、cronジョブ内に実装）

### 収益化機能
- [x] クリエイター向け収益ダッシュボード
  - [x] 収益サマリーAPI（今月/先月比較、チップ/購入/サブスク内訳）
  - [x] サブスクライバー一覧API
  - [x] ダッシュボードUI（/dashboard）
- [x] 振込申請機能
  - [x] 振込関連テーブル設計（creatorBalances, withdrawals, bankAccounts）
  - [x] 振込API実装（残高、銀行口座管理、振込申請）
  - [x] 振込申請UI（/withdrawal）
- [x] 領収書発行機能
  - [x] 購入履歴取得API
  - [x] 領収書発行API
  - [x] 領収書UI（/receipts）- 印刷/PDF対応

### UX改善
- [ ] 無限スクロール対応
- [ ] カテゴリ別フィルタリング
- [ ] 投稿タブ切り替え（すべて/無料/有料/会員限定）
- [x] 通知システム
  - [x] 通知テーブル設計（notifications）
  - [x] 通知API（取得、既読、削除、全既読、全削除）
  - [x] ヘッダーの通知ベル復活
  - [x] 通知ドロップダウン（PopoverでUIを実装）
  - [ ] 通知トリガー（フォロー、いいね、コメント、新規投稿、サブスク）
- [ ] メッセージ機能

### 管理機能
- [ ] 管理者ダッシュボード
- [ ] コンテンツモデレーション
- [ ] ユーザー管理

---

## 技術的負債・改善項目

- [ ] テストカバレッジ向上
- [ ] E2Eテスト追加
- [ ] パフォーマンス最適化（画像遅延読み込み等）
- [ ] アクセシビリティ対応
