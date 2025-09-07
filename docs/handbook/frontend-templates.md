---
title: フロントエンド実装テンプレート
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 📱 フロントエンド実装テンプレート

> **新ページ・コンポーネント追加のパターン集**：迷わない実装ガイド

## 🎯 このドキュメントの目的

- **ファイル配置場所**：どこに何を置くか明確化
- **実装パターン**：よくあるページ・コンポーネントのテンプレート
- **認証・レイアウト**：Next.js App Router での実装方式

**詳細な技術仕様**は [実装ガイドライン](../meta/implementation-guidelines.md) を併用してください。

---

## 📂 **ファイル配置ルール**

### ディレクトリ構造（再掲）

```
apps/frontend/src/
├── app/                    # 📍 Next.js App Router（ページ）
│   ├── (auth)/            # 📍 認証が必要なページグループ
│   ├── layout.tsx         # 📍 全体レイアウト
│   ├── page.tsx          # 📍 トップページ
│   └── [feature]/        # 📍 機能別ページ
├── components/           # 📍 再利用可能コンポーネント
│   ├── ui/              # 📍 プリミティブUI（Button, Input等）
│   └── feature/         # 📍 機能特化コンポーネント
├── hooks/               # 📍 カスタムフック
├── lib/                 # 📍 ユーティリティ・API関連
└── middleware.ts        # 📍 認証・ルーティング制御
```

### 配置の判断基準

| 作りたいもの                 | 配置場所                    | 理由                   |
| ---------------------------- | --------------------------- | ---------------------- |
| **新しいページ**             | `app/[feature]/page.tsx`    | Next.js App Router規約 |
| **ページ固有コンポーネント** | `app/[feature]/components/` | ページと密結合         |
| **再利用コンポーネント**     | `components/feature/`       | 複数ページで使用       |
| **汎用UIコンポーネント**     | `components/ui/`            | プリミティブな部品     |
| **カスタムフック**           | `hooks/`                    | ロジックの抽象化       |
| **API呼び出し**              | `lib/api/`                  | 通信ロジック集約       |

---

## 📄 **ページ実装パターン**

### パターン1: 静的ページ（認証不要）

**使用場面**: About、FAQ、利用規約など

**ファイル構成**:

```
apps/frontend/src/app/about/
├── page.tsx              # メインページ
└── components/          # ページ固有コンポーネント（任意）
    └── AboutSection.tsx
```

**テンプレート** (`page.tsx`):

```typescript
// apps/frontend/src/app/about/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About - Project Name',
  description: 'プロジェクトについての説明',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About</h1>
      {/* コンテンツ */}
    </div>
  )
}
```

### パターン2: 動的ページ（認証必要）

**使用場面**: Dashboard、プロフィール、設定など

**ファイル構成**:

```
apps/frontend/src/app/(auth)/dashboard/
├── layout.tsx           # ダッシュボード共通レイアウト
├── page.tsx            # メインダッシュボード
├── settings/           # サブページ
│   └── page.tsx
└── components/         # ページ固有コンポーネント
    ├── DashboardNav.tsx
    └── StatCard.tsx
```

**認証チェック**: `middleware.ts` で自動制御

**テンプレート** (`page.tsx`):

```typescript
// apps/frontend/src/app/(auth)/dashboard/page.tsx
import { auth } from '@clerk/nextjs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Project Name',
}

export default async function DashboardPage() {
  const { userId } = await auth()

  // Server Componentでのデータ取得
  // const data = await fetchDashboardData(userId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* コンテンツ */}
    </div>
  )
}
```

### パターン3: データ取得ページ（API連携）

**使用場面**: 一覧表示、詳細表示など

**ファイル構成**:

```
apps/frontend/src/app/items/
├── page.tsx                    # 一覧ページ
├── [id]/                      # 動的ルート
│   └── page.tsx               # 詳細ページ
├── components/
│   ├── ItemList.tsx          # 一覧コンポーネント
│   └── ItemCard.tsx          # アイテムカード
└── loading.tsx               # ローディングUI
```

**テンプレート** (`page.tsx`):

```typescript
// apps/frontend/src/app/items/page.tsx
import { Suspense } from 'react'
import { ItemList } from './components/ItemList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Items - Project Name',
}

export default function ItemsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Items</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ItemList />
      </Suspense>
    </div>
  )
}
```

### パターン4: パラメータ付きページ

**使用場面**: プロフィール表示、詳細ページなど

**ファイル配置**: `app/users/[id]/page.tsx`

