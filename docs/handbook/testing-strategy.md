---
title: テスト戦略・品質保証方針
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# テスト戦略・品質保証方針

> プロジェクトの品質保証戦略とテスト方針

## 🎯 基本方針

### 開発フェーズに応じた品質保証

**初期開発**: 開発速度を優先し、静的解析による品質保証を徹底  
**成長フェーズ**: 段階的にテストを導入し、品質とスピードのバランスを最適化  
**成熟フェーズ**: 包括的なテスト戦略により高い品質を維持

---

## 🛡️ 静的解析による品質保証（必須）

### 1. TypeScript型チェック（必須）

#### 設定

TypeScriptコンパイラオプションの厳格な設定：

**スクリプト設定**:

- type-check: エミット無しでの型チェックコマンド
- type-check:watch: 監視モードでの継続的な型チェック

**コンパイラオプション**:

- strict: 全ての厳格な型チェックを有効化
- noUncheckedIndexedAccess: 配列・オブジェクトアクセス時の安全性確保
- exactOptionalPropertyTypes: オプショナルプロパティの厳密型チェック
- noImplicitReturns: 全てのコードパスでの明示的return必須
- noFallthroughCasesInSwitch: switch文のフォールスルー防止

#### 品質基準

- **TypeScriptエラー: 0件必須**
- **型安全性: 100%保証**
- **any型使用: 完全禁止**

### 2. ESLint設定（段階的厳格化）

#### 設定

**最適化されたESLint設定** (329行→197行に簡素化、パフォーマンス向上):

**必須プラグイン**:

- @typescript-eslint/eslint-plugin: TypeScript専用ルール
- eslint-plugin-react: React開発でのベストプラクティス
- eslint-plugin-unused-imports: 未使用インポートの自動削除
- eslint-plugin-import: import/export健全性チェック

**段階的厳格化**:

- **開発時**: 警告中心（開発速度優先）
- **CI/本番**: 厳格エラー（品質優先）
- 自動環境判定（`CI=true` or `NODE_ENV=production`）

**型境界レイヤー**:

- Cloudflare Workers `c.env` の型安全化
- Zod による環境変数検証
- no-unsafe系エラーの根本解決

#### 品質基準

- **ESLintエラー: 0件必須**（警告は開発時許可）
- **型境界レイヤーでの厳格な型チェック**
- **自動修正可能エラーは CI で修正**

### 3. Prettier（コードフォーマット）

#### 設定

一貫したコードスタイルの自動適用：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 品質基準

- **format:check: 必ず通すこと**
- **エディタ保存時の自動整形推奨**

---

## 🧪 テスト戦略（段階的導入）

### Phase 0: 静的解析基盤（完了）

- **TypeScript** + **ESLint** + **Prettier** による品質保証
- 手動テストによる動作確認
- エラーハンドリングの目視確認

### Phase 1: Vitestテスト環境（実装完了 ✅）

#### 実装済み対象

- **UIコンポーネント**: Button、HealthCheckButton等の動作検証
- **ユーティリティ関数**: API レスポンスヘルパー、バリデーション関数
- **コマンドラインツール**: メッセージ生成ツールの動作検証
- **非同期処理**: API呼び出し・ローディング状態・エラーハンドリング

#### 使用ツール

- **Vitest**: 高速なテストランナー（設定完了）
- **@testing-library/react**: Reactコンポーネントテスト（React Testing Library）
- **jsdom**: ブラウザ環境シミュレーション
- **Vi (Vitest)**: モック・スパイ機能

#### 詳細実装ガイド

**📖 [Vitestテスト実装ガイド](./testing-guide.md)** - 具体的な使用方法・テストパターン・実装例

### Phase 2: 統合テスト導入

#### 対象

- **API エンドポイント**: バックエンドAPIの動作検証
- **認証フロー**: ユーザー認証・認可の検証
- **データベース操作**: CRUD操作の検証

