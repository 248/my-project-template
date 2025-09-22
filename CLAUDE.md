# CLAUDE.md — プロジェクトテンプレート 作業規約

> **AI（Claude Code など）が計画→実装→検証→PR まで一貫して遂行**できるよう、最重要ルールとドキュメント索引を提供。

---

## 🎯 最重要ルール（Mini Rules）

- **🇯🇵 日本語優先**: コミットメッセージ・PR説明・コメント・Issue報告は**必ず日本語**で記述
- **日本語で説明、英語で識別子**
- **まず計画→小さなPR** - いきなり書き換えない
- **品質チェック**: `pnpm codegen && pnpm type-check && pnpm lint && pnpm test` を必ず通す
- **🚫 品質チェック迂回禁止**: git hooks (`--no-verify`)や品質チェックルール変更は**必ずユーザーに確認**
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

- **[開発者ガイド](./docs/handbook/developer-guide.md)** - Workers開発・セットアップ・トラブルシューティング
- **[バックエンドデプロイメントガイド](./docs/handbook/backend-deployment-guide.md)** - Cloudflare Workers デプロイ
- **[Prismaマイグレーションガイド](./docs/handbook/prisma-migration-guide.md)** - データベース管理・Atlas移行
- **[データベース管理](./db/README.md)** - 言語非依存なDB資産管理・将来の移行戦略
- **[APIコード生成](./docs/handbook/api-codegen-guide.md)** - OpenAPIからの型安全クライアント生成
- **[テスト戦略](./docs/handbook/testing-strategy.md)** - 品質保証・静的解析・テスト方針
- **[Vitestテスト実装ガイド](./docs/handbook/testing-guide.md)** - Vitest実装・テストパターン・実践方法
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

## 🤖 Claude向け実行指針

1. **理解**: タスクを分析し、曖昧さがあれば質問
2. **計画**: 変更ファイル・影響範囲・テスト方針を日本語で提示
3. **実装**: 型→実装→テスト→ドキュメントの順で小さな差分
4. **検証**: 品質チェックコマンドを実行してログ提示
5. **PR作成**: [貢献ガイドライン](./docs/contrib/contribution-guide.md)のテンプレに沿って作成

### 🇯🇵 日本語コミュニケーション規約

Claude は以下の文書作成時に**必ず日本語を使用**すること：

#### ✅ 必須日本語項目

- **gitコミットメッセージ**: タイトル・本文ともに日本語
- **PR/Issue説明**: タイトル・説明文・コメント全て日本語
- **GitHubコメント**: レビューコメント・対応報告・議論全て日本語
- **コード内コメント**: 日本語でロジック説明
- **ドキュメント**: README以外は基本日本語

#### 🚫 例外（英語可）

- **変数・関数名**: `getUserProfile`, `API_BASE_URL` など識別子
- **技術用語**: `React`, `TypeScript`, `API` など固有名詞
- **ログメッセージ**: システムログは英語可
- **外部ライブラリ準拠**: 外部標準に合わせる場合

#### 💡 推奨パターン

```bash
# ❌ 英語コミット
git commit -m "fix: resolve health check bug"

# ✅ 日本語コミット
git commit -m "fix: ヘルスチェックのバグを修正"
```

### 🚫 禁止事項・要確認事項

#### サーバー操作禁止

Claude は以下のサーバー関連操作を**一切実行してはならない**：

- `pnpm dev`, `pnpm dev:workers`, `pnpm dev:full` の実行
- `wrangler dev`, `wrangler deploy` の実行
- その他あらゆるサーバー起動・再起動・停止コマンド

**理由**: ポート競合やプロセス残存によるシステム不安定化防止

**対応方法**: サーバー操作が必要な場合は必ず以下のようにユーザーに依頼する：

```
Workersサーバーの起動が必要です。以下のコマンドを実行してください：
pnpm dev:full
```

#### 品質チェック迂回・設定変更は要確認

Claude は以下の品質チェック関連操作を**ユーザー確認なしに実行してはならない**：

- `git push --no-verify` などのgit hooksの迂回
- `.eslintrc.cjs`、`tsconfig.json`等の品質チェックルール緩和
- `package.json`のlint/type-check設定変更
- pre-commit/pre-pushフックの無効化

**理由**: プロジェクトの品質基準維持とコードの信頼性確保

**対応方法**: 品質チェック関連の問題が発生した場合は必ずユーザーに確認する：

```
品質チェックエラーが発生しています。以下の対応が必要ですが、実行してよろしいですか？
1. ESLint設定の一時的な緩和
2. git hooksの迂回
[エラー詳細とリスクを説明]
```

---

**💡 詳細は各ドキュメントを参照してください。このファイルは索引として機能します。**