**テンプレート**:

```typescript
// apps/frontend/src/app/users/[id]/page.tsx
import { notFound } from 'next/navigation'

interface UserPageProps {
  params: { id: string }
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = params

  // データ取得・存在チェック
  // if (!user) notFound()

  return (
    <div>
      <h1>User: {id}</h1>
      {/* ユーザー情報表示 */}
    </div>
  )
}
```

---

## 🧩 **コンポーネント実装パターン**

### パターン1: プリミティブUIコンポーネント

**配置**: `components/ui/[ComponentName].tsx`

**特徴**: 再利用性・汎用性重視

**テンプレート構造**:

```typescript
// components/ui/Button.tsx の構造例
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'default', ...props }: ButtonProps) {
  // 実装...
}
```

### パターン2: 機能特化コンポーネント

**配置**: `components/feature/[FeatureName].tsx`

**特徴**: 特定機能に特化、ビジネスロジック含む

**構造例**:

```typescript
// components/feature/UserProfile.tsx の構造例
interface UserProfileProps {
  userId: string
}

export function UserProfile({ userId }: UserProfileProps) {
  // データ取得・状態管理
  // ビジネスロジック実装
  // UI表示
}
```

### パターン3: フォームコンポーネント

**配置**: `components/feature/[FormName]Form.tsx`

**特徴**: バリデーション・送信処理含む

**構造パターン**:

- フォーム状態管理（useState/useForm）
- バリデーション（Zod schema使用）
- 送信処理（API呼び出し）
- エラー表示・成功フィードバック

---

## 🔗 **API連携パターン**

### データ取得の実装場所

| パターン             | 実装場所         | 使用場面                   |
| -------------------- | ---------------- | -------------------------- |
| **Server Component** | page.tsx内       | 初期表示データ・SEO重要    |
| **Client Component** | コンポーネント内 | ユーザーアクション後データ |
| **カスタムフック**   | hooks/           | 複数コンポーネントで再利用 |

### API呼び出しテンプレート

**Server Component での取得**:

```typescript
// app/items/page.tsx
async function getItems() {
  // API呼び出し
  // エラーハンドリング
  // 型安全な戻り値
}

export default async function ItemsPage() {
  const items = await getItems()
  return <ItemList items={items} />
}
```

**Client Component での取得**:

```typescript
// components/feature/DynamicItemList.tsx
'use client'

export function DynamicItemList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // API呼び出し・状態更新
  }, [])

  return /* JSX */
}
```

---

## 🛡️ **認証・権限制御パターン**

### 認証必要ページの実装

**方法1**: `(auth)` ルートグループ使用（推奨）

```
app/(auth)/          # 認証必要ページグループ
├── dashboard/
├── settings/
└── layout.tsx      # 認証チェック付きレイアウト
```

**方法2**: ページ毎の認証チェック

```typescript
// 各ページで個別にチェック
export default async function SecurePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return /* JSX */
}
```

### 権限別表示制御

```typescript
// components/feature/AdminPanel.tsx
export function AdminPanel() {
  const { user } = useUser()

  if (user?.publicMetadata?.role !== 'admin') {
    return <div>管理者権限が必要です</div>
  }

  return /* 管理者用UI */
}
```

---

## ✅ **実装チェックリスト**

### 新ページ追加時

- [ ] **ファイル配置**: 適切なディレクトリに配置
- [ ] **メタデータ**: title, description設定
- [ ] **型安全**: Props・状態に適切な型定義
- [ ] **エラーハンドリング**: loading.tsx, error.tsx考慮
- [ ] **アクセシビリティ**: セマンティックHTML使用
- [ ] **レスポンシブ**: モバイル対応確認

### コンポーネント追加時

- [ ] **再利用性**: 適切な抽象化レベル
- [ ] **Props設計**: 必要最小限・拡張可能
- [ ] **パフォーマンス**: 不要な再レンダリング回避
- [ ] **テスト**: 重要な機能にテスト追加

---

## 🔗 **関連ドキュメント**

- **[実装ガイドライン](../meta/implementation-guidelines.md)** - TypeScript詳細パターン
- **[コード規約](../styleguide/code-standards.md)** - 品質基準・型安全性
- **[テストガイド](./testing-guide.md)** - コンポーネントテスト方法

---

**💡 このテンプレート集は「どこに何を置くか」に焦点を当てています。具体的な実装詳細は既存コードを参考に、プロジェクトの規約に沿って実装してください。**
