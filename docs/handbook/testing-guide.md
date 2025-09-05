---
title: Vitestテスト実装ガイド
author: @claude
created: 2025-09-05
updated: 2025-09-05
status: published
---

# Vitestテスト実装ガイド

> 実装済みVitestテスト環境の使用方法と実践パターン

## 🚀 概要

このプロジェクトではVitestを使用した包括的なテスト環境を構築しています。React Testing Libraryとの統合により、コンポーネント・ユーティリティ・ツールの各レイヤーで品質保証を実現します。

---

## 🛠️ テスト環境構成

### 基本構成

```
project-root/
├── vitest.config.js          # Vitest基本設定
├── vitest.setup.js           # グローバルセットアップ
├── packages/ui/src/components/__tests__/     # UIコンポーネントテスト
├── apps/frontend/src/components/__tests__/   # フロントエンドコンポーネントテスト
├── apps/backend/src/**/__tests__/            # バックエンドテスト
└── tools/message-codegen/__tests__/          # ツールテスト
```

### 主要設定

#### vitest.config.js

- **環境**: jsdom（React DOM テスト用）
- **グローバル**: describe, it, expect を全域で利用可能
- **セットアップ**: vitest.setup.js で共通初期化
- **カバレッジ**: v8 provider、HTML/JSON/テキスト形式
- **エイリアス**: `@` → apps/frontend/src、API contracts解決

#### vitest.setup.js

- **DOM拡張**: @testing-library/jest-dom マッチャー
- **自動クリーンアップ**: テスト間でのモック・DOM状態リセット

---

## 🧪 テストパターン分類

### 1. UIコンポーネントテスト

**対象**: `packages/ui/src/components/__tests__/Button.test.tsx`（23テスト）

**主要テストポイント**:

- ✅ 基本レンダリング・Props検証
- ✅ バリアント・サイズ・状態別スタイル適用
- ✅ イベントハンドリング（onClick、disabled）
- ✅ アクセシビリティ（role、focus、keyboard）
- ✅ 組み合わせProps・境界値テスト

### 2. 非同期コンポーネントテスト

**対象**: `apps/frontend/src/components/__tests__/HealthCheckButton.test.tsx`（13テスト）

**主要テストポイント**:

- ✅ API モッキング (`vi.mock()`)
- ✅ 非同期処理待機 (`waitFor`)
- ✅ ローディング状態・エラーハンドリング
- ✅ Promise手動制御・状態遷移
- ✅ 複数実行パターン・エラー回復

### 3. ユーティリティ関数テスト

**対象**: `apps/backend/src/lib/__tests__/api-response.test.ts`（31テスト）

**主要テストポイント**:

- ✅ 純粋関数の入出力検証
- ✅ 複雑データ構造・ネストオブジェクト処理
- ✅ 環境変数による動作分岐 (`vi.stubEnv`)
- ✅ バリデーション・境界値・エッジケース
- ✅ 型安全性・discriminated union

### 4. コマンドラインツールテスト

**対象**: `tools/message-codegen/__tests__/add-message-utils.test.js`（43テスト）

**主要テストポイント**:

- ✅ 引数解析・コマンドパターン
- ✅ バリデーション（正常・異常）
- ✅ 配列・オブジェクト操作
- ✅ ファイルI/O・YAML処理
- ✅ エラーメッセージ・例外処理

---

## 📋 テストコマンド

### 基本実行

```bash
pnpm test              # 全テスト実行
pnpm test:watch        # ウォッチモード
pnpm test:ui           # UI付きテスト実行
pnpm test:coverage     # カバレッジ取得
```

### カテゴリ別実行

```bash
pnpm test:components   # UIコンポーネントのみ
pnpm test:backend      # バックエンドのみ
pnpm test:tools        # ツールのみ
```

### デバッグオプション

```bash
pnpm test --reporter=verbose                    # 詳細出力
pnpm test --bail=1                              # 初回失敗で停止
pnpm test Button.test.tsx --watch               # 特定ファイルをウォッチ
pnpm test --grep "should render"                # パターンマッチ
```

---

## 🎯 ベストプラクティス

### テストファイル構成

```typescript
describe('ComponentName', () => {
  describe('Basic Rendering', () => {
    // 基本レンダリング・Props
  })

  describe('User Interactions', () => {
    // イベント・状態変更
  })

  describe('Error Handling', () => {
    // エラー・境界値
  })
})
```

### 命名規則

- ✅ **Good**: `should render error message when API call fails`
- ❌ **Bad**: `should work`, `handles errors`

### モック戦略

- **API**: `vi.mock('@/lib/api')` でモジュール全体
- **関数**: `vi.fn()` で個別関数
- **環境変数**: `vi.stubEnv()` で環境分岐
- **Promise**: 手動制御でタイミング調整

### 非同期パターン

- **waitFor**: 状態変化待機
- **Promise制御**: ローディング状態テスト
- **setTimeout**: タイムアウト・遅延処理
- **cleanup**: テスト間状態リセット

---

## ⚠️ よくあるトラブル

### Timeoutエラー

```typescript
// タイムアウト延長
it('should handle slow API', async () => {
  /* */
}, 10000)
await waitFor(
  () => {
    /* */
  },
  { timeout: 10000 }
)
```

### DOM クリーンアップエラー

```typescript
// setup ファイルで自動設定済み
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

### Module解決エラー

```typescript
// vitest.config.js のalias確認
// または相対パス使用: vi.mock('../lib/api')
```

### React importエラー

```typescript
// 明示的import追加
import React from 'react'
```

---

## 📚 関連リソース

### 公式ドキュメント

- **[Vitest](https://vitest.dev/)** - テストフレームワーク
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Reactテストユーティリティ
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - DOMマッチャー拡張

### プロジェクト内実装例

- `packages/ui/src/components/__tests__/Button.test.tsx` - 基本コンポーネントテスト
- `apps/frontend/src/components/__tests__/HealthCheckButton.test.tsx` - 非同期・複雑テスト
- `apps/backend/src/lib/__tests__/api-response.test.ts` - ユーティリティ関数テスト
- `tools/message-codegen/__tests__/add-message-utils.test.js` - CLIツールテスト

### 関連ドキュメント

- **[テスト戦略](./testing-strategy.md)** - 全体戦略・品質方針
- **[開発者ガイド](./developer-guide.md)** - 開発環境・コマンド
- **[コード規約](../styleguide/code-standards.md)** - コーディング標準

---

**💡 このガイドは実装済みのテスト環境を最大限活用するための実践マニュアルです。新しいテストを追加する際の参考として活用してください。**
