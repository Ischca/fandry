# API仕様書

FandryはtRPCを使用しているため、型安全なAPIを提供します。

## エンドポイント

ベースURL: `/api/trpc`

## 認証

認証にはClerkを使用しています。フロントエンドでClerkのトークンを取得し、`Authorization: Bearer <token>` ヘッダーで送信します。

### auth.me

現在のユーザー情報を取得

**リクエスト:**
```typescript
trpc.auth.me.useQuery()
```

**レスポンス:**
```typescript
{
  id: number;
  openId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'user';
  createdAt: Date;
}
```

### auth.logout

ログアウト

**リクエスト:**
```typescript
trpc.auth.logout.useMutation()
```

## クリエイター

### creator.register

クリエイター登録

**リクエスト:**
```typescript
trpc.creator.register.useMutation({
  displayName: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
})
```

### creator.getByUserId

ユーザーIDからクリエイター情報を取得

**リクエスト:**
```typescript
trpc.creator.getByUserId.useQuery({ userId: number })
```

### creator.updateProfile

クリエイタープロフィールを更新

**リクエスト:**
```typescript
trpc.creator.updateProfile.useMutation({
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
})
```

## サブスクリプションプラン

### plan.create

プランを作成

**リクエスト:**
```typescript
trpc.plan.create.useMutation({
  tier: 1 | 2 | 3;
  name: string;
  price: number;
  description: string;
  benefits: string[];
})
```

### plan.getByCreatorId

クリエイターのプラン一覧を取得

**リクエスト:**
```typescript
trpc.plan.getByCreatorId.useQuery({ creatorId: number })
```

## 投稿

### post.create

投稿を作成

**リクエスト:**
```typescript
trpc.post.create.useMutation({
  title: string;
  content: string;
  imageUrl?: string;
  postType: 'free' | 'paid' | 'members_only';
  price?: number;        // postType='paid'の場合必須
  requiredTier?: number; // postType='members_only'の場合必須
})
```

### post.getByCreatorId

クリエイターの投稿一覧を取得

**リクエスト:**
```typescript
trpc.post.getByCreatorId.useQuery({
  creatorId: number;
  postType?: 'free' | 'paid' | 'members_only';
})
```

### post.getById

投稿詳細を取得

**リクエスト:**
```typescript
trpc.post.getById.useQuery({ postId: number })
```

### post.getFeed

フィード（全投稿）を取得

**リクエスト:**
```typescript
trpc.post.getFeed.useQuery()
```

## いいね

### like.toggle

いいねをトグル

**リクエスト:**
```typescript
trpc.like.toggle.useMutation({ postId: number })
```

### like.getByPostId

投稿のいいね一覧を取得

**リクエスト:**
```typescript
trpc.like.getByPostId.useQuery({ postId: number })
```

## コメント

### comment.create

コメントを作成

**リクエスト:**
```typescript
trpc.comment.create.useMutation({
  postId: number;
  content: string;
})
```

### comment.getByPostId

投稿のコメント一覧を取得

**リクエスト:**
```typescript
trpc.comment.getByPostId.useQuery({ postId: number })
```

### comment.delete

コメントを削除

**リクエスト:**
```typescript
trpc.comment.delete.useMutation({ commentId: number })
```

## フォロー

### follow.toggle

フォローをトグル

**リクエスト:**
```typescript
trpc.follow.toggle.useMutation({ creatorId: number })
```

### follow.getFollowers

フォロワー一覧を取得

**リクエスト:**
```typescript
trpc.follow.getFollowers.useQuery({ creatorId: number })
```

### follow.getFollowing

フォロー中のクリエイター一覧を取得

**リクエスト:**
```typescript
trpc.follow.getFollowing.useQuery({ userId: number })
```

## 決済（Segpay）

決済にはSegpayを使用しています。初回決済時はSegpayの決済ページにリダイレクトし、2回目以降はOne-Click Service APIでワンクリック決済が可能です。

### payment.createCheckoutUrl

Segpay決済ページURLを生成

**リクエスト:**
```typescript
trpc.payment.createCheckoutUrl.useMutation({
  type: 'tip' | 'purchase' | 'subscription';
  amount?: number;      // type='tip'の場合
  postId?: number;      // type='purchase'の場合
  planId?: number;      // type='subscription'の場合
})
```

**レスポンス:**
```typescript
{
  url: string;  // Segpay決済ページURL（&paypagelanguage=JA付き）
}
```

### payment.oneClickCharge

ワンクリック決済（2回目以降、OCToken保持ユーザー向け）

**リクエスト:**
```typescript
trpc.payment.oneClickCharge.useMutation({
  type: 'tip' | 'purchase';
  amount?: number;      // type='tip'の場合
  postId?: number;      // type='purchase'の場合
  creatorId: number;
})
```

**レスポンス:**
```typescript
{
  success: boolean;
  transactionId: string;
}
```

### payment.getSubscriptions

ユーザーのサブスクリプション一覧を取得

**リクエスト:**
```typescript
trpc.payment.getSubscriptions.useQuery()
```

### payment.getPurchases

ユーザーの購入履歴を取得

**リクエスト:**
```typescript
trpc.payment.getPurchases.useQuery()
```

## エラーハンドリング

tRPCは以下のエラーコードを返します：

- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限がない
- `NOT_FOUND`: リソースが見つからない
- `BAD_REQUEST`: リクエストが不正
- `INTERNAL_SERVER_ERROR`: サーバーエラー

**エラーレスポンス例:**
```typescript
{
  error: {
    code: 'UNAUTHORIZED',
    message: 'ログインが必要です'
  }
}
```

## レート制限

現在、レート制限は実装されていません。将来的に追加予定。

## Webhooks

### Segpay Webhook

エンドポイント: `/api/segpay/webhook`

処理されるイベント:
- 決済完了通知（Initial/Rebill）
- サブスクリプション更新通知
- サブスクリプションキャンセル通知
- 決済失敗通知
- チャージバック通知

**Webhook処理の流れ:**
1. Segpayから決済完了通知を受信
2. `purchaseID`（OCToken）をユーザーに紐付けて保存
3. 該当するコンテンツへのアクセス権を付与
4. 2回目以降の決済はOCTokenを使用したワンクリック決済が可能に

## 型定義

すべての型定義は `shared/types.ts` で確認できます。

tRPCを使用しているため、フロントエンドとバックエンドで型が自動的に同期されます。
