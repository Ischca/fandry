# CLAUDE.mdの更新

アーキテクチャやコード構造に変更があった場合、CLAUDE.mdを更新してください。

## 確認すべき変更

1. **新しいルーター/API**: `server/routers/`に追加されたファイル
2. **スキーマ変更**: `drizzle/schema.ts`の変更
3. **新しいコンポーネント**: `client/src/components/`の重要な追加
4. **コマンドの変更**: `package.json`のscriptsの変更
5. **環境変数**: 新しい必須/オプション環境変数

## 更新対象セクション

### Commands
```bash
pnpm dev        # 開発サーバー
pnpm check      # 型チェック
pnpm db:push    # DB マイグレーション
```

### Architecture
- ディレクトリ構造
- 主要なファイルとその役割
- データフロー

### Key Patterns
- tRPC統合パターン
- 認証フロー
- 決済処理

### Data Model
- エンティティ関係
- アクセスレベル

## 注意事項

- 開発者がすぐに理解できる簡潔な記述を維持
- コード例は最小限に、必要な場合のみ
- パスエイリアスや重要な設定は必ず記載
