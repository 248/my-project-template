---
title: 開発者ガイド
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# 開発者ガイド

> プロジェクトでの開発手順・よく使うコマンド・トラブルシューティング

## 🎯 基本方針

- **説明・レビュー・コミット文・PR本文は日本語**（技術用語は英語可）
- **変数名・関数名・ファイル名は英語**（lowerCamelCase / kebab-case / PascalCase）
- **技術スタック**: Next.js 15 + React 19 + Cloudflare Workers + Hono + TypeScript + TailwindCSS + Prisma + Neon PostgreSQL + Upstash Redis
- **パッケージマネージャ**: pnpm（Corepack で固定）
- **開発環境**: Cloudflare Workers（エッジファースト開発）

---

## 🚀 開発の流れ（ローカル）

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. 環境変数設定

```bash
# 推奨: 自動セットアップ
pnpm setup:local
```

- `apps/frontend/.env.local`（Next.js 用）と `apps/backend/.dev.vars`（Workers 用）が雛形から生成されます。
- `.env.local` は devcontainer 向けの共通設定として生成されます（必要に応じて編集してください）。
- `apps/backend/.env`（Prisma CLI 用）も作成され、`DATABASE_URL` の雛形が書き込まれます。
- 生成されたファイルを開き、Clerk の公開鍵や `DATABASE_URL` など実際の値に更新してください。

> **NOTE:** `apps/frontend/.env.local` の `NEXT_PUBLIC_API_BASE_URL` はローカル Workers が待ち受ける `http://127.0.0.1:8787` を指す必要があります。値が未設定のままだと `pnpm dev:full` 実行時に API クライアント初期化で失敗します。

#### 手動セットアップ（補足）

```bash
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
cp apps/frontend/.env.local.example apps/frontend/.env.local
cp .env.local.example .env.local
echo 'DATABASE_URL="postgresql://username:password@endpoint.neon.tech/dbname?sslmode=require"' > apps/backend/.env
```

> `apps/frontend/.env.local` と `apps/backend/.dev.vars` で、DATABASE_URL / CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY などをプロジェクトに合わせて編集してください。

### 3. 型・スキーマ生成（必須）

```bash
# 1. OpenAPI → TypeScript型 + Zodスキーマ生成
pnpm codegen

# 2. メッセージキー → TypeScript型定義生成（i18n対応）
pnpm gen:messages

# 3. Prisma → 型安全DBクライアント生成（server境界層）
pnpm --filter @template/backend db:generate

# 一括実行（推奨）
pnpm codegen && pnpm gen:messages && pnpm --filter @template/backend db:generate
```

**⚠️ 重要**: `gen:messages`を実行しないとフロントエンドのメッセージ型定義が不足し、開発サーバーが起動しません。

### 4. 開発サーバ起動

```bash
# フロントエンド（Next.js）とバックエンド（Cloudflare Workers）を同時起動
pnpm dev:full

# または個別起動
pnpm --filter @template/frontend dev         # Next.js (localhost:3000)
pnpm --filter @template/backend dev:workers  # Cloudflare Workers (localhost:8787)
```

### 5. ✅ 品質チェック（PR 前に必ず実行）

```bash
# 一括品質チェック（推奨）
pnpm quality-check

# または個別実行
pnpm codegen         # API型生成確認
pnpm gen:messages    # メッセージキー型生成確認
pnpm type-check      # TypeScript エラー: 0件必須
pnpm lint            # ESLint（段階的厳格化対応）
pnpm test:run        # テスト実行

# 環境診断
pnpm run doctor      # 主要な環境変数とポートの状態を確認

# コード整形
pnpm lint:fix        # 自動修正可能なESLintエラー修正
pnpm format          # Prettier自動整形

# ビルド確認
pnpm build           # 全体ビルド
pnpm build:frontend  # フロントエンドのみビルド
pnpm build:backend   # バックエンドのみビルド
```

#### ESLint段階的厳格化について

- **開発時**: 警告中心で開発速度を優先
- **CI/本番**: 厳格エラーで品質を担保
- **型境界レイヤー**: Cloudflare Workers `c.env`等で厳格な型チェック
- **自動修正**: unused-imports、import順序等は自動修正

---

## ☁️ Cloudflare Workers 開発環境

プロジェクトはCloudflare Workersを使用したサーバーレス・エッジファーストアーキテクチャを採用しています。

### Workers開発の特徴

**✅ メリット**

- **グローバル配信**: エッジロケーションでの高速レスポンス
- **スケーラビリティ**: 自動スケーリング、コールドスタート最小化
- **統合開発環境**: wranglerによるローカル開発環境
- **型安全性**: TypeScriptとESモジュールの完全サポート

**📋 外部サービス**

- **データベース**: Neon PostgreSQL（サーバーレス対応）
- **キャッシュ**: Upstash Redis（HTTP REST API）
- **認証**: Clerk JWT（JWKSによるトークン検証）

### アクセス方法

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8787（wrangler devのデフォルトポート）

### 環境設定