### Phase 3: E2Eテスト導入

#### 対象

- **ユーザーフロー**: 重要な業務フローの自動検証
- **クロスブラウザテスト**: 主要ブラウザでの動作確認

#### ツール

- **Playwright**: E2Eテストフレームワーク
- **Docker**: 一貫したテスト環境

---

## 📊 品質メトリクス

### 必須メトリクス

| 項目               | 基準     | 測定方法          |
| ------------------ | -------- | ----------------- |
| TypeScriptエラー   | 0件      | `pnpm type-check` |
| ESLintエラー・警告 | 0件      | `pnpm lint`       |
| ビルド成功率       | 100%     | `pnpm build`      |
| **テスト成功率**   | **100%** | **`pnpm test`**   |

### 現在実装済みメトリクス（Vitest）

| 項目                 | 現在の状況         | 測定方法               |
| -------------------- | ------------------ | ---------------------- |
| コンポーネントテスト | 36テスト・全て成功 | `pnpm test:components` |
| バックエンドテスト   | 31テスト・全て成功 | `pnpm test:backend`    |
| ツールテスト         | 43テスト・全て成功 | `pnpm test:tools`      |
| テストカバレッジ     | 実装済み・測定可能 | `pnpm test:coverage`   |

### 将来メトリクス（拡張予定）

| 項目             | 目標            | 測定方法        |
| ---------------- | --------------- | --------------- |
| テストカバレッジ | 80%以上         | Vitest Coverage |
| パフォーマンス   | Core Web Vitals | Lighthouse      |
| E2E テスト成功率 | 100%            | Playwright      |

---

## 🔄 品質チェックワークフロー

### 開発時チェック

```bash
# 1. 型チェック
pnpm type-check

# 2. リント
pnpm lint

# 3. フォーマットチェック
pnpm format:check

# 4. テスト実行
pnpm test

# 5. ビルド
pnpm build
```

### カテゴリ別テスト実行

```bash
# コンポーネントテストのみ
pnpm test:components

# バックエンドテストのみ
pnpm test:backend

# ツールテストのみ
pnpm test:tools

# カバレッジ付きテスト
pnpm test:coverage
```

### PR前チェック

```bash
# 一括品質チェック（テスト含む）
pnpm codegen && pnpm type-check && pnpm lint && pnpm test && pnpm build
```

### CI/CD パイプライン

1. **依存関係インストール**
2. **コード生成**: `pnpm codegen`
3. **型チェック**: `pnpm type-check`
4. **リント**: `pnpm lint`
5. **テスト**: `pnpm test` ✅
6. **ビルド**: `pnpm build`
7. **デプロイ**: 本番環境へのデプロイ

---

## 🔧 ツール設定

### package.json スクリプト

```json
{
  "scripts": {
    "type-check": "pnpm -r type-check",
    "lint": "eslint . --ext .ts,.tsx --cache",
    "lint:fix": "eslint . --ext .ts,.tsx --fix --cache",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:components": "vitest run packages/ui/src/components/__tests__ apps/frontend/src/components/__tests__",
    "test:backend": "vitest run apps/backend/src/**/__tests__",
    "test:tools": "vitest run tools/message-codegen/__tests__",
    "test:coverage": "vitest run --coverage",
    "quality-check": "pnpm codegen && pnpm gen:messages && pnpm type-check && pnpm lint && pnpm test:run"
  }
}
```

### VS Code 設定

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.noSemicolons": "on"
}
```

---

## 🔗 関連ドキュメント

- **[Vitestテスト実装ガイド](./testing-guide.md)** - 実装済みテスト環境の詳細使用方法
- **[開発者ガイド](./developer-guide.md)** - 開発環境・コマンド
- **[コード規約](../styleguide/code-standards.md)** - コーディング標準
- **[貢献ガイド](../contrib/contribution-guide.md)** - PR・レビュー規約
