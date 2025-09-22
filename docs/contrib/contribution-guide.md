---
title: 貢献ガイドライン
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# 貢献ガイドライン

> プロジェクトへの貢献・PR作成・レビュー規約

## ✉️ コミット / PR ルール

### コミットメッセージ

- **Conventional Commits** を推奨（例: `feat: add agent card`, `fix(api): handle auth error`）
- **英語の imperative** 形式（例: `Add avatar component`）
- **1 PR = 1 目的**（atomic）を原則

### ブランチ規約

- `feature/*` - 新機能
- `fix/*` - バグ修正
- `chore/*` - 雑務・設定変更

### PR には以下を含める

- 変更内容の概要（**日本語**）
- 実行したコマンドやテスト結果（`lint` / `type-check` / `format:check` / 任意の `test`）
- 関連 Issue（あれば）

---

## 🔍 PR Review Checklist

### 基本観点

- [ ] **目的は明確か** / 変更は最小か / 破壊的変更の有無
- [ ] **型の整合性**（API ↔ Domain ↔ UI）/ null 安全性
- [ ] **エラーパス**が網羅されているか（タイムアウト・リトライ）

### セキュリティ・品質

- [ ] **セキュリティ**（入力検証、認可、秘密の露出なし）
- [ ] **パフォーマンス**（N+1, 無駄な re-render, 不要I/O）
- [ ] **テストの妥当性**（境界/エッジケース/回帰）
- [ ] **ドキュメント更新**・CHANGELOG・サンプルコードの有無

---

## 🧪 PR Template

```markdown
## 目的 / Why

- （この変更の背景と狙い）

## 変更点 / What

- （主なコード変更）
- （公開/破壊的変更があれば明記）

## 影響範囲 / Impact

- UI・API・DB・パフォーマンス・互換性

## テスト / Tests

- [ ] ユニット/統合テスト追加（該当時）
- 実行ログ:
  - `pnpm type-check`: ✅/❌
  - `pnpm lint`: ✅/❌
  - `pnpm format:check`: ✅/❌
  - （任意）`pnpm test`: ✅/❌

## 補足 / Notes

- ロールバック手順・既知の制約など
```

---

## 🛡️ 安全策（Guardrails）

### 開発方針

1. **Plan-first**: いきなり書き換えない。まず「目的・変更点・影響範囲・変更ファイル一覧・テスト方針」を**計画**として提示。
2. **Small & atomic**: 変更は**小さく**。1PR = 1目的。
3. **No secrets**: .envや鍵は触れない・生成しない。
4. **Edge/Browser 配慮**: Node 専用ライブラリ（例: `fs`, `pino`）を**クライアント/Edge**に混入させない。
5. **Destructive ops 禁止**: `--force`, `rm -rf`, 大量 rename 等は**計画で明示→承認後**に限定。

### プロジェクト特有の安全策

6. **型安全性維持**: 手動型定義禁止、OpenAPI仕様更新→自動生成の流れを厳守
7. **自動生成ファイル保護**: 生成されたAPI型・スキーマ・クライアントファイルは手動編集禁止
8. **API仕様整合性**: エンドポイント追加・変更時は必ずOpenAPI仕様を先に更新
9. **ログ機密性**: ユーザー情報・APIキー・パスワード等の機密情報をログ出力しない
10. **外部API制限**: 外部API呼び出しは適切なエラーハンドリング・レート制限対応必須

---

## ♻️ 失敗時のふるまい / ロールバック

### 対処方針

- **失敗ログと仮説→対処**を提示
- 影響が読めない場合は **小さな revert PR** または **feature flag** で切り戻し可能に

### 緊急時対応

```bash
# 型エラー大量発生時
pnpm generate:all  # 自動生成更新
pnpm type-check    # エラー箇所確認

# ESLint エラー大量発生時
pnpm lint --fix    # 自動修正
# 手動修正 → 設定レベル解決検討

# ビルド失敗時
# 1. 型チェック → 2. ESLint → 3. 依存関係確認
```

---

## 🗒️ 変更履歴 / リリースノート

### 記録方針

- 変更種別（feat/fix/chore/refactor）に応じて `CHANGELOG.md` 更新
- 破壊的変更は **BREAKING CHANGE:** セクションに記載
- コマンド失敗やテスト落ちは**ログ全文**と**仮説→対処**を提示

---

## 🔒 ファイル所有権・触ってよい範囲

### ✅ 変更可能

- `apps/frontend/src/**` - フロントエンドコード
- `apps/frontend/components/**` - Reactコンポーネント
- `apps/frontend/app/**` - Next.js App Router
- `apps/frontend/lib/**` - ユーティリティ・ライブラリ
- `.kiro/specs/**` - プロジェクト仕様書（要件・設計・タスク）

### ⚠️ 要計画（影響大）

- `scripts/**` - 自動生成スクリプト
- `infra/docker/**` - 旧Docker設定（現在は未使用）
- `package.json` - 依存関係・スクリプト
- `contracts/openapi.yaml` - OpenAPI仕様

### 🚫 読み書き禁止

- `.env*` - 環境変数・秘密情報
- `logs/**` - ログファイル
- `node_modules/**` - 依存関係
- `dist/**`, `build/**` - ビルド成果物

### 📋 自動生成ファイル（手動編集禁止）

- `packages/api-contracts/codegen/ts/src/generated/**` - OpenAPI生成ファイル
- 自動生成された型定義・スキーマ・クライアントファイル

---

## 🔗 関連ドキュメント

- **[開発者ガイド](../handbook/developer-guide.md)** - セットアップ・基本コマンド
- **[コード規約](../styleguide/code-standards.md)** - 品質基準・型安全性
- **[システム概要](../architecture/system-overview.md)** - アーキテクチャ・設計方針
