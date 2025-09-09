# フロントエンドデプロイメントガイド

このドキュメントは、Vercelを使用したフロントエンドのデプロイメント方法について説明します。

## 🎯 デプロイメント構成

### 環境構成

| 環境           | Frontend (Vercel) | Backend API        | 認証           | 用途               |
| -------------- | ----------------- | ------------------ | -------------- | ------------------ |
| **Local**      | `next dev` (3000) | `wrangler dev` (8787) | Clerk (Test)   | ローカル開発       |
| **Preview**    | Vercel Preview    | Workers (Preview)  | Clerk (Test)   | プルリクエスト確認 |
| **Production** | Vercel Production | Workers (Prod)     | Clerk (Live)   | 本番サービス       |

### アーキテクチャ戦略

**フロントエンド（Next.js）:**

- **Local環境**: 開発サーバー + ローカルAPI接続
- **Preview環境**: Vercel Preview Deployment + Preview API
- **Production環境**: Vercel Production + Production API

**API接続:**

- 環境変数による動的API接続先切り替え
- CORS設定はバックエンド側で管理

## 📁 ファイル構成

フロントエンドのVercelデプロイ関連ファイル:

```
apps/frontend/
├── vercel.json              # Vercel設定ファイル  
├── .vercelignore            # Vercelデプロイ時除外ファイル
├── .env.example             # 環境変数テンプレート
├── ignored-build-step.sh    # 自動ビルドスキップスクリプト
├── package.json             # 依存関係とスクリプト
├── next.config.js           # Next.js設定（セキュリティ対策含む）
└── src/                     # ソースコード
```

## 🛠️ セットアップ手順

### 1. 外部サービス準備

#### Vercel アカウント設定

1. **Vercel Console**（https://vercel.com/）でアカウント作成
2. **GitHub連携設定**:
   - Repository access設定
   - Organization permissions確認
3. **プロジェクト作成**:
   - Import Git Repository
   - Root Directory: `apps/frontend`
   - Framework: Next.js (自動検出)

#### Clerk 認証設定

1. **Clerk Dashboard**（https://clerk.com/）でアカウント作成
2. **Application作成**:
   - Application name: `project-template`
   - 認証方式選択（Email, Google, GitHub等）
3. **API Keys取得**:

   ```bash
   # Development Keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Production Keys  
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2. ローカル開発環境

#### `.env.local`ファイル作成

```bash
# apps/frontend/.env.local
# ⚠️ このファイルは.gitignoreに含める

# API接続設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Clerk認証（Development Keys）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 開発・デバッグ設定
AUTH_BYPASS=0
NEXT_PUBLIC_AUTH_BYPASS=0

# Next.js設定
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=0
```

#### 開発サーバー起動

```bash
# プロジェクトルートから
pnpm dev:full  # フルスタック起動（Workers + Frontend）

# または個別起動
pnpm --filter @template/backend dev:workers  # Workers API (http://localhost:8787)
pnpm --filter @template/frontend dev         # Frontend (http://localhost:3000)
```

⚠️ **重要**: フロントエンドはポート8787のAPIに接続します。バックエンドの `.dev.vars` で適切なCORS設定が必要です：

```bash
# apps/backend/.dev.vars
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Preview環境デプロイ

#### 事前準備: バックエンドCORS設定

Vercelデプロイ前に、**バックエンド**（Cloudflare Workers）でフロントエンドURLを許可する必要があります：

```bash
# Cloudflare Workers Dashboard → Environment Variables
# または wrangler secret コマンドで設定
FRONTEND_URL=https://your-app-git-branch.vercel.app

# 複数環境の場合
CORS_ORIGIN=https://your-app.vercel.app,https://your-app-git-branch.vercel.app
```

#### Vercel環境変数設定

1. **Vercel Dashboard** → プロジェクト選択 → **Settings** → **Environment Variables**
2. **Preview環境用変数設定:**

| Variable Name                        | Environment | Value                                            |
| ------------------------------------ | ----------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL`           | Preview     | `https://your-worker-preview.workers.dev`       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Preview     | `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`          |
| `CLERK_SECRET_KEY`                   | Preview     | `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`          |
| `NODE_ENV`                           | Preview     | `preview`                                        |
| `NEXT_TELEMETRY_DISABLED`            | Preview     | `1`                                              |
| `AUTH_BYPASS`                        | Preview     | `0`                                              |
| `NEXT_PUBLIC_AUTH_BYPASS`            | Preview     | `0`                                              |

#### 自動ビルドスキップ設定

`ignored-build-step.sh`により、フロントエンド関係のない変更はビルドスキップ:

**ビルド実行する変更:**
- `apps/frontend/` - フロントエンドコード
- `packages/ui/`, `packages/shared/` - 共通パッケージ
- `packages/api-contracts/` - API型定義
- 依存関係ファイル

**ビルドスキップする変更:**
- `apps/backend/` - バックエンドのみ
- `docs/`, `*.md` - ドキュメント
- `infra/docker/` - Docker設定

#### デプロイ手順

```bash
# プレビューデプロイ（ブランチpush時に自動実行）
git push origin feature/your-feature

# または手動デプロイ
pnpm deploy:vercel:preview
```

**Vercelの自動デプロイトリガー:**
- **Production**: `main`/`master` ブランチへのpush
- **Preview**: フィーチャーブランチへのpush（プルリクエスト不要）
- **Manual**: `vercel` コマンド実行時

