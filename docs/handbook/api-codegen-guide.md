---
title: API コード生成ガイド
author: team
created: 2025-08-28
updated: 2025-08-28
status: published
---

# API コード生成ガイド

> OpenAPI 仕様から TypeScript API クライアントを決定的に生成するためのガイド

## 🎯 概要

このプロジェクトでは、OpenAPI 仕様 (`contracts/openapi.yaml`) から型安全な API クライアントを自動生成しています。

### 特徴

✅ **決定的生成**: 固定バージョンで再現可能  
✅ **境界制御**: 型エラーを生成物に閉じ込め  
✅ **パッケージ化**: クリーンな依存関係  
✅ **自動生成**: `postinstall`/`prebuild` で自動実行

---

## 🏗️ アーキテクチャ

### ファイル構成

```
packages/shared/api-client/
├── src/
│   ├── generated/              # 🚫 .gitignore 除外（自動生成）
│   │   ├── types.ts           # TypeScript型定義
│   │   ├── schemas.ts         # Zodバリデーションスキーマ
│   │   └── client.ts          # 型安全APIクライアント
│   ├── index.ts               # 🎯 境界ラッパ（公開面制御）
│   ├── package.json
│   └── tsconfig.json
└── tools/codegen/
    └── generate-ts-client.mjs  # 決定的生成スクリプト
```

### 生成フロー

1. **OpenAPI 仕様** (`contracts/openapi.yaml`)
2. **決定的生成** (`pnpm codegen`)
   - 固定バージョンのコード生成ツール使用
   - 環境変数で出力先制御
3. **境界ラッパ** (`packages/shared/api-client/src/index.ts`)
   - 必要な型・APIのみ公開
   - カスタムエラー型・型ガード追加
4. **アプリでの利用**
   ```typescript
   import { api, User, ApiError } from '@project/api-client'
   ```

---

## 🚀 使用方法

### 基本コマンド

```bash
# 推奨：決定的生成（packages/shared/api-client）
pnpm codegen
```

### 自動生成タイミング

```bash
# 依存関係インストール後
pnpm install  # → pnpm postinstall → pnpm codegen

# ビルド前
pnpm build    # → pnpm prebuild → pnpm codegen
```

### API 使用例

```typescript
import {
  api,
  User,
  isUser,
  ApiValidationError,
} from '@project/api-client'

try {
  // 型安全な API 呼び出し
  const user: User = await api.getUserProfile()

  // 型ガード使用
  if (isUser(someData)) {
    console.log(someData.username)
  }
} catch (error) {
  if (error instanceof ApiValidationError) {
    console.error('バリデーションエラー:', error.details)
  }
}
```

---

## ⚙️ 設定・カスタマイズ

### 生成器設定

生成スクリプト (`tools/codegen/generate-ts-client.mjs`) で制御:

```javascript
// 固定化されたバージョンで決定的な生成を保証
const OPENAPI_TYPESCRIPT_VERSION = '7.4.2'

// 出力先設定
const OUTPUT_BASE = 'packages/shared/api-client/src/generated'
```

### ESLint 除外設定

`.eslintrc.cjs` で生成物を型チェックから除外:

```javascript
{
  files: ['packages/shared/api-client/src/generated/**/*'],
  parser: 'espree',
  parserOptions: { project: null },
  rules: {
    // 生成物なので全てのルールを緩和
    '@typescript-eslint/no-explicit-any': 'off',
    // ...
  },
}
```

### TypeScript 設定

`packages/shared/api-client/tsconfig.json`:

```json
{
  "exclude": ["src/generated/**/*"]
}
```

---

## 🛟 トラブルシューティング

### よくある問題

| 問題             | 原因                 | 解決策                                                        |
| ---------------- | -------------------- | ------------------------------------------------------------- |
| 生成が失敗する   | OpenAPI 仕様エラー   | `contracts/openapi.yaml` を修正                               |
| 型エラーが出る   | 境界ラッパの型不一致 | `src/index.ts` の型定義を調整                                 |
| 古い生成物が残る | Git キャッシュ       | `git rm --cached -r packages/shared/api-client/src/generated` |
| ビルドが遅い     | 毎回生成される       | `.gitignore` 設定を確認                                       |

### デバッグコマンド

```bash
# 1. 生成物をクリア
rm -rf packages/shared/api-client/src/generated

# 2. 決定的生成を実行
pnpm codegen

# 3. 型チェック
pnpm type-check

# 4. ビルドテスト
pnpm build
```

---

## 📋 ベストプラクティス

### DO ✅

- `pnpm codegen` を使用（決定的生成）
- 境界ラッパ経由でのみAPI使用
- 型ガードでランタイム検証
- OpenAPI仕様の変更時は両方のビルドをテスト

### DON'T ❌

- `generated/` 配下を直接編集
- 生成物を git にコミット
- 境界ラッパを迂回した直接インポート
- 生成器バージョンの勝手な変更

### 境界ラッパのパターン

```typescript
// 公開面を限定
export type { User } from './generated/schemas'  // ✅ 必要な型のみ

// カスタムエラー型を追加
export class ApiValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
  }
}

// 型ガードを提供
export function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'username' in data
}

// 拡張APIメソッド
export const safeApi = {
  async callWithValidation<T>(...) { /* enhanced error handling */ }
}
```

---

## 🔗 関連ドキュメント

- **[開発者ガイド](./developer-guide.md)** - 基本コマンド・セットアップ
- **[システム概要](../architecture/system-overview.md)** - アーキテクチャ全体
- **[コード規約](../styleguide/code-standards.md)** - 品質基準
- **[API 仕様](../../contracts/openapi.yaml)** - OpenAPI 仕様書

---

## 📝 参考情報

### 使用ツール

- **[openapi-typescript](https://github.com/drwpow/openapi-typescript)** - OpenAPI → TypeScript 型生成
- **[openapi-fetch](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch)** - 型安全 fetch クライアント
- **[Zod](https://zod.dev/)** - ランタイムバリデーション

### 設計方針

この実装は以下の原則に基づいています:

- **決定的生成**: 生成物をコミット対象外とし、決定的再生成を実現
- **境界制御**: 型エラーを生成物内に封じ込め
- **開発体験**: 軽い開発体験 + 人間レビュー可能PR + 型安全性を実現