# フロントエンドデプロイメントガイド

このドキュメントは、Vercelを使用したフロントエンドのデプロイメント方法について説明します。

## 🎯 デプロイメント構成

### 環境構成

| 環境           | Frontend (Vercel) | Backend API           | 認証         | 用途               |
| -------------- | ----------------- | --------------------- | ------------ | ------------------ |
| **Local**      | `next dev` (3000) | `wrangler dev` (8787) | Clerk (Test) | ローカル開発       |
| **Preview**    | Vercel Preview    | Workers (Preview)     | Clerk (Test) | プルリクエスト確認 |
| **Production** | Vercel Production | Workers (Prod)        | Clerk (Live) | 本番サービス       |

### アーキテクチャ戦略

**フロントエンド（Next.js）:**

- **Local環境**: 開発サーバー + ローカルAPI接続
- **Preview環境**: **Vercel CLI公式フロー** + 動的API接続
- **Production環境**: **一時的にスキップ**（準備中）

**デプロイフロー（改善版）:**

- **CI/CD統合**: GitHub Actions + Vercel CLI公式フロー採用
- **環境変数統一**: Vercel GUI ≠ GitHub Actions問題を解決
- **動的CORS設定**: デプロイ成功URLを自動でバックエンドに設定
- **フロントエンド成功依存**: バックエンドはフロント成功時のみデプロイ

## 📁 ファイル構成

フロントエンドのVercelデプロイ関連ファイル:

```
apps/frontend/
├── vercel.json              # Vercel設定ファイル
├── .vercelignore            # Vercelデプロイ時除外ファイル
├── .env.example             # 環境変数テンプレート
├── turbo.json               # Turbo設定（自動ビルドスキップ用）
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

#### ⚠️ 重要: Vercel Dashboard GUI設定（モノレポ対応）

**プロジェクト作成時の詳細設定**:

1. **Import Git Repository**から対象リポジトリを選択
2. **必須設定項目**（以下を正確に設定）:

| 設定項目             | 値                                     | 重要度 | 備考                    |
| -------------------- | -------------------------------------- | ------ | ----------------------- |
| **Project Name**     | `my-project-template-frontend` (※重要) | 🔴必須 | `vercel.json`でname設定 |
| **Framework**        | `Next.js` (自動検出)                   | 🟡推奨 | -                       |
| **Root Directory**   | `apps/frontend` (※最重要)              | 🔴必須 | GUI必須設定             |
| **Install Command**  | **空欄** ⚠️                            | 🟡空欄 | `vercel.json`で設定済み |
| **Build Command**    | **空欄** ⚠️                            | 🟡空欄 | `vercel.json`で設定済み |
| **Output Directory** | `.next` (デフォルト)                   | 🟡推奨 | -                       |

**✅ 2024年12月最終決定**: 混乱を避けるため、**Vercel Dashboard GUIのCommand設定を空欄にし、`vercel.json`設定のみを使用**する方針に決定しました。

**最終方針の理由**:

- **設定の一元化**: `vercel.json`ファイルのみが実際の動作を制御
- **透明性確保**: ファイルを見れば実際のコマンドが分かる
- **混乱完全排除**: GUI設定とファイル設定の重複を解消
- **バージョン管理**: `vercel.json`はgit管理されるため、変更履歴が追跡可能

#### 🚨 よくある設定ミス

1. **Root Directory未設定**: 設定しないとNext.jsが検出されず「No Next.js version detected」エラー
2. **Project Name不一致**: 想定外の名前でプロジェクトが作成される問題
3. **GUIでCommand設定**: GUI設定は空欄にして`vercel.json`の設定を使用する
4. **Build Command順序**: `codegen` → `gen:messages` → `build`の順序が重要

#### 📄 実際の動作設定（`apps/frontend/vercel.json`）

```json
{
  "installCommand": "pnpm -w install --frozen-lockfile",
  "buildCommand": "pnpm -w run codegen && pnpm -w run gen:messages && pnpm --filter @template/frontend build"
}
```

**重要**: 上記のコマンドが実際に実行されます。GUI設定は無視されます。

#### 📋 設定の優先順位（2025年9月最終決定）

**最終方針**: GUI Command設定を空欄にし、`vercel.json`で一元管理

**確定した優先順位**:

1. **🥇 `vercel.json`設定** （実際の動作・最優先）
2. **🥈 Vercel Dashboard GUI設定** （空欄に設定）
3. **🥉 package.jsonのscripts** （使用されない）

**この方針のメリット**:

- ✅ **設定の一元化**: `vercel.json`のみが動作を制御
- ✅ **git管理**: 設定変更がバージョン管理される
- ✅ **透明性確保**: ファイルを見れば実際のコマンドが分かる
- ✅ **混乱完全排除**: GUI設定との重複を解消

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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

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

### 3. Preview環境デプロイ（CI/CD自動化済み）

#### 🚀 自動デプロイフロー（推奨）

**現在の実装**：プルリクエスト作成で全自動デプロイ

1. **GitHub Actions トリガー**: PR作成・更新時
2. **Vercel CLI公式フロー**: 環境変数統一でビルド成功率向上
3. **動的CORS設定**: デプロイ成功時にバックエンドへURL自動設定
4. **PR自動コメント**: プレビューURL投稿

```yaml
# 自動実行される処理（参考）
vercel pull --environment=preview
vercel build
DEPLOY_URL=$(vercel deploy --prebuilt)
echo "$DEPLOY_URL" | sed -E 's#(/+$)||$##' | wrangler secret put CORS_ORIGIN --env preview
```

#### ⚠️ 事前準備不要

**従来必要だった手動CORS設定は不要**です。CI/CDが自動で実行します。

#### GitHub Actions設定（CI/CD用）

**⚠️ 必須**: GitHub Actions用のシークレット設定が必要です。

1. **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. **Repository secrets設定**:

| Secret Name             | 値                          | 説明                        |
| ----------------------- | --------------------------- | --------------------------- |
| `VERCEL_TOKEN`          | `vercel_xxxxxxxxxxxxx`      | Vercel Personal Token       |
| `VERCEL_ORG_ID`         | `team_xxxxxxxxxxxxxxxxx`    | Organization ID (not slug!) |
| `VERCEL_PROJECT_ID`     | `prj_xxxxxxxxxxxxxxxxxxxxx` | Project ID                  |
| `CLOUDFLARE_API_TOKEN`  | `xxxxxxxxxxxxxxxxxxxxx`     | Cloudflare API Token        |
| `CLOUDFLARE_ACCOUNT_ID` | `xxxxxxxxxxxxxxxxx`         | Cloudflare Account ID       |

**⚠️ 重要**: `VERCEL_ORG_ID`は`team_`で始まるID（slug名ではない）を使用してください。

#### GitHub Actions権限設定

**必須設定**: `.github/workflows/deploy.yml`で以下の権限が必要:

```yaml
permissions:
  contents: read
  issues: write # PR自動コメント用
  pull-requests: write # PR自動コメント用
  actions: read
  checks: read
