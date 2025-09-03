---
title: テスト戦略・品質保証方針
author: team
created: 2025-08-28
updated: 2025-08-28
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

### 2. ESLint設定（厳格）

#### 設定

プロジェクト品質を担保するESLint設定：

**必須プラグイン**:

- @typescript-eslint/eslint-plugin: TypeScript専用ルール
- eslint-plugin-react: React開発でのベストプラクティス
- eslint-plugin-react-hooks: React Hooksのルール検証

**重要ルール**:

- @typescript-eslint/no-explicit-any: any型の使用を禁止
- @typescript-eslint/no-unused-vars: 未使用変数の検出
- react-hooks/rules-of-hooks: Hooksのルールを強制

#### 品質基準

- **ESLintエラー・警告: 0件必須**
- **リンターが通らないコードはPR不可**

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

### Phase 0: 静的解析のみ（現在）

- **TypeScript** + **ESLint** + **Prettier** による品質保証
- 手動テストによる動作確認
- エラーハンドリングの目視確認

### Phase 1: 単体テスト導入

#### 対象

- **ユーティリティ関数**: 純粋関数の動作検証
- **カスタムフック**: React Hooksのロジック検証
- **APIクライアント**: HTTP通信の動作検証

#### ツール

- **Vitest**: 高速なテストランナー
- **@testing-library/react**: Reactコンポーネントテスト
- **MSW**: API モッキング

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

| 項目 | 基準 | 測定方法 |
|------|------|----------|
| TypeScriptエラー | 0件 | `pnpm type-check` |
| ESLintエラー・警告 | 0件 | `pnpm lint` |
| ビルド成功率 | 100% | `pnpm build` |

### 将来メトリクス（テスト導入後）

| 項目 | 目標 | 測定方法 |
|------|------|----------|
| テストカバレッジ | 80%以上 | Istanbul |
| テスト成功率 | 100% | CI/CD |
| パフォーマンス | Core Web Vitals | Lighthouse |

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

# 4. ビルド
pnpm build
```

### PR前チェック

```bash
# 一括品質チェック
pnpm quality-check

# または個別実行
pnpm codegen && pnpm type-check && pnpm lint && pnpm build
```

### CI/CD パイプライン

1. **依存関係インストール**
2. **コード生成**: `pnpm codegen`
3. **型チェック**: `pnpm type-check`
4. **リント**: `pnpm lint`
5. **テスト**: `pnpm test` (導入後)
6. **ビルド**: `pnpm build`
7. **デプロイ**: 本番環境へのデプロイ

---

## 🔧 ツール設定

### package.json スクリプト

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "quality-check": "pnpm type-check && pnpm lint && pnpm format:check"
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

- **[開発者ガイド](./developer-guide.md)** - 開発環境・コマンド
- **[コード規約](../styleguide/code-standards.md)** - コーディング標準
- **[貢献ガイド](../contrib/contribution-guide.md)** - PR・レビュー規約