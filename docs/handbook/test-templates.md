---
title: 新機能テスト追加テンプレート
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 🧪 新機能テスト追加テンプレート

> **実装した機能にテストを追加する実践ガイド**：迷わない機能別テストパターン

## 🎯 このドキュメントの目的

- **テスト追加手順**：新機能実装後のテスト追加方法
- **ファイル配置**：テストファイルの配置ルール
- **実装パターン**：機能別のテストテンプレート

**テスト環境詳細**は [Vitestテスト実装ガイド](./testing-guide.md) を併用してください。

---

## 📂 **テストファイル配置ルール**

### ディレクトリ構造

```
project-root/
├── packages/ui/src/components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx           # UIコンポーネントテスト
├── apps/frontend/src/components/
│   ├── UserProfile.tsx
│   └── __tests__/
│       └── UserProfile.test.tsx      # フロントエンドコンポーネントテスト
├── apps/backend/src/
│   ├── routes/
│   │   ├── items.ts
│   │   └── __tests__/
│   │       └── items.test.ts         # APIルートテスト
│   └── lib/
│       ├── utils.ts
│       └── __tests__/
│           └── utils.test.ts         # ユーティリティ関数テスト
└── tools/[tool-name]/
    ├── script.js
    └── __tests__/
        └── script.test.js            # ツール・スクリプトテスト
```

### 配置の判断基準

| 実装した機能           | テストファイル配置            | 理由                         |
| ---------------------- | ----------------------------- | ---------------------------- |
| **UIコンポーネント**   | `同一ディレクトリ/__tests__/` | コンポーネントとテストの近接 |
| **APIルート**          | `routes/__tests__/`           | ルートファイルとテストの近接 |
| **ユーティリティ関数** | `同一ディレクトリ/__tests__/` | 関数とテストの近接           |
| **カスタムフック**     | `hooks/__tests__/`            | フック専用テスト             |
| **サービス層**         | `services/__tests__/`         | ビジネスロジックテスト       |

---

## 🎨 **フロントエンド機能のテストパターン**

### パターン1: 基本UIコンポーネント

**対象**: Button, Input, Card などのプリミティブコンポーネント

**ファイル**: `packages/ui/src/components/__tests__/[Component].test.tsx`

**テンプレート構造**:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('default-class')
    })

    it('should render different variants', () => {
      render(<Button variant="primary">Primary</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('primary-class')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focus me</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})
```

**チェックポイント**:

- [ ] 基本レンダリング
- [ ] Props別の表示確認
- [ ] イベントハンドラ動作
- [ ] disabled状態の動作
- [ ] アクセシビリティ（focus, role, aria-\*）

### パターン2: API連携コンポーネント

**対象**: データ取得・表示を行うコンポーネント

**ファイル**: `apps/frontend/src/components/__tests__/[Component].test.tsx`

**テンプレート構造**:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UserProfile } from '../UserProfile'

// API関数をモック
vi.mock('@/lib/api', () => ({
  getUserById: vi.fn(),
}))

import { getUserById } from '@/lib/api'

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      vi.mocked(getUserById).mockImplementation(() => new Promise(() => {})) // 永続化Promise

      render(<UserProfile userId="123" />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should display user data after loading', async () => {
      const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com' }
      vi.mocked(getUserById).mockResolvedValue(mockUser)

      render(<UserProfile userId="123" />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })

      expect(getUserById).toHaveBeenCalledWith('123')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(getUserById).mockRejectedValue(new Error('API Error'))

      render(<UserProfile userId="123" />)

      await waitFor(() => {
        expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty user data', async () => {
      vi.mocked(getUserById).mockResolvedValue(null)

      render(<UserProfile userId="123" />)

      await waitFor(() => {
        expect(screen.getByText('ユーザーが見つかりません')).toBeInTheDocument()
      })
    })
  })
})
```

**チェックポイント**:

- [ ] ローディング状態の表示
- [ ] 正常データの表示
- [ ] エラー状態の表示
- [ ] 空データの処理
- [ ] API呼び出しパラメータ確認

### パターン3: フォームコンポーネント

**対象**: ユーザー入力を処理するコンポーネント

**テンプレート構造**:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '../ContactForm'

describe('ContactForm', () => {
  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<ContactForm onSubmit={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: '送信' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('名前は必須です')).toBeInTheDocument()
        expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<ContactForm onSubmit={vi.fn()} />)

      const emailInput = screen.getByLabelText('メールアドレス')
      await user.type(emailInput, 'invalid-email')
      await user.tab() // フォーカス移動でバリデーション実行

      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<ContactForm onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText('名前'), 'John Doe')
      await user.type(screen.getByLabelText('メールアドレス'), 'john@example.com')
      await user.type(screen.getByLabelText('メッセージ'), 'Hello, world!')
      await user.click(screen.getByRole('button', { name: '送信' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, world!',
        })
      })
    })
  })
})
```

**チェックポイント**:

- [ ] バリデーションエラー表示
- [ ] 正常送信時の動作
- [ ] フォームリセット
- [ ] 送信中の状態管理

---

## 🔧 **バックエンド機能のテストパターン**

### パターン1: APIエンドポイント

**対象**: 実装したAPIルート

**ファイル**: `apps/backend/src/routes/__tests__/[route].test.ts`

**テンプレート構造**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '../items'

// サービス層をモック
vi.mock('../services/itemService', () => ({
  getItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

import * as itemService from '../services/itemService'

describe('Items API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/items', () => {
    it('should return items list with pagination', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Item 1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Item 2',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ]
      vi.mocked(itemService.getItems).mockResolvedValue({
        data: mockItems,
        total: 2,
      })

      const response = await request(app)
        .get('/api/items?page=1&limit=10')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })

      expect(itemService.getItems).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/items?page=invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('バリデーションエラー')
    })
  })

  describe('POST /api/items', () => {
    it('should create new item with valid data', async () => {
      const newItem = {
        id: '123',
        title: 'New Item',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(itemService.createItem).mockResolvedValue(newItem)

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'New Item', description: 'Description' })
        .expect(201)

      expect(response.body).toEqual(newItem)
      expect(itemService.createItem).toHaveBeenCalledWith(
        { title: 'New Item', description: 'Description' },
        expect.any(String) // user ID
      )
    })

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ title: 'New Item' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('認証')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer valid-token')
        .send({}) // 必須フィールドなし
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })
})
```

