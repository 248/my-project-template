# CLAUDE.md — プロジェクトテンプレート 作業規約

> **AI（Claude Code など）が計画→実装→検証→PR まで一貫して遂行**できるよう、最重要ルールとドキュメント索引を提供。

---

## 🎯 最重要ルール（Mini Rules）

- **日本語で説明、英語で識別子**
- **まず計画→小さなPR** - いきなり書き換えない
- **品質チェック**: `pnpm codegen && pnpm type-check && pnpm lint` を必ず通す
- **型安全性**: 手動型定義禁止、OpenAPI仕様更新→決定的生成の流れを厳守
- **秘密は触らない**: `.env*` や APIキーは読み書き禁止
- **自動生成ファイルは手動編集禁止**: `packages/api-contracts/codegen/ts/src/generated/**`
- **🚫 サーバー起動禁止**: Claude は一切のサーバー起動・再起動を行わない。必ずユーザーに依頼する
- **Conventional Commits + PR テンプレ順守**

---

## 📚 ドキュメント索引

### 🚀 はじめに

- **[README.md](./README.md)** - プロジェクト概要・セットアップ
- **[ドキュメントポータル](./docs/index.md)** - 役割別ドキュメント案内

### 🛠️ 開発・実装

- **[開発者ガイド](./docs/handbook/developer-guide.md)** - セットアップ・コマンド・トラブルシューティング
- **[APIコード生成](./docs/handbook/api-codegen-guide.md)** - OpenAPIからの型安全クライアント生成
- **[テスト戦略](./docs/handbook/testing-strategy.md)** - 品質保証・静的解析・テスト方針
- **[コード規約](./docs/styleguide/code-standards.md)** - 型安全性・品質基準・Definition of Done

### 🏗️ アーキテクチャ

- **[システム概要](./docs/architecture/system-overview.md)** - アーキテクチャ・技術スタック
- **[要件定義](./docs/architecture/requirements.md)** - プロジェクト要件テンプレート
- **[API設計](./docs/architecture/api-design.md)** - OpenAPI仕様・エンドポイント設計
- **[JWT認証ガイド](./docs/architecture/jwt-authentication-guide.md)** - Clerk JWT認証実装詳細・トラブルシューティング
- **[移行戦略](./docs/architecture/migration-strategy.md)** - スケーリング・移行計画

### 🔧 貢献・レビュー

- **[貢献ガイドライン](./docs/contrib/contribution-guide.md)** - PR規約・レビューチェックリスト・安全策

### 📋 プロジェクト仕様

- **[プロジェクト要件](./.kiro/specs/project-template/requirements.md)** - テンプレート要件定義
- **[API仕様](./packages/api-contracts/openapi.yaml)** - OpenAPI 3.0仕様

### 🔍 メタ・ガイドライン

- **[ドキュメント規約](./docs/meta/documentation-guidelines.md)** - 文書作成ルール
- **[実装ガイドライン](./docs/meta/implementation-guidelines.md)** - TypeScript詳細パターン
- **[リポジトリ構造](./docs/meta/repository-structure.md)** - モノレポ構成ベストプラクティス

---

## ⚡ クイックスタート

```bash
# 1. セットアップ
pnpm install
cp .env.example .env  # 環境変数を設定
(cd infra/docker && docker compose up -d)

# 2. 型生成とDB設定（実装後）
# pnpm codegen
# pnpm db:generate && pnpm db:push

# 3. 開発開始
pnpm dev

# 4. PR前チェック
pnpm type-check && pnpm lint && pnpm build
```

---

## 🤖 Claude向け実行指針

1. **理解**: タスクを分析し、曖昧さがあれば質問
2. **計画**: 変更ファイル・影響範囲・テスト方針を日本語で提示
3. **実装**: 型→実装→テスト→ドキュメントの順で小さな差分
4. **検証**: 品質チェックコマンドを実行してログ提示
5. **PR作成**: [貢献ガイドライン](./docs/contrib/contribution-guide.md)のテンプレに沿って作成

### 🚫 サーバー操作の禁止事項

Claude は以下のサーバー関連操作を**一切実行してはならない**：

- `pnpm dev`, `pnpm dev:api`, `pnpm dev:fullstack` の実行
- `docker compose up`, `docker compose restart` の実行
- `pnpm docker:up`, `pnpm docker:down` の実行
- その他あらゆるサーバー起動・再起動・停止コマンド

**理由**: ポート競合やプロセス残存によるシステム不安定化防止

**対応方法**: サーバー操作が必要な場合は必ず以下のようにユーザーに依頼する：

```
サーバーの起動が必要です。以下のコマンドを実行してください：
pnpm dev:fullstack
```

---

**💡 詳細は各ドキュメントを参照してください。このファイルは索引として機能します。**
