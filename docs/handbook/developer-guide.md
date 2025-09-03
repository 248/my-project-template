---
title: 開発者ガイド
author: core-team
created: 2025-08-28
updated: 2025-08-28
status: published
---

# 開発者ガイド

> プロジェクトでの開発手順・よく使うコマンド・トラブルシューティング

## 🎯 基本方針

- **説明・レビュー・コミット文・PR本文は日本語**（技術用語は英語可）
- **変数名・関数名・ファイル名は英語**（lowerCamelCase / kebab-case / PascalCase）
- **技術スタック**: Next.js 15 + React 19 + Hono + TypeScript + TailwindCSS + Prisma + PostgreSQL + Redis
- **パッケージマネージャ**: pnpm（Corepack で固定）

---

## 🚀 開発の流れ（ローカル）

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. Docker サービス起動（PostgreSQL + Redis）

```bash
# PostgreSQL + Redis 起動
pnpm db:up

# または従来の方法
cd infra/docker && docker compose up -d postgres redis
cd -
```

### 3. 型・スキーマ生成

```bash
# OpenAPI → TypeScript型 + Zodスキーマ生成
pnpm codegen

# Prisma → 型安全DBクライアント生成（server境界層）
pnpm db:generate

# または一括実行
pnpm codegen && pnpm db:generate
```

### 4. 開発サーバ起動

```bash
# フロントエンド（Next.js）とバックエンド（Hono）を同時起動
pnpm dev

# または個別起動
pnpm dev:frontend  # Next.js (localhost:3000)
pnpm dev:api       # Hono (localhost:8000)
```

### 5. ✅ 品質チェック（PR 前に必ず実行）

```bash
# 型・スキーマ生成確認
pnpm codegen && pnpm db:generate

# 品質チェック
pnpm type-check      # TypeScript エラー: 0件必須
pnpm lint            # ESLint エラー・警告: 0件必須
pnpm format:check    # Prettier形式チェック

# フロントエンド側まとめ実行
pnpm run --filter frontend quality-check

# 最終ビルド確認
pnpm build
```

---

## 🐳 Docker開発環境

Docker環境では、フロントエンドとバックエンドを同時にコンテナ内で実行できます。ホットリロードも完全対応しています。

### Docker環境の起動

```bash
# フロント・バック同時起動（ホットリロード対応）
pnpm dev:docker

# バックグラウンドで起動
pnpm dev:docker:detached
```

### Docker環境の管理

```bash
# ログ確認
pnpm docker:logs

# コンテナ停止
pnpm docker:stop

# 完全クリーンアップ（コンテナ・イメージ削除）
pnpm docker:clean
```

### アクセス方法

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8000

### メリット・デメリット

**✅ メリット**

- 環境構築の手間が最小
- チーム間での環境統一
- ホストマシンの環境に依存しない

**❌ デメリット**

- 初回ビルド時間が長い
- IDEの型チェック・補完が遅い場合がある
- ホストとコンテナ間のファイル同期オーバーヘッド

推奨は **ネイティブ環境** ですが、環境構築でトラブルがある場合にDocker環境をお試しください。

---

## 📋 よく使うコマンド

### 基本コマンド

```bash
pnpm i                    # 依存関係インストール
pnpm type-check          # TypeScript型チェック
pnpm lint                # ESLint（警告0件必須）
pnpm format              # Prettier整形
pnpm build               # 本番ビルド
```

### 型・スキーマ生成

```bash
pnpm codegen             # OpenAPI → TypeScript型 + Zodスキーマ生成
pnpm db:generate         # Prisma → DBクライアント生成（server境界層）
```

### データベース操作

```bash
# データベースサービス管理
pnpm db:up           # PostgreSQL + Redis 起動
pnpm db:down         # PostgreSQL + Redis 停止
pnpm db:restart      # データベース再起動
pnpm db:logs         # データベースログ確認

# Prismaデータベース操作（バックエンド）
pnpm db:push         # Prisma schema → DB反映（開発用）
pnpm db:migrate      # マイグレーション実行
pnpm db:studio       # Prisma Studio起動
pnpm db:seed         # シードデータ投入（要実装）
```

### プロジェクト特有

```bash
pnpm codegen             # OpenAPI→型安全なクライアント生成
pnpm postinstall         # 依存関係インストール後の自動生成
pnpm prebuild            # ビルド前の自動生成
pnpm quality-check       # 型チェック→Lint一括実行
pnpm dev                 # 開発サーバー起動
```

### Docker環境

```bash
# データベースのみ起動
pnpm db:up

# 全サービス（フロントエンド + バックエンド + データベース）
pnpm dev:docker

# 従来の方法
cd infra/docker && docker compose up -d postgres redis
```

---

## 🔄 タスクワークフロー

### Claude 実行時の手順

1. **Understand**: 要求・既存コード・依存関係を要約。あいまいさが残る場合のみ質問。
2. **Plan**: 変更点・新規/更新ファイル・公開/破壊的変更・ロールバック案・テスト計画を列挙。
3. **Implement**: 影響の小さい順に差分を提案。型→実装→テスト→ドキュメントの順。
4. **Verify**: コマンド実行ログ（疑似でも可）を提示し、失敗時は原因と修正案。
5. **Commit & PR**: Conventional Commits / 日本語PR本文テンプレに沿って作成。

---

## 🛟 トラブルシューティング

### よくある問題と解決策

| 問題              | 原因                | 解決策                                         |
| ----------------- | ------------------- | ---------------------------------------------- |
| 依存関係不一致    | pnpm バージョン違い | `pnpm install --force`                         |
| 型生成が失敗      | OpenAPI 仕様エラー  | `pnpm codegen` を再実行                        |
| CI/コンテナで遅い | キャッシュ未使用    | `pnpm fetch` → `pnpm install --offline` を検討 |
| リンタが暴れる    | 設定競合            | `pnpm lint:fix` → 個別修正                     |

### デバッグ手順

```bash
# Step 1: 型エラー解決
pnpm type-check

# Step 2: Lint エラー解決
pnpm lint --fix

# Step 3: 自動生成更新
pnpm codegen

# Step 4: 最終確認
pnpm build
```

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

- **[コード規約](../styleguide/code-standards.md)** - 品質基準・型安全性
- **[貢献ガイドライン](../contrib/contribution-guide.md)** - PR 規約・レビュー観点
- **[システム概要](../architecture/system-overview.md)** - ファイル所有権・設計指針
