---
title: コード規約・品質基準
author: core-team
created: 2025-08-28
updated: 2025-08-28
status: published
---

# コード規約・品質基準

> AI Agent SNS プロジェクトでの型安全性・設計指針・品質要件

## 🎯 基本設計指針

### 型安全性ファースト

- **OpenAPI仕様から自動生成された型・スキーマを使用**（手動型定義禁止）
- **any 型完全禁止** - `unknown` 型で置換し、型ガードで安全に変換
- **型アサーション → 型ガード** - ランタイム安全性を確保

### アーキテクチャ層分離

- **API型 ↔ DB型 ↔ UI型**を**層で分離**し、変換関数を1箇所に集約
- **境界層での適切な制約** - アーキテクチャ層ごとの型制約設定

---

## 🔧 実装パターン

### ✅ 推奨パターン

#### 1. 型ガードによる安全な型変換

```typescript
// ❌ 型アサーション（非推奨）
const result = data as SomeType

// ✅ 型ガードによる安全な変換
function isSomeType(data: unknown): data is SomeType {
  return typeof data === 'object' && data !== null && 'expectedProperty' in data
}

if (isSomeType(data)) {
  // data は SomeType として安全に使用可能
}
```

#### 2. 環境変数の型安全なアクセス

```typescript
// ❌ TypeScript 5.x で警告が出るパターン
process.env.NEXT_PUBLIC_API_URL

// ✅ 推奨パターン
process.env['NEXT_PUBLIC_API_URL']
```

#### 3. Zod スキーマ活用

```typescript
// boundary 層での外部データ変換
export function parseJsonWith<T extends z.ZodTypeAny>(
  schema: T,
  json: string
): z.infer<T> {
  const data: unknown = JSON.parse(json)
  return schema.parse(data) // Zod が自動で型推論
}
```

### 🚫 禁止パターン

#### 1. any 型の使用

```typescript
// ❌ 絶対禁止
function processData(data: any) {
  return data.something
}

// ✅ unknown で受け取り、型ガードで安全に処理
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.something
  }
  throw new Error('Invalid data')
}
```

#### 2. 型アサーション乱用

```typescript
// ❌ ランタイム安全性なし
const result = response.data as ApiResponse

// ✅ スキーマ検証付き
const result = ApiResponseSchema.parse(response.data)
```

---

## 📋 品質要件

### 🔧 技術要件

- **型生成**: `pnpm generate:all` **成功**（OpenAPI仕様変更時）
- **型チェック**: `pnpm type-check` **成功**（エラー0件必須）
- **Lint/Format**: `pnpm lint` **成功**（警告0件必須、Prettier整形済み）
- **ビルド**: `pnpm build` **成功**（本番環境対応確認）
- **テスト**: 該当する場合、差分に対する**最低1つ**のテスト追加

### 📋 品質基準

- **型安全性**: 手動型定義なし、自動生成型・スキーマ使用確認
- **セキュリティ**: 機密情報のログ出力なし、入力検証実装
- **パフォーマンス**: 不要な再レンダリング・N+1クエリなし
- **アクセシビリティ**: WCAG 2.1 AA準拠（該当コンポーネント）

---

## 🏗️ ログ・エラーハンドリング

### 構造化ログ

- **Pino使用**: サーバは `stdout(JSON)`、クライアントは `console`
- **機密情報マスキング**: ユーザー情報・APIキー・パスワード等をログ出力しない

### エラーハンドリング

- **失敗パターン**: `Result`/`Either` 風または `try/catch` + 構造化エラー
- **AI API制限**: OpenAI API呼び出しは適切なエラーハンドリング・レート制限対応必須

---

## 🧪 テスト戦略

### テスト方針

- **ユニット**: 入出力の**境界**をテスト
- **コンポーネント**: 目に見える結果（DOM/アクセシビリティ）を検証
- **モック**: **最小限**、I/Oと時間依存はラップして差し替え可能に

### パフォーマンス

- **不要な再レンダリング**を避け、重い処理は非同期/キャッシュ
- **セキュリティ**: 入力検証（Zod等）、機密値はログしない、依存は定期的に `pnpm audit`

---

## 🚫 自動生成ファイル（手動編集禁止）

以下のファイルは OpenAPI 仕様から自動生成されるため、**手動編集禁止**:

- `packages/shared/api-client/src/generated/types.ts` - OpenAPIからの型定義
- `packages/shared/api-client/src/generated/schemas.ts` - Zodスキーマ
- `packages/shared/api-client/src/generated/client.ts` - 型安全APIクライアント

### 変更手順

1. `contracts/openapi.yaml` の OpenAPI 仕様を更新
2. `pnpm generate:all` で自動生成
3. 型チェック・Lintを通す

---

## 💯 Definition of Done チェックリスト

### 必須項目

- [ ] `pnpm type-check` - エラー0件
- [ ] `pnpm lint` - エラー・警告0件
- [ ] `pnpm format:check` - Prettier整形済み
- [ ] `pnpm build` - ビルド成功
- [ ] 差分に対する最低1つのテスト（該当する場合）

### ドキュメント要件

- [ ] **仕様書更新**: 要件・設計・タスクの該当箇所を更新
- [ ] **API仕様**: エンドポイント変更時はOpenAPI仕様を更新
- [ ] **README**: 新機能・セットアップ手順の変更を反映

---

## 🔗 関連ドキュメント

- **[開発者ガイド](../handbook/developer-guide.md)** - セットアップ・コマンド
- **[貢献ガイドライン](../contrib/contribution-guide.md)** - PR規約・レビュー観点
- **[実装ガイドライン](../meta/implementation-guidelines.md)** - 詳細な実装パターン
