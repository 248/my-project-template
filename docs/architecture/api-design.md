---
title: API設計・エンドポイント仕様
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# API設計・エンドポイント仕様

> OpenAPI仕様に基づく型安全API設計

## 🎯 設計原則

### 1. **OpenAPI First**

- **契約優先**: OpenAPI仕様を最初に定義
- **型安全性**: 自動生成による型安全なクライアント
- **ドキュメント化**: 仕様から自動生成されるドキュメント

### 2. **RESTful Design**

- **リソース指向**: 名詞ベースのURL設計
- **HTTPメソッド**: GET, POST, PUT, DELETE の適切な使用
- **ステータスコード**: 適切なHTTPステータスコードの返却

### 3. **認証・認可**

- **JWT認証**: Clerkによる認証トークン
- **認可制御**: リソースレベルでの権限チェック
- **セキュリティ**: 適切な入力検証とサニタイゼーション

## 📋 APIエンドポイント構成例

### 🔐 Authentication（認証）

```yaml
/api/auth:
  get:
    summary: 現在のユーザー情報取得
    security:
      - bearerAuth: []
    responses:
      200:
        description: ユーザー情報
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
```

### 👤 User Management（ユーザー管理）

```yaml
/api/users:
  get:
    summary: ユーザー一覧取得（管理者のみ）
    security:
      - bearerAuth: []
  post:
    summary: ユーザー作成
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateUserRequest'

/api/users/{id}:
  get:
    summary: ユーザー詳細取得
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
  put:
    summary: ユーザー情報更新
    security:
      - bearerAuth: []
  delete:
    summary: ユーザー削除
    security:
      - bearerAuth: []
```

### 📊 Data Resources（データリソース）

```yaml
/api/items:
  get:
    summary: アイテム一覧取得
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 10
  post:
    summary: アイテム作成
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateItemRequest'

/api/items/{id}:
  get:
    summary: アイテム詳細取得
  put:
    summary: アイテム更新
    security:
      - bearerAuth: []
  delete:
    summary: アイテム削除
    security:
      - bearerAuth: []
```

## 🔧 共通仕様

### レスポンス形式

```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

// エラーレスポンス
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// ページネーション
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### エラーハンドリング

| ステータス | 説明                  | 使用場面             |
| ---------- | --------------------- | -------------------- |
| 200        | OK                    | 正常な取得・更新     |
| 201        | Created               | リソースの作成       |
| 400        | Bad Request           | 不正なリクエスト     |
| 401        | Unauthorized          | 認証が必要           |
| 403        | Forbidden             | 権限不足             |
| 404        | Not Found             | リソースが存在しない |
| 500        | Internal Server Error | サーバー内部エラー   |

### 認証ヘッダー

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 📝 OpenAPI スキーマ例

```yaml
openapi: 3.0.3
info:
  title: Project API
  version: 1.0.0
  description: プロジェクトAPI仕様

servers:
  - url: http://localhost:8000/api
    description: 開発環境
  - url: https://api.example.com
    description: 本番環境

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
      required:
        - id
        - email
        - name

    CreateUserRequest:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
        password:
          type: string
          minLength: 8
      required:
        - email
        - name
        - password
```

## 🔄 開発ワークフロー

### OpenAPI First アプローチ

1. **OpenAPI仕様定義**: `contracts/openapi.yaml` を更新
2. **型生成**: `pnpm codegen` でクライアント・サーバー型を生成
3. **実装**: 生成された型を使用してAPI実装
4. **テスト**: APIテスト・契約テストの実行
5. **ドキュメント**: 自動生成されたドキュメントの確認

### Hono での実装方法

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

// 1. Zodスキーマ定義
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

// 2. OpenAPIルート定義
const app = new OpenAPIHono()

app.openapi(
  {
    method: 'get',
    path: '/api/users/{id}',
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: UserSchema,
          },
        },
        description: 'ユーザー詳細',
      },
    },
  },
  async c => {
    const { id } = c.req.valid('param')
    // 実装...
    return c.json({ id, name: 'User', email: 'user@example.com' })
  }
)

// 3. OpenAPI仕様生成
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
  },
})
```

## 🔗 関連ドキュメント

- [システム概要](./system-overview.md)
- [開発者ガイド](../handbook/developer-guide.md)
