---
title: 品質チェック実行ガイド
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 📊 品質チェック実行ガイド

> **PR前の品質確認を確実に実行**：迷わない品質チェック実践ガイド

## 🎯 このドキュメントの目的

- **段階的チェック**：品質チェックの正しい実行順序
- **エラー対処**：よくある問題の解決方法
- **自動化支援**：品質チェック実行支援ツールの使用方法

**詳細な品質基準**は [コード規約](../styleguide/code-standards.md) を併用してください。

---

## 🔄 **品質チェック基本フロー**

### ステップ1: 事前準備

```bash
# 最新の依存関係確保
pnpm install

# 作業ディレクトリの確認
pwd  # プロジェクトルートにいることを確認
```

### ステップ2: 型・スキーマ生成

```bash
# OpenAPI仕様からTypeScript型生成
pnpm codegen

# Prismaクライアント生成（DB使用時）
pnpm db:generate
```

### ステップ3: 品質チェック実行

```bash
# 型チェック
pnpm type-check

# コード品質チェック
pnpm lint

# フォーマット確認
pnpm format:check

# ビルド確認
pnpm build
```

### ステップ4: 結果確認・修正

各ステップでエラーが発生した場合は、[トラブルシューティング](#🛟-トラブルシューティング)を参照

---

## ⚡ **支援ツール使用方法**

### 自動品質チェックスクリプト

プロジェクトには品質チェック支援スクリプトが用意されています：

```bash
# 段階的品質チェック実行
node tools/quality-check.mjs
```

**スクリプトの特徴**:

- ✅ 各ステップを順番に実行
- ✅ エラー発生時に対処法を表示
- ✅ 継続可否を確認
- ✅ 結果をわかりやすくサマリー表示

### 個別コマンド実行

個別にチェックしたい場合：

```bash
# 型チェックのみ
pnpm type-check

# Lintのみ
pnpm lint

# ビルドのみ
pnpm build

# 一括実行（既存コマンド）
pnpm quality-check  # package.jsonで定義されている場合
```

---

## 🛟 **トラブルシューティング**

### ❌ **pnpm codegen 失敗**

#### よくある原因

- OpenAPI仕様ファイル（`packages/api-contracts/openapi.yaml`）の構文エラー
- 参照している`$ref`の定義不足
- 必須フィールドの未定義

#### 解決手順

```bash
# 1. OpenAPI仕様ファイルの確認
# packages/api-contracts/openapi.yaml の構文チェック

# 2. 詳細エラー表示で再実行
pnpm codegen --verbose

# 3. キャッシュクリアして再実行
rm -rf packages/api-contracts/codegen/ts/src/generated
pnpm codegen
```

#### チェックポイント

- [ ] YAML構文が正しい（インデント・コロン等）
- [ ] `$ref`で参照している`components/schemas`が存在する
- [ ] 必須プロパティ（`required`）が適切に定義されている

### ❌ **pnpm type-check 失敗**

#### よくある原因

- import文のパス誤り
- 型定義の不整合
- 自動生成ファイルの未更新

#### 解決手順

```bash
# 1. 自動生成ファイル更新
pnpm codegen && pnpm db:generate

# 2. 詳細エラー確認
pnpm type-check

# 3. 特定ファイルのチェック
npx tsc --noEmit path/to/file.ts
```

#### エラーメッセージ別対処法

| エラー                       | 対処法                               |
| ---------------------------- | ------------------------------------ |
| `Cannot find module`         | import文のパス確認・ファイル存在確認 |
| `Property does not exist`    | 型定義確認・自動生成ファイル更新     |
| `Type 'X' is not assignable` | 型の互換性確認・型ガード使用         |

### ❌ **pnpm lint 失敗**

#### よくある原因

- コードスタイル違反
- 未使用の変数・import
- ESLintルール違反

#### 解決手順

```bash
# 1. 自動修正を試す
pnpm lint:fix

# 2. 修正できない問題を確認
pnpm lint

# 3. 特定ファイルのチェック
npx eslint path/to/file.ts
```

#### よくあるESLintエラー対処法

```typescript
// ❌ 未使用変数
const unusedVariable = 'value'

// ✅ 削除またはアンダースコア接頭辞
const _unusedVariable = 'value'

// ❌ any型使用
function process(data: any) {}

// ✅ unknown型 + 型ガード使用
function process(data: unknown) {
  if (isValidData(data)) {
    // 型安全な処理
  }
}
```

### ❌ **pnpm format:check 失敗**

#### 解決手順

```bash
# 自動フォーマット適用
pnpm format

# フォーマット確認
pnpm format:check
```

### ❌ **pnpm build 失敗**

#### よくある原因

- 型チェック・Lint未通過
- 環境変数未設定
- 依存関係の問題

#### 解決手順

```bash
# 1. 事前チェック通過確認
pnpm type-check && pnpm lint

# 2. 環境変数確認
cat .env  # 必要な環境変数が設定されているか確認

# 3. 依存関係確認
pnpm install

# 4. キャッシュクリアして再ビルド
rm -rf .next dist
pnpm build
```

---

## ✅ **品質チェック完了チェックリスト**

### 必須確認項目

- [ ] **pnpm codegen** - 成功（差分なし）
- [ ] **pnpm type-check** - エラー0件
- [ ] **pnpm lint** - エラー・警告0件
- [ ] **pnpm format:check** - フォーマット済み
- [ ] **pnpm build** - ビルド成功

### 追加確認項目（推奨）

- [ ] **pnpm test** - 関連テスト通過（新機能がある場合）
- [ ] **動作確認** - ローカル環境での動作確認
- [ ] **ドキュメント** - 必要に応じてドキュメント更新

### PR作成前の最終確認

- [ ] **コミットメッセージ** - 説明的でConventional Commits準拠
- [ ] **変更内容** - 意図した変更のみがステージング済み
- [ ] **機密情報** - APIキー・パスワード等の機密情報が含まれていない

---

## 🚀 **CI/CD環境での品質チェック**

### GitHub Actions での確認

プロジェクトのCI/CDパイプラインでも品質チェックが実行されます：

1. **Pull Request作成時** - 自動で品質チェック実行
2. **ファイル変更push時** - 差分に対する品質チェック
3. **main branch merge時** - 最終品質チェック

### ローカル vs CI/CD の違い

| 項目         | ローカル   | CI/CD                    |
| ------------ | ---------- | ------------------------ |
| **実行速度** | 高速       | 中速（キャッシュ有効時） |
| **環境統一** | 開発者依存 | 統一環境                 |
| **デバッグ** | 容易       | ログ確認必要             |

**推奨**: ローカルで品質チェック通過後、PR作成

---

## 💡 **品質チェック効率化のコツ**

### 1. **エディタ設定活用**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

### 2. **Git Hooks活用**

プロジェクトに既にpre-commit hookが設定されている場合、コミット前に自動チェック実行されます。

### 3. **段階的チェック**

```bash
# まず軽いチェックから
pnpm type-check    # 高速
pnpm lint          # 中速
pnpm build         # 重い
```

### 4. **並列実行**

```bash
# 同時実行で時間短縮
pnpm type-check & pnpm lint & wait
```

---

## 🔗 **関連ドキュメント**

- **[コード規約](../styleguide/code-standards.md)** - 品質基準・Definition of Done
- **[貢献ガイドライン](../contrib/contribution-guide.md)** - PR作成・レビュー規約
- **[開発者ガイド](./developer-guide.md)** - 基本コマンド・開発手順
- **[実装ガイドライン](../meta/implementation-guidelines.md)** - TypeScript実装パターン

---

**💡 品質チェックは「PR前の最後の砦」です。確実に実行して、高品質なコードをチームに提供しましょう！**