```

**よくあるエラー**: 権限不足で`RequestError [HttpError]: Resource not accessible by integration`が発生する場合、上記権限設定を確認してください。

#### Vercel環境変数設定

1. **Vercel Dashboard** → プロジェクト選択 → **Settings** → **Environment Variables**
2. **Preview環境用変数設定:**

| Variable Name                       | Environment | Value                                     |
| ----------------------------------- | ----------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`          | Preview     | `https://your-worker-preview.workers.dev` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Preview     | `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`   |
| `CLERK_SECRET_KEY`                  | Preview     | `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`   |
| `NODE_ENV`                          | Preview     | `preview`                                 |
| `NEXT_TELEMETRY_DISABLED`           | Preview     | `1`                                       |
| `AUTH_BYPASS`                       | Preview     | `0`                                       |
| `NEXT_PUBLIC_AUTH_BYPASS`           | Preview     | `0`                                       |

#### 自動ビルドスキップ設定

`turbo-ignore`により、フロントエンド関係のない変更はビルドスキップ:

**ビルド実行する変更:**

- `apps/frontend/` - フロントエンドコード
- `packages/ui/`, `packages/shared/` - 共通パッケージ
- `packages/api-contracts/` - API型定義
- `packages/config/` - 設定パッケージ
- 依存関係ファイル（`package.json`, `pnpm-lock.yaml`等）

**ビルドスキップする変更:**

- `apps/backend/` - バックエンドのみ
- `docs/`, `*.md` - ドキュメント
- `infra/docker/` - Docker設定

**強制ビルド対応:**
緊急時にどうしてもビルドしたい場合、Vercelの環境変数で`FORCE_BUILD=1`を設定すると必ずビルドが実行されます。

#### 🚀 成功したデプロイ手順（2025年9月確立済み）

**1. 公式Vercelフロー採用**:

```yaml
# GitHub Actions での成功パターン
- name: Vercel link (bind project at repo root)
  working-directory: .
  run: npx vercel@latest link --yes --project "$VERCEL_PROJECT_ID" --token "$VERCEL_TOKEN"

- name: Vercel pull (preview)
  working-directory: .
  run: npx vercel@latest pull --yes --environment=preview --token "$VERCEL_TOKEN"

- name: Deploy with Vercel CLI (remote build)
  working-directory: .
  run: |
    DEPLOY_URL=$(npx vercel@latest deploy --yes --token "$VERCEL_TOKEN")
    echo "preview-url=$DEPLOY_URL" >> "$GITHUB_OUTPUT"
```

**2. 重要な方針変更**:

- ✅ **Vercel側ビルド**: GitHub Actions内でのbuildは廃止、Vercel側で実行
- ✅ **公式フロー**: `vercel pull` → `vercel deploy` の正式手順
- ✅ **モノレポ対応**: Root Directory設定でVercel側が正しくビルド
- ❌ **`--prebuilt`廃止**: symlinkエラーの原因となるため使用停止

**3. 実際のデプロイ手順**:

```bash
# 1. プルリクエスト作成（推奨）
git checkout -b feature/your-feature
# 変更を実装
git add . && git commit -m "feat: 機能追加"
git push origin feature/your-feature

# 2. GitHub PR作成
# → 自動でプレビュー環境デプロイ実行
# → PRにプレビューURL自動投稿

# 3. 手動デプロイ（緊急時のみ）
cd apps/frontend
npx vercel@latest deploy  # Vercel側ビルド
```

**現在のデプロイトリガー（確立済み）:**

- **Preview**: プルリクエスト作成・更新時（GitHub Actions自動）✅
- **Production**: **一時的にスキップ**（環境準備中）
- **Manual**: `vercel` コマンド実行時（緊急時のみ）

### 4. Production環境デプロイ（現在は一時的にスキップ）

**⚠️ 現在の状況**: 本番環境は準備中のため、CI/CDで一時的にスキップされています。

#### 本番環境有効化時の設定（将来使用予定）

**事前準備**: Cloudflare Workers本番環境で固定CORS_ORIGINを設定

```bash
# Cloudflare Workers Dashboard → Production Environment Variables
# 独自ドメインの固定URL設定
CORS_ORIGIN=https://your-domain.com
```

#### Production環境用変数設定（将来使用予定）

| Variable Name                       | Environment | Value                                   |
| ----------------------------------- | ----------- | --------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`          | Production  | `https://your-worker.workers.dev`       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production  | `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `CLERK_SECRET_KEY`                  | Production  | `sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NODE_ENV`                          | Production  | `production`                            |
| `NEXT_TELEMETRY_DISABLED`           | Production  | `1`                                     |
| `AUTH_BYPASS`                       | Production  | `0` ⚠️                                  |
| `NEXT_PUBLIC_AUTH_BYPASS`           | Production  | `0` ⚠️                                  |

#### 本番環境有効化手順（将来実施予定）

```bash
# 1. CI/CDワークフロー修正
# .github/workflows/deploy.yml内のコメントアウト解除：
# echo "⚠️ 本番環境デプロイは一時的にスキップ（未作成のため）"
# ↓
# 本番デプロイコマンドを有効化

# 2. 自動デプロイ（将来）
git checkout main
git merge feature/your-feature
git push origin main  # 本番デプロイ実行（有効化後）
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
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
// → http://localhost:8787 (開発時)
```

### 認証フロー確認

1. **サインイン/サインアップ**: `/sign-in`, `/sign-up`
2. **認証後リダイレクト**: `/home`
3. **ミドルウェア動作**: 未認証時の自動リダイレクト

## 🚨 トラブルシューティング

### 🔧 Vercel CLI関連エラー

#### 1. "Project not found" エラー

**症状**:

```
Error: Project not found
```

**原因**:

- `VERCEL_ORG_ID`にslug名（例: `248ms-projects`）を設定している
- 正しいOrganization IDではない

**解決方法**:

```bash
# 正しいOrg IDを確認
vercel teams list

# 正しい形式: team_xxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxx  # ❌ 248ms-projects ではない
```

#### 2. "No Next.js version detected" エラー

**症状**:

```
No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies"
```

**原因**:

- Vercel Dashboard の **Root Directory** が未設定
- モノレポ構造でNext.jsプロジェクトの場所が特定できない

**解決方法**:

1. **Vercel Dashboard** → プロジェクト → **Settings** → **General**
2. **Root Directory** を `apps/frontend` に設定
3. **Save** をクリック
4. 再デプロイを実行

#### 3. "Invalid vercel.json" エラー

**症状**:

```
Invalid vercel.json - should NOT have additional property 'rootDirectory'
```

**原因**:

- `vercel.json`で`rootDirectory`プロパティを設定している
- このプロパティはDashboard GUIでのみ設定可能

**解決方法**:

- `vercel.json`から`rootDirectory`プロパティを削除
- Vercel Dashboard GUIで Root Directory を設定

### 🔧 GitHub Actions関連エラー

#### 4. 権限不足エラー

**症状**:

```
RequestError [HttpError]: Resource not accessible by integration
```

**原因**:

- GitHub Actions の PR コメント機能に必要な権限が不足

**解決方法**:
`.github/workflows/deploy.yml`に権限設定を追加:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
  actions: read
  checks: read
```

#### 5. "Command not found" エラー

**症状**:

```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "codegen" not found
```

**原因**:

- working-directory設定が間違っている
- モノレポのルートから実行すべきコマンドを誤った場所で実行

**解決方法**:

```yaml
# ❌ 間違い - frontendディレクトリから実行
- name: Generate code
  working-directory: apps/frontend
  run: pnpm codegen

# ✅ 正解 - ルートディレクトリから実行
- name: Generate code
  working-directory: .
  run: pnpm codegen && pnpm gen:messages
```

#### 6. プロジェクト名の不一致

**症状**:

- 期待: `my-project-template-frontend`
- 実際: `frontend` プロジェクトが作成される

**原因**:

- `vercel.json`の`name`プロパティが未設定または不正

**解決方法**:
`apps/frontend/vercel.json`:

```json
{
  "name": "my-project-template-frontend"
}
```

### 🔧 従来の問題

7. **API接続エラー**
   - `NEXT_PUBLIC_API_BASE_URL`設定確認
   - CORS設定確認（バックエンド側）
   - ネットワークタブでリクエスト確認

8. **Clerk認証エラー**
   - 公開鍵/秘密鍵の環境別設定確認
   - Clerk Dashboard のAllowed originsにドメイン追加
   - 認証フローのリダイレクト設定確認

9. **ビルドエラー**
   - 型エラー: `pnpm type-check`
   - ESLintエラー: `pnpm lint`
   - 依存関係: `pnpm install`

10. **環境変数が反映されない**
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

# ビルドスキップテスト（turbo-ignore）
cd apps/frontend && npx turbo-ignore
echo $?  # 0=ビルドスキップ, 1=ビルド実行
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

## 🎯 成功事例とベストプラクティス

### ✅ 2025年9月確立済みの安定設定

**Vercel Dashboard設定**（2025年9月最終確立）:

```
Project Name: my-project-template-frontend
Framework: Next.js
Root Directory: apps/frontend
Install Command: [空欄] ← GUI設定は空欄に！
Build Command: [空欄] ← GUI設定は空欄に！
Output Directory: .next (デフォルト)
```

**実際の動作設定**（`apps/frontend/vercel.json`）:

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm codegen && pnpm gen:messages && cd apps/frontend && pnpm build"
}
```

**✅ 設定の透明性**: GUI設定は空欄で、`vercel.json`の設定が実際に動作します。

**GitHub Repository Secrets**（必須項目）:

```
VERCEL_TOKEN: vercel_xxxxxxxxxxxxx
VERCEL_ORG_ID: team_xxxxxxxxxxxxxxxxx (重要: slug名ではない)
VERCEL_PROJECT_ID: prj_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN: xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID: xxxxxxxxxxxxxxxxx
```

**GitHub Actions権限設定**（PR自動コメント用）:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
  actions: read
  checks: read
```

### 🚫 避けるべき設定ミス

1. **❌ GUIでCommand設定**: Install/Build Commandは空欄に、`vercel.json`で管理
2. **❌ `VERCEL_ORG_ID`にslug名**: 必ず`team_`で始まるIDを使用
3. **❌ `--prebuilt`アプローチ**: symlinkエラーの原因
4. **❌ GitHub Actions内でビルド**: Vercel側ビルドを活用
5. **❌ working-directory混在**: ルートと個別で一貫性を保つ
6. **❌ 設定の二重管理**: GUIとファイル設定の重複は混乱の原因

### 🔄 推奨デプロイフロー

```mermaid
graph LR
    A[PR作成] --> B[GitHub Actions]
    B --> C[codegen実行]
    C --> D[gen:messages実行]
    D --> E[vercel pull]
    E --> F[vercel deploy]
    F --> G[PR自動コメント]
    G --> H[バックエンドデプロイ]