### 4. Production環境デプロイ

#### 事前準備: 本番バックエンドCORS設定

本番デプロイ前に、**バックエンド**（Cloudflare Workers Production）でフロントエンドURLを許可：

```bash
# Cloudflare Workers Dashboard → Production Environment Variables
FRONTEND_URL=https://your-app.vercel.app

# カスタムドメインの場合
FRONTEND_URL=https://your-domain.com
```

#### Production環境用変数設定

| Variable Name                        | Environment | Value                                            |
| ------------------------------------ | ----------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL`           | Production  | `https://your-worker.workers.dev`               |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Production  | `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`          |
| `CLERK_SECRET_KEY`                   | Production  | `sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`          |
| `NODE_ENV`                           | Production  | `production`                                     |
| `NEXT_TELEMETRY_DISABLED`            | Production  | `1`                                              |
| `AUTH_BYPASS`                        | Production  | `0` ⚠️                                           |
| `NEXT_PUBLIC_AUTH_BYPASS`            | Production  | `0` ⚠️                                           |

⚠️ **重要:** 本番環境では認証バイパスを絶対に有効にしないでください。

#### デプロイ手順

```bash
# 1. main/masterブランチにpush（自動デプロイ）
git checkout main
git merge feature/your-feature
git push origin main  # 本番デプロイ実行

# または手動デプロイ
pnpm deploy:vercel

# プロジェクトリンクが必要な場合
pnpm vercel:link
```

## 🔍 動作確認

### ヘルスチェック

各環境でアプリケーションの動作確認:

```bash
# Local
open http://localhost:3000

# Preview
open https://your-app-git-feature-branch-username.vercel.app

# Production
open https://your-app.vercel.app
```

### API接続確認

各環境でAPIエンドポイントの接続確認:

```bash
# Local API (開発時)
curl http://localhost:8787/api/health

# Preview API
curl https://your-worker-preview.workers.dev/api/health

# Production API
curl https://your-worker.workers.dev/api/health
```

ブラウザ開発者ツールでNetwork tabを確認:

```javascript
// コンソールで実行
console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
// → http://localhost:8787 (開発時)
```

### 認証フロー確認

1. **サインイン/サインアップ**: `/sign-in`, `/sign-up`
2. **認証後リダイレクト**: `/home`
3. **ミドルウェア動作**: 未認証時の自動リダイレクト

## 🚨 トラブルシューティング

### よくある問題

1. **API接続エラー**
   - `NEXT_PUBLIC_API_BASE_URL`設定確認
   - CORS設定確認（バックエンド側）
   - ネットワークタブでリクエスト確認

2. **Clerk認証エラー**
   - 公開鍵/秘密鍵の環境別設定確認
   - Clerk Dashboard のAllowed originsにドメイン追加
   - 認証フローのリダイレクト設定確認

3. **ビルドエラー**
   - 型エラー: `pnpm type-check`
   - ESLintエラー: `pnpm lint`
   - 依存関係: `pnpm install`

4. **環境変数が反映されない**
   - Vercel Dashboard で環境別設定確認
   - `NEXT_PUBLIC_`プレフィックス確認
   - デプロイ後の変数変更は再デプロイが必要

### デバッグ方法

```bash
# ローカルビルドテスト
pnpm build:vercel

# 型チェック
cd apps/frontend && pnpm type-check

# ESLint
cd apps/frontend && pnpm lint

# Vercel環境変数確認
pnpm vercel:env

# ビルドスキップテスト
bash apps/frontend/ignored-build-step.sh
echo $?  # 0=ビルド実行, 1=スキップ
```

### ログ確認方法

```bash
# Vercel Function Logs
vercel logs

# Real-time logs
vercel logs --follow

# Local development logs
pnpm dev  # コンソール出力確認
```

## 📊 パフォーマンス最適化

### 自動最適化機能

- **Image Optimization**: Next.js Image component
- **Code Splitting**: 自動ページ分割
- **Tree Shaking**: 未使用コード除去
- **Bundle Analysis**: `pnpm analyze`（設定済み）

### Vercel固有最適化

- **Edge Functions**: API Routes の高速化
- **ISR**: Incremental Static Regeneration
- **CDN**: Global Edge Network
- **Analytics**: Core Web Vitals監視

## 🔐 セキュリティ対策

### CSP (Content Security Policy)

`vercel.json`でセキュリティヘッダー設定済み:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- 厳密なCSPポリシー

### 認証セキュリティ

- Clerk JWTトークン検証
- Middleware による認証チェック
- 本番環境での認証バイパス無効化

### 環境変数管理

- 秘密鍵は`Secret`として管理
- 公開変数は`NEXT_PUBLIC_`プレフィックス
- `.env.local`のgitignore設定

## 📝 注意事項

- **環境変数**: `.env.local`は絶対にコミットしない
- **認証設定**: 本番環境ではClerk Live keysを使用
- **API接続**: バックエンドデプロイと連携して実施
- **ドメイン設定**: Custom domainはVercel Dashboard で設定
- **監視**: Vercel Analytics + Core Web Vitals monitoring

## 🔗 関連リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [バックエンドデプロイメントガイド](./backend-deployment-guide.md)
- [システム概要](../architecture/system-overview.md)