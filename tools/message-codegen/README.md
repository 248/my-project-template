# Message Code Generator

## 概要

メッセージレジストリ（`contracts/messages/registry.yaml`）から各言語向けのコード生成を行うツール。

## 機能

- TypeScript型定義の生成
- ローカライゼーションファイルの生成
- OpenAPIスキーマとの整合性チェック
- dry-runモードによる安全な動作確認

## 使用方法

### 基本的な使い方

```bash
# メッセージレジストリの検証
pnpm verify:messages

# TypeScript型定義の生成
node tools/message-codegen/generate.js

# dry-runモード（ファイルを変更せず動作確認）
node tools/message-codegen/generate.js --dry-run
```

### dry-runモード

`--dry-run`オプションを使用すると、実際のファイル生成を行わずに、何が生成されるかを確認できます。

#### 使用場面

1. **開発時の確認**
   - `registry.yaml`を編集した後、実際に生成される前に影響を確認
2. **CI/CDパイプライン**
   - テスト環境で生成処理が正常に動作するか検証
3. **デバッグ**
   - 問題調査時に副作用なしで動作確認
4. **権限不足の環境**
   - 書き込み権限がない環境での動作テスト

#### 実行例

```bash
$ node tools/message-codegen/generate.js --dry-run

🧪 Dry run mode: no files will be written
🚀 Starting multi-language message code generation...
============================================================

📋 Step 1: Verifying registry...
📄 Registry: contracts/messages/registry.yaml
📊 Registry version: 1.0.0
🌐 Supported languages: typescript, go
🏷️  Supported locales: ja, en, pseudo
  📁 auth: 4 messages
  📁 error: 6 messages
  📁 success: 3 messages
  📁 ui: 15 messages
  📁 action: 5 messages
  📁 validation: 5 messages
📈 Total messages: 38
🏷️  Namespaces: 6

🧪 Dry run summary:
   • Would generate TypeScript code at packages/shared/src/messages/keys.ts
   • Would process locale files
   • Would update OpenAPI schema at packages/api-contracts/openapi.yaml

============================================================
✨ Dry run completed for 38 messages across 6 namespaces
```

## テスト

```bash
# dry-runモードのテスト
node --test tools/message-codegen/__tests__/generate.dry-run.test.js

# 全テスト実行（今後追加予定）
node --test tools/message-codegen/__tests__/*.test.js
```

## 設定

設定は`tools/message-codegen/config.json`で管理されています。

- **targets**: 生成対象の言語と出力パス
- **openapi_integration**: OpenAPIスキーマとの連携設定
- **locales**: サポートするロケール

## トラブルシューティング

### ESLintエラー

`@template/eslint-plugin-message-keys`が見つからない場合は、プラグインのインストールを確認してください。

### 生成ファイルの不整合

`pnpm codegen`と併せて実行することで、API型定義との整合性を保てます。

```bash
# 推奨される実行順序
pnpm verify:messages
node tools/message-codegen/generate.js
pnpm codegen
```
