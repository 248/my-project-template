# バックエンドデプロイメントガイド

このドキュメントは、Cloudflare Workersを使用したバックエンドのデプロイメント方法について説明します。

## 🎯 デプロイメント構成

### 環境構成

| 環境           | Backend            | Database    | Redis          | 用途               |
| -------------- | ------------------ | ----------- | -------------- | ------------------ |
| **Local**      | `wrangler dev`     | Neon (Dev)  | Upstash (共通) | ローカル開発       |
| **Preview**    | Cloudflare Workers | Neon (Dev)  | Upstash (共通) | プルリクエスト確認 |
| **Production** | Cloudflare Workers | Neon (Prod) | Upstash (共通) | 本番サービス       |

### データベース戦略

**Neon PostgreSQL:**

- **Dev/Preview環境**: 同一DBを共有（コスト削減・簡素化）
- **Production環境**: 独立したDB（本番データ保護）

**Upstash Redis:**

- **全環境共通**: 単一Redisインスタンス（無料枠活用）
- 環境別のキープレフィックス使用（例: `dev:`, `prod:`）

## 🛠️ セットアップ手順

### 1. 外部サービス準備

#### Neon Database設定

1. **Neon Console**（https://console.neon.tech/）でアカウント作成
2. **Dev/Preview用DB作成**:
   - Database name: `project-template-dev`
   - Region: 適切なリージョン選択
3. **Production用DB作成**:
   - Database name: `project-template-prod`
   - Region: 適切なリージョン選択
4. **接続情報取得**:

   ```
   # Dev/Preview用
   postgres://username:password@ep-xxx-xxx.region.neon.tech/project-template-dev

   # Production用
   postgres://username:password@ep-yyy-yyy.region.neon.tech/project-template-prod
   ```

#### Upstash Redis設定

1. **Upstash Console**（https://console.upstash.com/）でアカウント作成
2. **Redis Database作成**:
   - Name: `project-template-redis`
   - Region: Neonと同一リージョン推奨
   - Type: Regional（無料枠）
3. **接続情報取得**:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AxxxXxxXxxx_xxxxxxxxxxxxxxxxxx
   ```

### 2. ローカル開発環境

#### `.dev.vars`ファイル作成

```bash
# apps/backend/.dev.vars
# ⚠️ このファイルは.gitignoreに含める

# Neon Database（Dev環境）
DATABASE_URL=postgres://username:password@ep-xxx-xxx.region.neon.tech/project-template-dev
DB_DRIVER=neon

# Upstash Redis（共通）
UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxXxxXxxx_xxxxxxxxxxxxxxxxxx

# Clerk認証
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 環境識別
NODE_ENV=development
ENV_NAME=dev
```

#### 開発サーバー起動

```bash
# プロジェクトルートから
pnpm dev:full  # Workers + Frontend同時起動

# または個別起動
pnpm --filter @template/backend dev:workers  # Workers
pnpm --filter @template/frontend dev         # Frontend
```

#### Prisma マイグレーション管理

現在のプロジェクトはPrisma-onlyのマイグレーション管理を採用しています。

```bash
# Prismaマイグレーション基本操作（バックエンドディレクトリから実行）
cd apps/backend

# 1. スキーマ変更後のマイグレーション作成
pnpm db:migrate

# 2. 本番環境へのマイグレーション適用
pnpm db:migrate:deploy

# 3. Prismaクライアント再生成
pnpm db:generate
```

**詳細な開発フロー:**

詳細なマイグレーション手順については **[Prismaマイグレーションガイド](./prisma-migration-guide.md)** を参照してください。

### 3. Preview環境デプロイ

#### Cloudflare Workers設定

1. **Cloudflare Dashboard** → **Workers & Pages**
2. プロジェクト作成または選択
3. **Settings** → **Environment variables**

**Preview環境用変数設定:**

| Variable Name              | Type     | Value                                          |
| -------------------------- | -------- | ---------------------------------------------- |
| `DATABASE_URL`             | Secret   | `postgres://...neon.tech/project-template-dev` |
| `DB_DRIVER`                | Variable | `neon`                                         |
| `UPSTASH_REDIS_REST_URL`   | Secret   | `https://xxx-xxx-xxx.upstash.io`               |
| `UPSTASH_REDIS_REST_TOKEN` | Secret   | `AxxxXxxXxxx_xxxxxxxxxxxxxxxxxx`               |
| `CLERK_SECRET_KEY`         | Secret   | `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`        |
| `NODE_ENV`                 | Variable | `preview`                                      |
| `ENV_NAME`                 | Variable | `preview`                                      |

