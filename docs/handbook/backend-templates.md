---
title: バックエンドAPI実装テンプレート
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 🔧 バックエンドAPI実装テンプレート

> **新APIエンドポイント追加のパターン集**：OpenAPI First開発の実践ガイド

## 🎯 このドキュメントの目的

- **実装の流れ**：OpenAPI仕様→型生成→実装の順序明確化
- **ファイル配置**：どこに何を追加するかの具体的指針
- **実装パターン**：よくあるAPIパターンのテンプレート

**詳細な設計思想**は [API設計ガイド](../architecture/api-design.md) と [実装ガイドライン](../meta/implementation-guidelines.md) を併用してください。

---

## 🔄 **API実装の基本フロー**

### ステップ1: OpenAPI仕様定義

```
packages/api-contracts/openapi.yaml を編集
```

### ステップ2: 型生成

```bash
pnpm codegen  # TypeScript型・Zodスキーマ生成
```

### ステップ3: 実装

```
apps/backend/src/routes/[feature].ts を作成
```

### ステップ4: 登録

```
apps/backend/src/index.ts にルート登録
```

### ステップ5: 品質確認

```bash
pnpm type-check && pnpm lint && pnpm build
```

---

## 📂 **バックエンドファイル構造**

### ディレクトリ構造（再掲）

```
apps/backend/src/
├── config/              # 📍 設定管理
├── container/           # 📍 依存性注入コンテナ
├── interfaces/          # 📍 インターフェース定義
├── middleware/          # 📍 認証・CORS・ログ等
├── routes/             # 📍 APIルート実装
│   ├── auth.ts         # 📍 認証関連API
│   ├── users.ts        # 📍 ユーザー管理API
│   └── [feature].ts    # 📍 機能別API
├── services/           # 📍 ビジネスロジック
├── utils/             # 📍 ユーティリティ関数
└── index.ts          # 📍 アプリケーションエントリポイント
```

### ファイルの役割分担

| ファイル種別                | 責務                               | 配置ルール           |
| --------------------------- | ---------------------------------- | -------------------- |
| **routes/[feature].ts**     | HTTPリクエスト処理・バリデーション | 機能別にファイル分割 |
| **services/[feature].ts**   | ビジネスロジック・外部連携         | ルートから分離       |
| **interfaces/[feature].ts** | 型定義・サービス契約               | 依存性注入用         |
| **middleware/[name].ts**    | 横断関心事（認証・ログ等）         | 機能横断で再利用     |

---

## 🌟 **OpenAPI仕様定義パターン**

### パターン1: 基本CRUD API

**使用場面**: ユーザー管理、アイテム管理など

**OpenAPI定義例** (`packages/api-contracts/openapi.yaml`):

```yaml
paths:
  /api/items:
    get:
      tags: [Items]
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
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ItemListResponse'
    post:
      tags: [Items]
      summary: アイテム作成
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateItemRequest'
      responses:
        201:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'

  /api/items/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      tags: [Items]
      summary: アイテム詳細取得
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
        404:
          $ref: '#/components/responses/NotFound'
    put:
      tags: [Items]
      summary: アイテム更新
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateItemRequest'
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
    delete:
      tags: [Items]
      summary: アイテム削除
      security:
        - bearerAuth: []
      responses:
        204:
          description: 削除成功
```

**スキーマ定義例**:

```yaml
components:
  schemas:
    Item:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
      required: [id, title, createdAt, updatedAt]

    CreateItemRequest:
      type: object
      properties:
        title:
          type: string
          minLength: 1
        description:
          type: string
      required: [title]

    UpdateItemRequest:
      type: object
      properties:
        title:
          type: string
          minLength: 1
        description:
          type: string

    ItemListResponse:
      type: object
      properties:
        success:
          type: boolean
          const: true
        data:
          type: array
          items:
            $ref: '#/components/schemas/Item'
        pagination:
          $ref: '#/components/schemas/PaginationInfo'
      required: [success, data, pagination]
```

### パターン2: 認証必要API

**使用場面**: プロフィール更新、プライベートデータ操作

**OpenAPI定義のポイント**:

```yaml
security:
  - bearerAuth: []

responses:
  401:
    $ref: '#/components/responses/Unauthorized'
  403:
    $ref: '#/components/responses/Forbidden'
```

### パターン3: ファイルアップロードAPI

**使用場面**: 画像アップロード、ドキュメント管理

**OpenAPI定義例**:

```yaml
/api/upload:
  post:
    tags: [Upload]
    summary: ファイルアップロード
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary
              category:
                type: string
                enum: [avatar, document, image]
    responses:
      201:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UploadResponse'
```

---

## 🛠️ **ルート実装パターン**

### パターン1: 基本CRUDルート

**ファイル**: `apps/backend/src/routes/items.ts`

**実装構造**:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

// 1. Zodスキーマ定義（OpenAPI仕様と同期）
const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const CreateItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
})

const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

// 2. ルート定義
const app = new OpenAPIHono()