```

**成功パターン**（2025年9月確立）:

**GitHub Actions側**:

1. ルートで依存関係インストール
2. ルートでコード生成（codegen + gen:messages）
3. Vercel linkでプロジェクト紐付け
4. Vercel pullで環境設定取得
5. Vercel deployでリモートビルド
6. 成功URLを自動コメント

**Vercel側ビルド**:

1. `vercel.json`の`installCommand`実行
2. `vercel.json`の`buildCommand`実行
3. Next.js最適化ビルド
4. デプロイ完了

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

- 方針: CSP は `apps/frontend/src/middleware.ts` で「動的に」一元配信します。`vercel.json` には CSP を設定しません（削除済み）。
- 目的: リクエスト毎の `nonce` と、環境に応じた `connect-src`（例: `NEXT_PUBLIC_API_BASE_URL` のオリジン）を正確に許可するため。

運用ポイント:

- 毎リクエスト nonce を生成し、`x-nonce` をリクエストヘッダとして下流へ伝搬。
- `app/layout.tsx` で `headers().get('x-nonce')` を取得し、`<ClerkProvider nonce={...}>` や自前 `<Script nonce>` に付与。
- `connect-src` は `self` と Clerk 関連に加えて、`NEXT_PUBLIC_API_BASE_URL` のオリジンを必ず含める（開発/プレビューでは `localhost:8787` なども許可）。
- プレビュー環境は `VERCEL_ENV=preview` を見て緩和ポリシー、プロダクションは厳格化。

注意事項（よくある躓き）:

- `vercel.json` に `Content-Security-Policy` を置くと「二重CSP」になり、ブラウザは交差（より厳しい方）で評価→未許可接続や nonce 不一致でブロックされます。
- `nonce-{NONCE}` のようなプレースホルダは Vercel 側で置換されず無効なソース扱いとなるため使用しないでください。
- Workers 側の CORS は別制御です。`CORS_ORIGIN` に Vercel のプレビューURL（複数可、カンマ区切り）を必ず設定してください。

関連ヘッダー:

- `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` は引き続き `vercel.json` で配信して構いません（重複リスクが低いため）。

### 認証セキュリティ

- Clerk JWTトークン検証
- Middleware による認証チェック
- 本番環境での認証バイパス無効化

### 環境変数管理

- 秘密鍵は`Secret`として管理
- 公開変数は`NEXT_PUBLIC_`プレフィックス
- `.env.local`のgitignore設定

## 📝 注意事項・重要なポイント

### 🔒 セキュリティ・機密情報

- **環境変数**: `.env.local`は絶対にコミットしない
- **認証設定**: 本番環境ではClerk Live keysを使用
- **Secrets管理**: GitHub Repository SecretsでVercel/Cloudflare認証情報を管理

### 🏗️ アーキテクチャ・設定

- **API接続**: バックエンドデプロイと連携して実施
- **ドメイン設定**: Custom domainはVercel Dashboard で設定
- **Root Directory設定**: 必ずVercel Dashboard GUIで`apps/frontend`を設定
- **環境変数ID**: `VERCEL_ORG_ID`は`team_`形式、slug名は不可
- **Command設定**: GUIは空欄、`vercel.json`で一元管理

### 🚀 デプロイ・CI/CD

- **デプロイ方針**: GitHub Actions内ビルド廃止、Vercel側ビルド採用
- **公式フロー**: `vercel pull` → `vercel deploy`の順序厳守
- **権限設定**: GitHub Actions permissions（issues/pull-requests write）必須
- **プロジェクト名**: `vercel.json`の`name`でプロジェクト名制御
- **ビルドコマンド**: `vercel.json`でモノレポ対応コマンドを定義

### 📊 監視・運用

- **監視**: Vercel Analytics + Core Web Vitals monitoring
- **ログ確認**: `vercel logs`でデプロイ後の動作確認
- **デバッグ**: GitHub Actions logsとVercel Function logsを併用

### 🔄 継続的改善

**2025年9月時点で確立した安定構成を維持すること**:

- Vercel側ビルドによる高い成功率
- 公式フロー準拠による環境依存問題の解消
- GUI設定とCI設定の適切な役割分担

## 🔗 関連リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [バックエンドデプロイメントガイド](./backend-deployment-guide.md)
- [システム概要](../architecture/system-overview.md)