#### デプロイ手順

```bash
# 1. マイグレーション実行（必要に応じて）
cd apps/backend
pnpm db:migrate:deploy

# 2. Preview環境デプロイ
pnpm deploy:preview

# または
wrangler deploy --env preview
```

### 4. Production環境デプロイ

#### Production環境用変数設定

| Variable Name              | Type     | Value                                           |
| -------------------------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`             | Secret   | `postgres://...neon.tech/project-template-prod` |
| `DB_DRIVER`                | Variable | `neon`                                          |
| `UPSTASH_REDIS_REST_URL`   | Secret   | `https://xxx-xxx-xxx.upstash.io`                |
| `UPSTASH_REDIS_REST_TOKEN` | Secret   | `AxxxXxxXxxx_xxxxxxxxxxxxxxxxxx`                |
| `CLERK_SECRET_KEY`         | Secret   | `sk_live_sample_xxxxxxxxxxxxxxxxxx`             |
| `NODE_ENV`                 | Variable | `production`                                    |
| `ENV_NAME`                 | Variable | `prod`                                          |

#### デプロイ手順

```bash
# 1. マイグレーション実行（本番環境）
# ⚠️ 重要: 本番デプロイ前に必ずマイグレーション適用
cd apps/backend
pnpm db:migrate:deploy

# 2. Production環境デプロイ
pnpm deploy:production

# または
wrangler deploy --env production
```

## 🔍 動作確認

### ヘルスチェック

各環境でAPIの動作確認:

```bash
# Local
curl http://127.0.0.1:8787/api/health

# Preview
curl https://your-worker-preview.your-subdomain.workers.dev/api/health

# Production
curl https://your-worker.your-subdomain.workers.dev/api/health
```

**正常なレスポンス例:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T06:45:00.000Z",
  "uptime": 123,
  "services": {
    "api": {
      "status": "healthy",
      "message": "Cloudflare Workers API is running",
      "responseTime": 2
    },
    "database": {
      "status": "healthy",
      "message": "Neon connection successful",
      "responseTime": 45
    },
    "redis": {
      "status": "healthy",
      "message": "Upstash Redis connection successful",
      "responseTime": 12
    }
  },
  "system": {
    "memory": { "rss": 0, "heapTotal": 0, "heapUsed": 0 },
    "cpu": { "user": 0, "system": 0 }
  },
  "version": "0.1.0",
  "environment": "development"
}
```

## 🚨 トラブルシューティング

### よくある問題

1. **Database接続エラー**
   - Neonの接続文字列確認
   - IPホワイトリスト設定確認
   - 認証情報の有効性確認

2. **Redis接続エラー**
   - Upstash RESTトークンの有効性確認
   - リージョン設定確認

3. **デプロイエラー**
   - `wrangler.toml`の環境設定確認
   - Cloudflare Workers環境変数設定確認

4. **Prismaマイグレーションエラー**
   - マイグレーション適用エラー: 環境変数確認
     ```bash
     # apps/backend/.env ファイルのDATABASE_URLを確認
     cat apps/backend/.env
     ```
   - `"prisma generate not found"`: 依存関係の確認
     ```bash
     pnpm install
     pnpm --filter @template/backend db:generate
     ```
   - 詳細は[Prismaマイグレーションガイド](./prisma-migration-guide.md#トラブルシューティング)を参照

### ログ確認方法

```bash
# ローカルログ
wrangler dev --env preview

# Production ログ
wrangler tail --env production

# Preview ログ
wrangler tail --env preview
```

## 📝 注意事項

- **セキュリティ**: `.dev.vars`は絶対にコミットしない
- **コスト管理**: Neonの使用量監視、Upstash無料枠確認
- **バックアップ**: Production DBの定期バックアップ設定
- **監視**: 本番環境のヘルスチェック定期実行設定

## 🔗 関連リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://docs.upstash.com/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Prisma Migration Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [プロジェクト内Prismaマイグレーションガイド](./prisma-migration-guide.md)
