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

```bash
# 環境構築
pnpm install

# 開発開始（フロントエンド）
pnpm dev

# バックエンド起動
pnpm dev:api

# フルスタック開発（両方同時起動）
pnpm dev:fullstack
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

- [📖 開発者ガイド](docs/handbook/developer-guide.md) - セットアップ・コマンド・トラブルシューティング
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
├── docs/                  # プロジェクトドキュメント
└── tools/                 # 開発ツール
```

## 🛠️ 利用可能コマンド

### 開発用

- `pnpm dev` - フロントエンド開発サーバー起動 (localhost:3000)
- `pnpm dev:api` - バックエンド開発サーバー起動 (localhost:8000)
- `pnpm dev:fullstack` - フロント・バックエンド同時起動

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