**チェックポイント**:

- [ ] 正常レスポンスの確認
- [ ] バリデーションエラーの処理
- [ ] 認証・認可の確認
- [ ] エラーステータスコード
- [ ] サービス層の呼び出し確認

### パターン2: ユーティリティ関数

**対象**: 純粋関数・ヘルパー関数

**ファイル**: `apps/backend/src/lib/__tests__/[util].test.ts`

**テンプレート構造**:

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, validateEmail, calculatePagination } from '../utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T12:30:00Z')
      const result = formatDate(date)

      expect(result).toBe('2024-01-15T12:30:00.000Z')
    })

    it('should handle invalid date', () => {
      const result = formatDate(new Date('invalid'))

      expect(result).toBe(null)
    })
  })

  describe('validateEmail', () => {
    it.each([
      ['valid@example.com', true],
      ['user.name@domain.co.jp', true],
      ['invalid-email', false],
      ['@example.com', false],
      ['user@', false],
    ])('should validate "%s" as %s', (email, expected) => {
      expect(validateEmail(email)).toBe(expected)
    })
  })

  describe('calculatePagination', () => {
    it('should calculate pagination correctly', () => {
      const result = calculatePagination({ page: 2, limit: 10, total: 25 })

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      })
    })

    it('should handle edge cases', () => {
      const result = calculatePagination({ page: 1, limit: 10, total: 0 })

      expect(result.totalPages).toBe(0)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
    })
  })
})
```

**チェックポイント**:

- [ ] 正常系の動作確認
- [ ] 境界値テスト
- [ ] 異常系・エラーハンドリング
- [ ] 複数パターンのテスト

---

## ⚡ **テスト実行・管理パターン**

### テスト実行コマンド

```bash
# 新しく追加したテストのみ実行
pnpm test Button.test.tsx

# 関連テストをウォッチモード実行
pnpm test:watch UserProfile

# カバレッジ取得
pnpm test:coverage

# 特定のテストパターンのみ実行
pnpm test --grep "should validate"
```

### デバッグパターン

```typescript
// テスト内でのデバッグ
describe('Component', () => {
  it('should work', () => {
    render(<Component />)

    // DOM構造確認
    screen.debug()

    // 特定要素確認
    const element = screen.getByRole('button')
    console.log(element.outerHTML)

    // 期待値確認
    expect(element).toBeInTheDocument()
  })
})
```

### モック管理パターン

```typescript
// グローバルモック（全テストで共通）
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(),
}))

// テスト毎のモック設定
beforeEach(() => {
  vi.mocked(fetchData).mockResolvedValue(mockData)
})

// 個別テスト用モック上書き
it('should handle error', () => {
  vi.mocked(fetchData).mockRejectedValue(new Error('API Error'))
  // テスト実行
})
```

---

## ✅ **テスト追加チェックリスト**

### 実装完了後

- [ ] **テストファイル作成**: `__tests__/` ディレクトリに適切に配置
- [ ] **基本テスト**: 正常系の動作確認
- [ ] **エラーハンドリング**: 異常系の動作確認
- [ ] **境界値テスト**: エッジケースの確認

### 実行確認

- [ ] **テスト実行**: `pnpm test [ファイル名]` で成功
- [ ] **カバレッジ**: 重要な処理がテストでカバーされている
- [ ] **CI/CD**: 全テストスイートの実行確認

### 品質確認

- [ ] **テストの意図**: テスト名から期待動作が明確
- [ ] **独立性**: 各テストが独立して実行可能
- [ ] **保守性**: テストコードの可読性・メンテナンス性

---

## 🔗 **関連ドキュメント**

- **[Vitestテスト実装ガイド](./testing-guide.md)** - テスト環境・実装詳細
- **[フロントエンドテンプレート](./frontend-templates.md)** - コンポーネント実装パターン
- **[バックエンドテンプレート](./backend-templates.md)** - API実装パターン
- **[コード規約](../styleguide/code-standards.md)** - 品質基準・テスト要件

---

**💡 このテンプレート集は「実装した機能にテストを追加する方法」に焦点を当てています。既存のテスト実装例も参考にしながら、プロジェクトのテスト方針に沿ってテストを追加してください。**
