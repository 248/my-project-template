# Atlas移行ガイド

> **PrismaからAtlasへのマイグレーション移管ガイド**
>
> PrismaのORM機能はそのまま維持し、マイグレーション管理のみAtlasに移行する手順を説明します。

## 🎯 目的と前提

- **Prisma**: ORMとしてのクライアント生成のみに特化（`prisma generate` は継続）
- **Atlas**: データベースマイグレーション管理を担当
- **互換性**: 既存のPrismaマイグレーションとの共存
- **将来性**: Go移行時にもAtlasマイグレーションファイルが再利用可能

## 📋 前提条件

### 1. Atlasのインストール

#### macOS/Linux

```bash
# 公式インストーラーを使用
curl -sSf https://atlasgo.sh | sh

# またはHomebrew（macOS）
brew install ariga/tap/atlas
```

#### Windows

```powershell
# Scoopを使用
scoop install atlas

# または手動ダウンロード
# https://github.com/ariga/atlas/releases から適切なバイナリをダウンロード
```

### 2. 動作確認

```bash
atlas version
```

## 🏗️ プロジェクト構成

```
my-project-template/
├── atlas.hcl                    # Atlas設定ファイル
├── atlas/                       # Atlas管理のマイグレーション
│   └── migrations/
│       ├── 20240101000000.sql
│       └── atlas.sum
├── apps/backend/
│   └── prisma/
│       ├── schema.prisma        # スキーマ定義（真実源）
│       └── migrations/          # 既存のPrismaマイグレーション（保持）
└── package.json                 # Atlasコマンドを追加
```

## ⚙️ 設定ファイル

### atlas.hcl の詳細

プロジェクトルートの `atlas.hcl` は、以下の環境に対応：

- **dev**: 開発環境（Dockerベース）
- **prod**: 本番環境（DATABASE_URL使用）
- **staging**: ステージング環境（STAGING_DATABASE_URL使用）

重要な設定：

- `exclude = ["_prisma_migrations"]`: Prisma管理テーブルとの衝突回避
- `external_schema`: Prismaスキーマを入力として使用
- `dir = "file://atlas/migrations"`: Atlas専用マイグレーションディレクトリ

## 🚀 基本的な使い方

### 1. 初回セットアップ（既存プロジェクト）

#### Step 1: 初回差分生成

```bash
# Prismaスキーマと現在のDBの差分を生成
pnpm atlas:diff
```

#### Step 2: ベースライン設定

```bash
# 既存DBをAtlas管理下に移行（重複適用を防ぐ）
pnpm atlas:apply --baseline $(ls atlas/migrations/ | head -1 | sed 's/.sql//')
```

### 2. 日常的な開発フロー

#### スキーマ変更の手順

1. **Prismaスキーマを編集**: `apps/backend/prisma/schema.prisma`
2. **差分生成**: `pnpm atlas:diff`
3. **マイグレーション適用**: `pnpm atlas:apply`
4. **Prismaクライアント再生成**: `pnpm db:generate`

## 📜 利用可能なコマンド

### Atlas専用コマンド

```bash
# 差分生成（開発環境）
pnpm atlas:diff

# マイグレーション適用（開発環境）
pnpm atlas:apply

# マイグレーション適用（本番環境）
pnpm atlas:apply:prod

# マイグレーションファイルの品質チェック
pnpm atlas:lint

# 最新1つのマイグレーションをロールバック
pnpm atlas:down

# 現在のマイグレーション状態を確認
pnpm atlas:status

# スキーマの妥当性をバリデーション
pnpm atlas:validate
```

### 既存のPrismaコマンド（継続使用）

```bash
# Prismaクライアント生成（必須）
pnpm db:generate

# Prisma Studio（データ参照）
pnpm db:studio
```

## 🔄 環境別デプロイ

### 開発環境

```bash
# Docker DBに対して実行
pnpm atlas:apply
```

### ステージング環境

```bash
# STAGING_DATABASE_URLを設定して実行
STAGING_DATABASE_URL="your-staging-url" pnpm atlas:apply:prod
```

### 本番環境

```bash
# DATABASE_URLを使用して実行
pnpm atlas:apply:prod
```

## ⚠️ 注意事項

### Prisma Migrateからの移行時

1. **`prisma migrate deploy`をCI/CDから削除**: 重複適用を防ぐ
2. **`_prisma_migrations`テーブルは保持**: Atlas設定で除外済み
3. **ベースライン必須**: 既存DBでは必ず `--baseline` オプションを使用

### 開発チームでの運用

1. **マイグレーションファイルのコミット**: `atlas/migrations/` は必ずGitにコミット
2. **ブランチマージ時**: マイグレーションの順序に注意
3. **競合解決**: Atlasはマイグレーション順序を自動管理

### 本番運用

1. **破壊的変更の制御**: 本番環境では自動的にdrop操作をスキップ
2. **バックアップ**: 重要な変更前は必ずDBバックアップを取得
3. **段階的ロールアウト**: ステージング→本番の順で適用

## 🐛 トラブルシューティング

### よくあるエラー

#### 「dev database not found」

```bash
# 解決方法: Dockerコンテナの起動
pnpm db:up
```

#### 「database is not clean」

```bash
# 解決方法: ベースライン設定
pnpm atlas:apply --baseline <migration-version>
```

#### 「prisma generate not found」

```bash
# 解決方法: 依存関係の確認
pnpm install
pnpm db:generate
```

### パフォーマンス最適化

- 大きなテーブルでの変更時は、Atlas の `--auto-approve=false` で事前確認
- 本番適用前にステージング環境で実行時間を測定

## 🔗 関連リソース

### 公式ドキュメント

- [Atlas公式ガイド](https://atlasgo.io/guides/orms/prisma)
- [Prismaドキュメント](https://www.prisma.io/docs)

### プロジェクト内ドキュメント

- [開発者ガイド](./developer-guide.md): 環境セットアップ
- [API設計ガイド](../architecture/api-design.md): スキーマ設計原則
- [テスト戦略](./testing-strategy.md): マイグレーションテスト

## 🎯 次のステップ

1. **チーム展開**: 他の開発者への移行ガイド共有
2. **CI/CD統合**: GitHub ActionsでのAtlas自動実行
3. **監視設定**: マイグレーション実行状況のモニタリング
4. **Go移行準備**: Atlasマイグレーションファイルの再利用検討

---

> 💡 **Tips**: Atlasは既存のPrismaプロジェクトとも良好に共存できるよう設計されています。段階的な移行が可能です。
