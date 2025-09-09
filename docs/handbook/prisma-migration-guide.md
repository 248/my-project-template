# Prisma マイグレーションガイド

> **Prismaによる型安全なデータベースマイグレーション管理**
>
> ORM機能とマイグレーション管理を統合したPrismaの使い方を説明します。

## 🎯 目的と前提

- **Prisma**: ORM機能とマイグレーション管理を一元化
- **スキーマファースト**: `schema.prisma`を真実の源泉として管理
- **型安全性**: データベースアクセスは完全に型安全
- **将来性**: 生成されたSQLファイルは他のツール（Goose、sql-migrate、Atlas等）でも再利用可能

## 📋 プロジェクト構成

```
my-project-template/
├── db/                           # 言語非依存DBパッケージ
│   ├── schema.prisma            # スキーマ定義（真実の源泉）
│   ├── migrations/              # Prisma生成のSQLマイグレーション
│   │   ├── 20250908234300_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── README.md               # DB管理ドキュメント
└── apps/backend/
    ├── generated/prisma/       # Prisma Clientの生成先
    └── .env                    # DATABASE_URL設定
```

## ⚙️ 設定ファイル

### db/schema.prisma の詳細

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../apps/backend/generated/prisma"  // 生成物はアプリ側
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // .envから読み込み
}
```

## 🚀 基本的な使い方

### 1. 初回セットアップ（新規プロジェクト）

```bash
# Prismaクライアント生成
pnpm --filter @template/backend db:generate

# 初期マイグレーション作成・適用
pnpm --filter @template/backend db:migrate
```

### 2. 既存DBからの移行

#### Step 1: 既存スキーマをPrismaに取り込み

```bash
# 現行DB → schema.prismaに反映
pnpm --filter @template/backend exec prisma db pull --schema ../../db/schema.prisma
```

#### Step 2: ベースラインマイグレーション作成

```bash
# 空DB → schema.prismaの差分をSQL生成
pnpm --filter @template/backend exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ../../db/schema.prisma \
  --script > ../../db/migrations/000_init/migration.sql
```

#### Step 3: 適用済みとして記録

```bash
# マイグレーションを「適用済み」として記録（実DBには適用しない）
pnpm --filter @template/backend exec prisma migrate resolve --applied 000_init --schema ../../db/schema.prisma
```

### 3. 日常的な開発フロー

#### スキーマ変更の手順

1. **Prismaスキーマを編集**: `db/schema.prisma`
2. **マイグレーション作成**: `pnpm --filter @template/backend db:migrate:create`
3. **生成されたSQLを確認・調整**: `db/migrations/latest/migration.sql`
4. **マイグレーション適用**: `pnpm --filter @template/backend db:migrate:deploy`
5. **Prismaクライアント再生成**: `pnpm --filter @template/backend db:generate`

## 📜 利用可能なコマンド

### 基本コマンド

```bash
# Prismaクライアント生成
pnpm --filter @template/backend db:generate

# 開発用マイグレーション（作成+適用）
pnpm --filter @template/backend db:migrate

# マイグレーション作成のみ（SQLレビュー用）
pnpm --filter @template/backend db:migrate:create

# マイグレーション適用のみ
pnpm --filter @template/backend db:migrate:deploy

# マイグレーション状態確認
pnpm --filter @template/backend db:migrate:status

# データベースリセット
pnpm --filter @template/backend db:reset

# Prisma Studio起動（データ参照・編集）
pnpm --filter @template/backend db:studio

# プロトタイピング用（スキーマ→DB直接適用）
pnpm --filter @template/backend db:push
```

## 🔄 環境別運用

### 開発環境

```bash
# 開発用マイグレーション（対話型）
pnpm --filter @template/backend db:migrate

# プロトタイピング時
pnpm --filter @template/backend db:push
```

### 本番環境（CI/CD）

```bash
# 本番デプロイ用（対話なし）
pnpm --filter @template/backend db:migrate:deploy
```

## ⚠️ 注意事項

### 開発時の注意

1. **マイグレーションファイルのコミット**: `db/migrations/` は必ずGitにコミット
2. **SQLの手動調整**: 生成されたSQLは必要に応じて手動で最適化可能
3. **ロールバック**: Prismaは自動ロールバックを提供しないため、手動でロールバック用SQLを準備

### 本番運用

1. **バックアップ**: 重要な変更前は必ずDBバックアップを取得
2. **段階的ロールアウト**: 開発→ステージング→本番の順で適用
3. **破壊的変更**: ダウンタイムが発生する変更は計画的に実行

## 🐛 トラブルシューティング

### よくあるエラー

#### 「DATABASE_URL not found」

```bash
# 解決方法: .envファイルの確認
# apps/backend/.envにDATABASE_URLが設定されているか確認
```

#### 「Migration file not found」

```bash
# 解決方法: スキーマパスの確認
# --schema ../../db/schema.prismaオプションが正しく指定されているか確認
```

#### 「Prisma Client generation failed」

```bash
# 解決方法: 依存関係の確認
pnpm install
pnpm --filter @template/backend db:generate
```

### パフォーマンス最適化

- 大きなテーブルでの変更時は、生成されたSQLを事前レビュー
- 本番適用前にステージング環境で実行時間を測定
- インデックスの追加・削除は手動でSQLを調整

## 📚 Prisma Client使用例

### 基本的なCRUD操作

```typescript
import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

// 作成
const user = await prisma.user.create({
  data: {
    id: 'clerk_user_123',
    displayName: 'テストユーザー',
    email: 'test@example.com',
    locale: 'ja'
  }
})

// 検索
const users = await prisma.user.findMany({
  where: {
    locale: 'ja'
  }
})

// 更新
const updatedUser = await prisma.user.update({
  where: { id: 'clerk_user_123' },
  data: { displayName: '更新されたユーザー' }
})

// 削除
await prisma.user.delete({
  where: { id: 'clerk_user_123' }
})
```

### DI コンテナでの使用

```typescript
// container/container.ts
container.registerSingleton<PrismaClient>(TYPES.PrismaClient, PrismaClient)

// サービスでの使用
@injectable()
export class UserService {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data })
  }
}
```

## 🔗 関連リソース

### 公式ドキュメント

- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [Prisma マイグレーション](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### プロジェクト内ドキュメント

- [開発者ガイド](./developer-guide.md): 環境セットアップ・コマンド
- [API設計ガイド](../architecture/api-design.md): スキーマ設計原則
- [テスト戦略](./testing-strategy.md): データベーステスト

## 🎯 将来の拡張

### Go移行時の対応

1. **マイグレーションSQLの再利用**: `db/migrations/` のSQLファイルをGoose等で使用
2. **スキーマ管理**: 必要に応じてGo用のスキーマ定義ツールに移行
3. **型生成**: sqlc等でGo向けの型安全なクエリビルダーを使用

### 高度な機能

- **レプリケーション**: 読み書き分離時の設定調整
- **シャーディング**: 水平分割時の設計考慮点
- **パフォーマンス監視**: クエリパフォーマンスの分析・最適化

---

> 💡 **Tips**: Prismaは開発効率と型安全性を両立する現代的なORMです。生成されたSQLファイルにより、将来的な技術選択の柔軟性も保持できます。