```bash
# .dev.vars ファイル設定例（apps/backend/.dev.vars）
DATABASE_URL=postgresql://username:password@endpoint.neon.tech/dbname
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
CLERK_SECRET_KEY=sk_test_your_clerk_key
CLERK_JWT_ISSUER=https://your-app.clerk.accounts.dev
```

---

## 📋 よく使うコマンド

### 基本コマンド

```bash
# インストール・セットアップ
pnpm i                    # 依存関係インストール
pnpm codegen             # API型定義生成
pnpm gen:messages        # メッセージキー型定義生成

# 開発
pnpm dev                 # フロントエンド開発サーバー
pnpm dev:workers         # バックエンドWorkers開発サーバー
pnpm dev:full             # フルスタック開発環境

# 品質チェック
pnpm type-check          # TypeScript型チェック
pnpm lint                # ESLint
pnpm test:run            # テスト実行
pnpm quality-check       # 全体品質チェック

# ビルド
pnpm build               # 全体ビルド
pnpm build:frontend      # フロントエンドのみ
pnpm build:backend       # バックエンドのみ

# コード整形
pnpm lint:fix            # ESLint自動修正
pnpm format              # Prettier整形

# クリーンアップ
pnpm clean               # 全パッケージクリーンアップ
```

### 手動デプロイコマンド（緊急時用）

通常はCI/CDで自動デプロイされますが、緊急時は以下のコマンドで手動デプロイ可能：

```bash
# 緊急時の手動デプロイコマンド（CI/CDが使用できない場合のみ）
pnpm deploy:vercel:production   # Vercel本番デプロイ
pnpm deploy:vercel:preview      # Vercelプレビューデプロイ
pnpm deploy:workers:preview     # Workers プレビューデプロイ
pnpm deploy:workers:production  # Workers 本番デプロイ

# 削除されたセットアップコマンド（使用頻度低）
# pnpm vercel:link         # → 初回セットアップ時のみ手動実行
# pnpm vercel:env          # → GitHub Secretsで管理
```

### 停止コマンド

```bash
# 開発プロセス一括停止（Windows）
./infra/scripts/stop-all.ps1

# 開発プロセス一括停止（Linux/Mac）
./infra/scripts/stop-all-safe.sh

# wrangler dev プロセス停止
# Ctrl+C または プロセス終了
```

### 型・スキーマ生成

```bash
pnpm codegen                                        # OpenAPI → TypeScript型 + Zodスキーマ生成
pnpm --filter @template/backend db:generate        # Prisma → DBクライアント生成（server境界層）
```

### データベース操作（Prisma）

```bash
# Prismaデータベース操作（バックエンド）
# 注意: 全てのPrismaコマンドは --schema ../../db/schema.prisma で統一スキーマ参照
# 環境変数は apps/backend/.env ファイルから自動読み込み
pnpm --filter @template/backend db:generate        # Prismaクライアント生成
pnpm --filter @template/backend db:migrate         # マイグレーション作成+適用（開発用）
pnpm --filter @template/backend db:migrate:create  # マイグレーション作成のみ
pnpm --filter @template/backend db:migrate:deploy  # マイグレーション適用のみ（本番用）
pnpm --filter @template/backend db:migrate:status  # マイグレーション状態確認
pnpm --filter @template/backend db:push           # スキーマ → DB直接反映（プロトタイプ用）
pnpm --filter @template/backend db:studio         # Prisma Studio起動
pnpm --filter @template/backend db:reset          # データベース完全リセット

# 詳細は Prismaマイグレーションガイドを参照
# docs/handbook/prisma-migration-guide.md
```

### Workers開発特有

```bash
pnpm codegen             # OpenAPI→型安全なクライアント生成
pnpm postinstall         # 依存関係インストール後の自動生成
pnpm prebuild            # ビルド前の自動生成
pnpm quality-check       # 型チェック→Lint一括実行
pnpm dev:full               # フロント・バック同時起動（Workers環境）

# Workers個別コマンド
pnpm --filter @template/backend dev:workers    # Cloudflare Workers ローカル開発
pnpm --filter @template/backend build          # Workers本番ビルド
pnpm --filter @template/backend wrangler       # wrangler CLI直接実行
```

### メッセージキー生成

日常的な運用フローや CLI オプション、レジストリ分割のルールは [Message System Guide](./message-system-guide.md) に集約しています。以下はクイックリファレンスです。

```bash
# 代表的なコマンド
pnpm verify:messages          # レジストリと生成物の整合性検証
node tools/message-codegen/generate.js    # TypeScript/Go/OpenAPI 生成
node tools/message-codegen/generate.js --dry-run
```

より詳細な手順（レジストリ構成、`MESSAGE_CONFIG_PATH` の使い分け、テスト方法など）は Message System Guide を参照してください。

---

## 🔄 タスクワークフロー

### Claude 実行時の手順

1. **Understand**: 要求・既存コード・依存関係を要約。あいまいさが残る場合のみ質問。
2. **Plan**: 変更点・新規/更新ファイル・公開/破壊的変更・ロールバック案・テスト計画を列挙。
3. **Implement**: 影響の小さい順に差分を提案。型→実装→テスト→ドキュメントの順。
4. **Verify**: コマンド実行ログ（疑似でも可）を提示し、失敗時は原因と修正案。
5. **Commit & PR**: Conventional Commits / 日本語PR本文テンプレに沿って作成。

