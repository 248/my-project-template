# Project Template

現代的なフルスタック Web アプリケーション開発用のプロジェクトテンプレート

## 🎯 概要

このテンプレートは、型安全性とコード品質を重視したモダンな Web アプリケーション開発のベースとなるものです。フロントエンドからバックエンドまでの一貫した開発体験を提供します。

### 主要機能

- **型安全性**: TypeScript strict モード + OpenAPI 仕様による決定的な型生成
- **品質保証**: ESLint段階的厳格化 + 型境界レイヤー + 自動品質チェック
- **モノレポ**: pnpm workspaces による効率的なパッケージ管理
- **開発体験**: ホットリロード + Vitest + 包括的な開発ツール

### 技術スタック

- **フロントエンド**: Next.js 15 + React 19 + TypeScript
- **バックエンド**: Cloudflare Workers + Hono + TypeScript
- **データベース**: Neon PostgreSQL + Prisma
- **キャッシュ**: Upstash Redis
- **認証**: Clerk JWT
- **開発環境**: pnpm workspace

詳細は [📋 システム概要](docs/architecture/system-overview.md) を参照

## 👋 新人開発者の方へ

**初回セットアップ・初日の進め方**は [🚀 新人向けクイックスタートガイド](docs/handbook/quickstart-guide.md) をご覧ください（5分で読める導入ガイド）

## 🚀 クイックスタート

```bash
# 1. 依存関係インストール
pnpm install

# 2. 環境変数設定
pnpm setup:local
# ↳ `.env.local`（devcontainer 用）/ `apps/frontend/.env.local` / `apps/backend/.dev.vars` / `apps/backend/.env` を雛形から生成
#    生成されたファイルを開いて NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY や DATABASE_URL などを実際の値に更新してください

# 3. 開発サーバー起動
pnpm dev:full

# 4. （任意）環境診断
pnpm run doctor
# ↳ 主要な環境変数やポート使用状況を確認します
```

**アクセス先**:

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:8787

詳細なセットアップ手順は [📖 開発者ガイド](docs/handbook/developer-guide.md) を参照

## 📚 主要ドキュメント

- [📖 開発者ガイド](docs/handbook/developer-guide.md) - Workers開発・セットアップ・コマンド
- [☁️ バックエンドデプロイメントガイド](docs/handbook/backend-deployment-guide.md) - Cloudflare Workers デプロイ
- [🗄️ Prismaマイグレーションガイド](docs/handbook/prisma-migration-guide.md) - データベース管理
- [🔧 API仕様](packages/api-contracts/openapi.yaml) - OpenAPI 3.0 仕様書

**全ドキュメント**: [📋 ドキュメントポータル](docs/index.md)

## 📂 プロジェクト構造

```
my-project-template/
├── apps/
│   ├── frontend/          # Next.js アプリケーション
│   └── backend/           # Cloudflare Workers + Hono
├── packages/
│   ├── api-contracts/     # OpenAPI仕様・型生成
│   ├── shared/            # 共通ユーティリティ
│   └── ui/                # UI コンポーネント
├── db/                    # データベース（Prisma）
│   ├── schema.prisma      # スキーマ定義
│   └── migrations/        # マイグレーション
├── docs/                  # プロジェクトドキュメント
└── tools/                 # 開発ツール
```

## 🛠️ 主要コマンド

### 開発用

- `pnpm dev:full` - Workers とフロントエンドの同時起動
- `pnpm run doctor` - 必要な環境変数やポート状態を診断
- `pnpm --filter @template/frontend dev` - フロントエンドのみ
- `pnpm --filter @template/backend dev:workers` - Workersのみ

### データベース（Prisma）

- `pnpm --filter @template/backend db:generate` - クライアント生成
- `pnpm --filter @template/backend db:migrate` - マイグレーション
- `pnpm --filter @template/backend db:studio` - Prisma Studio

### 品質チェック

- `pnpm type-check` - TypeScript型チェック
- `pnpm lint` - ESLint
- `pnpm codegen` - OpenAPI型生成

詳細コマンドは [開発者ガイド](docs/handbook/developer-guide.md#よく使うコマンド) を参照

---

**開発開始**: 2025年1月 | **ライセンス**: MIT
