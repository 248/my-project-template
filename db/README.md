# データベース管理ディレクトリ

> プロジェクトの言語非依存なデータベース資産を管理するディレクトリです。

## 📁 ディレクトリ構成

```
db/
├── schema.prisma          # データベーススキーマ定義（真実の源泉）
├── migrations/            # Prismaが生成するSQLマイグレーション
│   ├── 20250908234300_init/
│   │   └── migration.sql  # 初期テーブル作成
│   └── migration_lock.toml
├── seed.ts                # テストデータ投入スクリプト
└── README.md              # このファイル
```

## 🎯 設計方針

### 言語非依存の設計

- **将来性**: Go移行時もSQLマイグレーションファイルを再利用可能
- **責務分離**: データベーススキーマとアプリケーションロジックの分離
- **開発効率**: TypeScript開発時はPrismaの型安全性を最大活用

### 生成物の配置

- **Prismaクライアント**: `../apps/backend/generated/prisma` に生成
- **マイグレーションSQL**: `./migrations/` で Git管理
- **スキーマ定義**: `./schema.prisma` で一元管理

## 📋 コマンドリファレンス

詳細なPrismaコマンドと使用方法については以下を参照：

- **[開発者ガイド](../docs/handbook/developer-guide.md#データベース操作（prisma）)** - 基本的なPrismaコマンド一覧
- **[Prismaマイグレーションガイド](../docs/handbook/prisma-migration-guide.md)** - マイグレーション管理・開発フロー詳細

## 🔄 開発フロー

詳細なデータベース開発ワークフローについては：

- **[Prismaマイグレーションガイド](../docs/handbook/prisma-migration-guide.md#開発ワークフロー)** - スキーマ変更からデプロイまでの手順

## 🚀 将来の移行戦略

言語非依存設計により、SQLマイグレーションファイルは他のORM（Go/sqlc、Rust/sqlx等）でも再利用可能。

詳細は **[移行戦略ドキュメント](../docs/architecture/migration-strategy.md)** を参照。

## ⚠️ 重要な注意事項

1. **Git管理**: `migrations/` ディレクトリは必ずコミット
2. **手動編集**: 生成されたSQLファイルは必要に応じて手動調整可能
3. **本番適用**: 必ず段階的にデプロイ（dev → staging → production）

## 🔗 関連ドキュメント

### 📖 主要ガイド

- **[Prismaマイグレーションガイド](../docs/handbook/prisma-migration-guide.md)** - Atlas移行・マイグレーション管理完全ガイド
- **[開発者ガイド](../docs/handbook/developer-guide.md)** - Workers開発・コマンドリファレンス
- **[バックエンドデプロイメントガイド](../docs/handbook/backend-deployment-guide.md)** - 本番デプロイ手順

### 🏗️ アーキテクチャ

- **[システム概要](../docs/architecture/system-overview.md)** - 全体アーキテクチャ・技術選択
- **[移行戦略](../docs/architecture/migration-strategy.md)** - スケーリング・将来の移行計画