---

## ☁️ Workers開発のベストプラクティス

### 環境変数管理

```bash
# .dev.vars ファイルでローカル開発環境変数を管理
# 本番環境はCloudflare Dashboardで設定

# 必須環境変数チェック
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required')
if (!env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is required')
```

### パフォーマンス最適化

- **コールドスタート最小化**: 不要なライブラリのimport削減
- **エッジキャッシング**: Upstash Redis活用
- **型安全性**: TypeScript + Zodバリデーション
- **軽量実装**: シンプルなファンクション構成

### セキュリティ

- **JWT検証**: Clerk JWKSによるトークン検証
- **CORS設定**: 適切なオリジン制限
- **環境変数**: `.dev.vars`は絶対にコミット禁止

---

## 🛟 トラブルシューティング

### よくある問題と解決策

| 問題                   | 原因                 | 解決策                                 |
| ---------------------- | -------------------- | -------------------------------------- |
| 依存関係不一致         | pnpm バージョン違い  | `pnpm install --force`                 |
| 型生成が失敗           | OpenAPI 仕様エラー   | `pnpm codegen` を再実行                |
| Workers起動エラー      | 環境変数未設定       | `.dev.vars`ファイル確認・作成          |
| リンタが暴れる         | 設定競合             | `pnpm lint:fix` → 個別修正             |
| データベース接続エラー | 環境変数不正・未設定 | `.env`ファイルのDATABASE_URL確認       |
| JWT認証エラー          | Clerk設定ミス        | CLERK_SECRET_KEY, CLERK_JWT_ISSUER確認 |
| Redis接続エラー        | Upstash設定ミス      | UPSTASH環境変数確認                    |

### デバッグ手順

```bash
# Step 1: 型エラー解決
pnpm type-check

# Step 2: Lint エラー解決
pnpm lint --fix

# Step 3: 自動生成更新
pnpm codegen

# Step 4: 環境変数確認
cat apps/backend/.dev.vars  # ローカル開発環境変数確認
cat apps/backend/.env       # Prisma用DATABASE_URL確認

# Step 5: Workers ローカルサーバー起動テスト
pnpm --filter @template/backend dev:workers

# Step 6: 最終確認
pnpm --filter @template/backend build
```

### Workers特有のデバッグ

#### 環境変数エラー診断

- `.dev.vars` ファイルの存在確認
- 必須環境変数の設定確認（DATABASE_URL, CLERK_SECRET_KEY等）
- wranglerログでの詳細エラー確認

#### 外部サービス接続エラー

- Neon PostgreSQL接続確認
- Upstash Redis接続確認
- Clerk JWT設定確認

---

## ⚡ Next.js 15特有の注意事項

1. **Request APIs非同期化**: `headers()`, `cookies()`, `draftMode()`は必ず`await`を使用
2. **Dynamic Routes対応**: `params`は`React.use()`でアンラップしてから使用
3. **Caching明示**: fetchリクエストでキャッシュが必要な場合は`{ cache: 'force-cache' }`を明示
4. **Runtime指定**: fsモジュール等のNode.js APIを使う場合は`export const runtime = 'nodejs'`を明示

---

## 🤖 Claude Code Tips

- **高速検索**: `rg <keyword>`（ripgrep）
- **複数コマンド連結**: `pnpm lint && pnpm type-check`
- **生成/修正提案**: 差分（patch）で提示 → 最小単位で適用
- **影響範囲が大きい変更**: 計画 → 小さな PR に分割

---

## 📚 Claude Prompts（定型）

### よく使う定型プロンプト

- **計画作成**:

  > 「以下の課題に対し、変更方針・影響範囲・更新ファイル一覧・テスト戦略を**日本語**で箇条書き。次にパッチ案（diff）を示して。」

- **差分レビュー**:

  > 「この diff をレビューして。重大度順に問題点→理由→修正提案→必要テストを**日本語**で。」

- **リファクタ**:

  > 「循環依存を解消し、型境界を整理して。変更後の構成図と、最小パッチを提案。」

- **バグ再現→修正**:
  > 「再現手順→原因仮説→検証→最小修正→回帰テストを日本語で順に。」

---

## 🔗 関連ドキュメント

- **[システム概要](../architecture/system-overview.md)** - アーキテクチャ・技術スタック
- **[バックエンドデプロイメントガイド](./backend-deployment-guide.md)** - Cloudflare Workers デプロイ
- **[Prismaマイグレーションガイド](./prisma-migration-guide.md)** - データベース管理・Atlas移行
- **[データベース管理](../../db/README.md)** - 言語非依存なDB資産管理・将来の移行戦略
- **[JWT認証ガイド](../architecture/jwt-authentication-guide.md)** - Clerk JWT認証実装詳細
- **[コード規約](../styleguide/code-standards.md)** - 品質基準・型安全性
- **[貢献ガイドライン](../contrib/contribution-guide.md)** - PR 規約・レビュー観点