// GET /api/items - 一覧取得
app.openapi(
  {
    method: 'get',
    path: '/api/items',
    request: {
      query: z.object({
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.array(ItemSchema),
              pagination: PaginationSchema,
            }),
          },
        },
        description: 'アイテム一覧',
      },
    },
  },
  async (c) => {
    const { page, limit } = c.req.valid('query')

    // ビジネスロジック（サービス層呼び出し）
    // const items = await itemService.getItems({ page, limit })

    return c.json({
      success: true,
      data: [], // items,
      pagination: { page, limit, total: 0, totalPages: 0 },
    })
  }
)

// POST /api/items - 作成
app.openapi(
  {
    method: 'post',
    path: '/api/items',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateItemSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: ItemSchema,
          },
        },
        description: 'アイテム作成成功',
      },
    },
    security: [{ bearerAuth: [] }],
  },
  async (c) => {
    const data = c.req.valid('json')

    // 認証チェック
    // const user = await getAuthenticatedUser(c)

    // ビジネスロジック
    // const item = await itemService.createItem(data, user.id)

    return c.json(/* item */, 201)
  }
)

export default app
```

### パターン2: 認証付きルート

**認証チェック実装**:

```typescript
// middleware/auth.ts の使用例
import { authMiddleware } from '../middleware/auth'

app.use('/api/private/*', authMiddleware)

app.openapi(
  {
    path: '/api/private/profile',
    // ...
  },
  async c => {
    // c.get('user') で認証ユーザー取得可能
    const user = c.get('user')
    return c.json(user)
  }
)
```

### パターン3: エラーハンドリングパターン

**統一エラーレスポンス**:

```typescript
// エラーハンドリング例
app.openapi(/* ... */, async (c) => {
  try {
    // ビジネスロジック
    const result = await someService.operation()

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    // 注: ValidationErrorやNotFoundErrorは、プロジェクトで定義するカスタムエラーの例です
    if (error instanceof ValidationError) {
      return c.json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.details,
      }, 400)
    }

    if (error instanceof NotFoundError) {
      return c.json({
        success: false,
        message: 'リソースが見つかりません',
      }, 404)
    }

    // 予期しないエラー
    console.error('Unexpected error:', error)
    return c.json({
      success: false,
      message: '内部サーバーエラー',
    }, 500)
  }
})
```

---

## 🔌 **ルート登録パターン**

### メインアプリケーションへの登録

**ファイル**: `apps/backend/src/index.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// ルートインポート
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import itemRoutes from './routes/items' // 追加

const app = new Hono()

// ミドルウェア設定
app.use('*', logger())
app.use('*', cors())

// ルート登録
app.route('/', authRoutes)
app.route('/', userRoutes)
app.route('/', itemRoutes) // 追加

// ヘルスチェック
app.get('/health', c => c.json({ status: 'ok' }))

export default app
```

---

## 🧪 **テスト実装パターン**

### APIエンドポイントテスト

**ファイル**: `apps/backend/src/routes/__tests__/items.test.ts`

**テスト構造**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../items'

describe('Items API', () => {
  describe('GET /api/items', () => {
    it('should return items list', async () => {
      const response = await request(app).get('/api/items').expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
    })

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/items?page=2&limit=5')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(5)
    })
  })

  describe('POST /api/items', () => {
    it('should create new item', async () => {
      const itemData = {
        title: 'Test Item',
        description: 'Test Description',
      }

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer valid-token')
        .send(itemData)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe(itemData.title)
    })

    it('should return 401 without authorization', async () => {
      await request(app).post('/api/items').send({ title: 'Test' }).expect(401)
    })
  })
})
```

---

## ✅ **実装チェックリスト**

### OpenAPI仕様定義時

- [ ] **パス設計**: RESTful な命名規約
- [ ] **メソッド選択**: GET/POST/PUT/DELETE 適切な使用
- [ ] **スキーマ定義**: 入力・出力の型定義
- [ ] **セキュリティ**: 認証が必要なエンドポイントにsecurity設定
- [ ] **エラーレスポンス**: 400, 401, 403, 404, 500の定義

### ルート実装時

- [ ] **バリデーション**: Zodスキーマでの入力検証
- [ ] **認証チェック**: 必要なエンドポイントで認証確認
- [ ] **エラーハンドリング**: try-catch による適切なエラー処理
- [ ] **ログ出力**: 重要な処理でのログ記録
- [ ] **型安全**: TypeScript の型チェック通過

### 品質確認時

- [ ] **型生成**: `pnpm codegen` で型更新
- [ ] **型チェック**: `pnpm type-check` 成功
- [ ] **Lint**: `pnpm lint` 成功
- [ ] **ビルド**: `pnpm build` 成功
- [ ] **テスト**: 主要なエンドポイントにテスト追加

---

## 🔗 **関連ドキュメント**

- **[API設計ガイド](../architecture/api-design.md)** - OpenAPI仕様設計の詳細
- **[実装ガイドライン](../meta/implementation-guidelines.md)** - サーバー側実装パターン
- **[API コード生成ガイド](./api-codegen-guide.md)** - 型生成の詳細手順
- **[テストガイド](./testing-guide.md)** - バックエンドテスト実装

---

**💡 このテンプレート集は「どのファイルを編集するか」「どの順序で実装するか」に焦点を当てています。具体的な実装詳細は既存のサービス実装を参考に、プロジェクトのアーキテクチャに沿って実装してください。**
