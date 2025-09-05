# Project Template

現代的なフルスタック Web アプリケーション開発用のプロジェクトテンプレート

## 🎯 概要

このテンプレートは、型安全性とコード品質を重視したモダンな Web アプリケーション開発のベースとなるものです。フロントエンドからバックエンドまでの一貫した開発体験を提供します。

### 主要機能

- **型安全性**: TypeScript strict モード + OpenAPI 仕様による決定的な型生成
- **品質保証**: ESLint, Prettier, Husky による自動品質チェック
- **モノレポ**: pnpm workspaces による効率的なパッケージ管理
- **開発体験**: ホットリロード + 包括的な開発ツール

### 技術スタック

- **Next.js 15** + **React 19** + **TypeScript** - モダンなフロントエンド
- **Hono** + **OpenAPI** - 高速で型安全なバックエンド API
- **pnpm workspaces** - モノレポ管理
- **ESLint** + **Prettier** + **Husky** - コード品質管理

詳細は [📋 システム概要](docs/architecture/system-overview.md) を参照

## 🚀 クイックスタート

### 環境構築

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env
```

### 開発開始（Docker推奨）

```bash
# フルスタック開発（フロント・バック・DB同時起動）
pnpm dev:fullstack

# またはバックグラウンドで起動
pnpm docker:up
```

### 個別開発

```bash
# フロントエンドのみ
pnpm dev

# バックエンドのみ
pnpm dev:api

# データベースのみ
pnpm db:up
```

### 管理コマンド

```bash
# サービス停止
pnpm docker:down

# ログ確認
pnpm docker:logs

# データベース管理
pnpm db:down  # DB停止
pnpm db:logs  # DBログ確認
```

### 品質チェック

```bash
# 型チェック
pnpm type-check

# コード品質チェック
pnpm lint

# 一括品質チェック
pnpm quality-check

# 自動修正
pnpm quality-fix
```

詳細なセットアップ手順は [📖 開発者ガイド](docs/handbook/developer-guide.md) を参照

## 📚 ドキュメント

- [📖 開発者ガイド](docs/handbook/developer-guide.md) - セットアップ・コマンド・基本開発手順
- [🛠️ トラブルシューティング](docs/handbook/troubleshooting-guide.md) - ポート競合・プロセス問題の解決
- [🏗️ システム設計](docs/architecture/system-overview.md) - アーキテクチャ・技術選定理由
- [📐 コーディング規約](docs/styleguide/code-standards.md) - 型安全性・品質基準
- [🤝 コントリビューション](docs/contrib/contribution-guide.md) - PR規約・レビューガイドライン
- [🔧 API仕様](packages/api-contracts/openapi.yaml) - OpenAPI 3.0 仕様書

その他のドキュメントは [📋 ドキュメントポータル](docs/index.md) を参照

## 📂 プロジェクト構造

```
my-project-template/
├── apps/
│   ├── frontend/          # Next.js アプリケーション
│   └── backend/           # Hono API サーバー
├── packages/
│   ├── api-contracts/     # 📝 OpenAPI契約の単一ソース
│   │   ├── openapi.yaml   # API仕様（言語非依存）
│   │   └── codegen/
│   │       ├── ts/        # TypeScript契約パッケージ
│   │       └── go/        # Go契約パッケージ（将来）
│   ├── shared/            # 🍃 軽量・言語非依存ユーティリティ
│   ├── ui/                # UI コンポーネント
│   ├── api-client/        # （将来Go移行時用）
│   └── config/            # 設定管理
├── infra/
│   └── docker/            # 🐳 Docker開発環境
│       ├── Dockerfile.frontend
│       ├── Dockerfile.backend
│       └── docker-compose.yml
├── docs/                  # プロジェクトドキュメント
└── tools/                 # 開発ツール
```

## 🛠️ 利用可能コマンド

### 🚀 開発用（推奨）

- `pnpm dev:smart` - スマート開発開始（ポート競合自動回避）
- `pnpm dev:doctor` - 環境診断・自動修復
- `pnpm cleanup` - 開発プロセス強制停止・環境クリーンアップ

### 従来開発用

- `pnpm dev` - フロントエンド開発サーバー起動 (localhost:3000)
- `pnpm dev:api` - バックエンド開発サーバー起動 (localhost:8000)
- `pnpm dev:fullstack` - フロント・バックエンド同時起動

### Docker開発環境

- `pnpm dev:docker` - Docker環境でフロント・バック同時起動
- `pnpm dev:docker:detached` - Docker環境をバックグラウンドで起動
- `pnpm docker:logs` - Dockerコンテナのログ表示
- `pnpm docker:stop` - Dockerコンテナ停止
- `pnpm docker:clean` - Dockerコンテナ・イメージ完全削除

### ビルド・デプロイ

- `pnpm build` - 全アプリケーションのビルド
- `pnpm start` - フロントエンドの本番起動
- `pnpm start:api` - バックエンドの本番起動

### 品質管理

- `pnpm type-check` - TypeScript 型チェック
- `pnpm lint` - ESLint コード品質チェック
- `pnpm lint:fix` - ESLint 自動修正
- `pnpm format` - Prettier コード整形
- `pnpm quality-check` - 一括品質チェック
- `pnpm quality-fix` - 一括自動修正

### ユーティリティ

- `pnpm clean` - ビルド成果物削除
- `pnpm codegen` - OpenAPI からの型生成

---

**開発開始**: 2025年1月 | **ライセンス**: MIT
