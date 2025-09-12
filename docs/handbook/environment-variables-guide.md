# 環境変数設定ガイド

## 概要

Cloudflare Workersの環境変数は、環境ごとに異なる値を安全に管理できます。

## 環境変数の設定方法

### 1. Cloudflare Dashboard（推奨）

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. Workers & Pages → 対象のWorkerを選択
3. Settings → Variables → Environment Variables
4. 環境を選択（Preview/Production）
5. 変数を追加：
   ```
   変数名: CORS_ORIGIN
   値: https://your-app.vercel.app
   ```
6. Save and Deploy

### 2. Wrangler CLI

```bash
# Preview環境
wrangler secret put CORS_ORIGIN --env preview
# プロンプトで値を入力: https://your-preview.vercel.app

# Production環境
wrangler secret put CORS_ORIGIN --env production
# プロンプトで値を入力: https://your-production.vercel.app
```

### 3. GitHub Actions（CI/CD）

```yaml
- name: Deploy to Cloudflare Workers
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
  run: |
    # 環境変数を設定してデプロイ
    echo "${{ secrets.CORS_ORIGIN }}" | wrangler secret put CORS_ORIGIN --env production
    wrangler deploy --env production
```

## 必要な環境変数

### 共通（全環境）

| 変数名                     | 説明                 | 例                              |
| -------------------------- | -------------------- | ------------------------------- |
| `DATABASE_URL`             | PostgreSQL接続文字列 | `postgresql://...`              |
| `CLERK_SECRET_KEY`         | Clerk認証の秘密鍵    | `sk_test_...`                   |
| `CLERK_JWT_ISSUER`         | Clerk JWT発行者URL   | `https://...clerk.accounts.dev` |
| `UPSTASH_REDIS_REST_URL`   | Redis REST API URL   | `https://...upstash.io`         |
| `UPSTASH_REDIS_REST_TOKEN` | Redis認証トークン    | `...`                           |

### 環境別

| 変数名        | 説明                                         | ローカル          | Preview                 | Production             |
| ------------- | -------------------------------------------- | ----------------- | ----------------------- | ---------------------- |
| `NODE_ENV`    | 実行環境                                     | `development`     | `preview`               | `production`           |
| `CORS_ORIGIN` | CORS許可オリジン（複数可・ワイルドカード可） | `.dev.vars`で設定 | 要設定（プレビューURL） | 要設定（本番ドメイン） |

## セキュリティ注意事項

1. **秘密情報は`wrangler.toml`に書かない**
   - APIキー、トークン、パスワードは必ずDashboardかCLIで設定

2. **環境ごとに異なる値を使用**
   - 本番環境では本番用のAPIキー・DBを使用

3. **CORS設定を適切に制限**
   - `CORS_ORIGIN` で許可するオリジンを明示的に指定（カンマ区切り可）

## トラブルシューティング

### 環境変数が反映されない

```bash
# 設定を確認
wrangler secret list --env preview

# 再デプロイ
wrangler deploy --env preview
```

### CORS エラーが発生

1. `CORS_ORIGIN` が正しく設定されているか確認
2. フロントエンドのオリジンが `CORS_ORIGIN` に含まれているか確認
3. `https://`と`http://`の違いに注意

## 参考リンク

- [Cloudflare Workers環境変数](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Wrangler Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
