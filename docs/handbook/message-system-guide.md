# MessageKey システム開発者ガイド

> **Phase 4-6完了**: メッセージ外部化・開発者体験向上・英語対応システム  
> **更新日**: 2025-09-05  
> **対象**: プロジェクト開発者全員

---

## 🎯 概要

このプロジェクトではハードコードメッセージを完全に排除し、**MessageKey**ベースの統一メッセージシステムを導入しました。型安全・多言語対応・保守性向上を実現した次世代メッセージ管理システムです。

### ✅ 達成済み機能

- **✅ 100%ハードコード除去**: バックエンドAPI + フロントエンドUI
- **✅ 型安全MessageKey**: コンパイル時キー存在検証
- **✅ 多言語対応**: 日本語・英語・Pseudo対応
- **✅ 統一API形式**: Result型パターン採用
- **✅ ESLint強制ルール**: ハードコード復活防止
- **✅ リアルタイム言語切り替え**: LocalStorage永続化

---

## 🚀 基本的な使用方法

### **バックエンドAPI開発**

```typescript
import { createSuccessResponse, createErrorResponse } from '@template/shared'

// ✅ 正しい使用方法
export async function getProfile(c: Context) {
  try {
    const user = await userService.getProfile(userId)
    return c.json(
      createSuccessResponse(
        { user },
        'success.profile_retrieved' // MessageKey使用
      )
    )
  } catch (error) {
    return c.json(
      createErrorResponse(
        'error.user_not_found', // MessageKey使用
        undefined,
        404
      ),
      404
    )
  }
}

// ❌ ハードコード（ESLintエラーになる）
return c.json({ success: true, message: 'プロフィール取得成功' })
```

### **フロントエンドUI開発**

```typescript
import { useMessages } from '@/hooks/useMessages'

export function UserProfile() {
  const { tUI, tError, tSuccess, changeLocale } = useMessages()

  return (
    <div>
      {/* ✅ MessageKey使用 */}
      <label>{tUI('ui.user_id')}</label>

      {/* エラー表示 */}
      {error && <div className="error">{tError('error.user_not_found')}</div>}

      {/* 言語切り替え */}
      <button onClick={() => changeLocale('en')}>
        Switch to English
      </button>
    </div>
  )
}

// ❌ ハードコード（ESLintエラーになる）
<label>ユーザーID</label>
```

---

## 📝 メッセージ追加・編集手順

### **Step 1: レジストリに定義追加**

メッセージレジストリはカテゴリ／機能単位で `contracts/messages/registry/` に分割されています。新しいキーはそれぞれのファイルに追加してください。

```
contracts/messages/registry/
├── ui.yaml
├── action.yaml
└── features/
    └── home.yaml
```

例: `contracts/messages/registry/ui.yaml` に追加する場合

```yaml
messages:
  ui:
    new_feature_label:
      key: 'ui.new_feature_label'
      namespace: 'ui'
      category: 'label'
      description: 'New feature section label'
      template_params: []
      since: '1.1.0'
      api_usage: false
      ui_usage: true
```

### **Step 2: 各言語の翻訳追加**

`packages/shared/src/messages/locales/ja.ts`:

```typescript
export const jaMessages: LocaleMessages = {
  // 既存の翻訳...
  'ui.new_feature_label': '新機能ラベル',
}
```

`packages/shared/src/messages/locales/en.ts`:

```typescript
export const enMessages: LocaleMessages = {
  // 既存の翻訳...
  'ui.new_feature_label': 'New Feature Label',
}
```

### **Step 3: TypeScript型生成・確認**

```bash
# CLI で生成・検証（MESSAGE_CONFIG_PATH を指定すると任意設定を使用）
pnpm verify:messages
node tools/message-codegen/generate.js

# ドライランで影響確認
node tools/message-codegen/generate.js --dry-run

# ツール全体テスト
pnpm test:tools
```

### **Step 4: コードで使用**

```typescript
const { tUI } = useMessages()
<label>{tUI('ui.new_feature_label')}</label>
```

---

## 🔧 翻訳関数リファレンス

### **useMessages()フック**

```typescript
const {
  t, // 汎用翻訳（パラメータ対応）
  tUI, // UIラベル専用（ui.*, action.*）
  tError, // エラー専用（error.*, auth.*）
  tSuccess, // 成功専用（success.*）
  tValidation, // バリデーション専用（validation.*）
  locale, // 現在のロケール
  changeLocale, // 言語切り替え
} = useMessages()
```

### **パラメータ付きメッセージ**

```typescript
// レジストリ定義
'validation.string_too_short': {
  template_params: ["field", "minLength"]
}

// 翻訳ファイル
'validation.string_too_short': 'フィールド「{field}」は{minLength}文字以上で入力してください。'

// 使用例
tValidation('validation.string_too_short', {
  field: 'displayName',
  minLength: 3
})
// → "フィールド「displayName」は3文字以上で入力してください。"
```

---

## 🛡️ ESLint品質保証

### **自動適用ルール**

プロジェクトには**MessageKey強制ESLintルール**が設定済みです：

```javascript
// ✅ これは通る
const message = tUI('ui.user_id')
createSuccessResponse(data, 'success.profile_updated')

// ❌ ESLintエラーになる
const message = 'ユーザーIDを表示'
createSuccessResponse(data, 'Profile updated successfully')
```

### **ESLint設定詳細**

- **`@template/message-keys/no-hardcoded-messages`**: ハードコード文字列検出
- **`@template/message-keys/require-message-key`**: 特定関数でMessageKey強制
- **自動修正提案**: 適切なMessageKeyを提案

---

## 🌍 多言語対応システム

### **対応言語**

| Locale   | 言語     | カバレッジ | 用途             |
| -------- | -------- | ---------- | ---------------- |
| `ja`     | 日本語   | 100%       | 本番・開発       |
| `en`     | 英語     | 100%       | 国際展開・テスト |
| `pseudo` | 疑似言語 | 100%       | デバッグ・QA     |

### **言語切り替え実装**

```typescript
export function LanguageSwitcher() {
  const { locale, changeLocale } = useMessages()

  return (
    <select
      value={locale}
      onChange={(e) => changeLocale(e.target.value as SupportedLocale)}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
      <option value="pseudo">[!! Pseudo !!]</option>
    </select>
  )
}
```

### **自動言語検出**

- **初回訪問**: ブラウザ言語を自動検出 (`navigator.language`)
- **再訪問**: LocalStorageから前回設定を復元
- **サーバー**: Accept-Language ヘッダー解析（実装済み）

---

## 📊 MessageKey命名規約

### **Namespace分類**

| Namespace      | 用途                 | 例                          |
| -------------- | -------------------- | --------------------------- |
| `auth.*`       | 認証・権限           | `auth.signin_required`      |
| `error.*`      | エラーメッセージ     | `error.user_not_found`      |
| `success.*`    | 成功メッセージ       | `success.profile_updated`   |
| `ui.*`         | UIラベル・フィールド | `ui.display_name`           |
| `action.*`     | ボタン・アクション   | `action.auth_api_test`      |
| `validation.*` | 入力検証             | `validation.field_required` |

### **命名ルール**

- **形式**: `namespace.snake_case_key`
- **英語**: 識別子は英語のみ
- **説明的**: 用途が明確にわかる名前
- **一意性**: プロジェクト全体で重複なし

```typescript
// ✅ 良い例
'ui.user_profile_section'
'error.authentication_failed'
'success.data_saved_successfully'

// ❌ 悪い例
'ui.label1'
'msg'
'userProfileSectionTitle' // キャメルケース
```

---

## 🔍 デバッグ・開発ツール

### **Pseudo言語でのデバッグ**

```typescript
// locale = 'pseudo' に設定すると
tUI('ui.user_id')
// → "[!! User ID !!]"

// 翻訳漏れ・MessageKey間違いが一目でわかる
```

### **翻訳テストスクリプト**

```bash
# 英語翻訳品質チェック
node tmp/english-translation-test.js

# 出力例:
# ✅ No quality issues found!
# 📊 Coverage: English 14/14 (100%)
```

### **ブラウザ開発者コンソール**

```javascript
// 現在のロケール確認
localStorage.getItem('user-locale')

// 手動言語変更
localStorage.setItem('user-locale', 'en')
location.reload()
```

---

## ⚡ パフォーマンス最適化

### **ビルド時最適化**

- **Tree Shaking**: 未使用MessageKeyは自動除去
- **型チェック**: MessageKey存在をコンパイル時検証
- **バンドルサイズ**: ロケール別分割ロード（将来拡張）

### **実行時最適化**

- **LocalStorage キャッシュ**: 翻訳データキャッシュ
- **遅延読み込み**: 必要な言語のみ読み込み
- **メモ化**: useCallback による翻訳関数最適化

---

## 🚨 トラブルシューティング

### **よくある問題と解決法**

#### **1. ESLintエラー: ハードコード検出**

```
error: Hardcoded user-facing message detected: "ユーザーが見つかりません"
```

**解決法**: MessageKeyに置き換え

```typescript
// ❌ エラーの原因
const message = 'ユーザーが見つかりません'

// ✅ 修正
const message = tError('error.user_not_found')
```

#### **2. 翻訳が表示されない**

**原因**: MessageKeyの存在確認

1. `registry.yaml` にキー定義があるか確認
2. `ja.ts`, `en.ts` に翻訳があるか確認
3. スペルミス・namespace間違いを確認

#### **3. 型エラー: MessageKey型不一致**

```
error: Argument of type '"ui.nonexistent"' is not assignable to parameter of type 'MessageKey'
```

**解決法**: レジストリ定義を追加、またはキー名修正

#### **4. 言語切り替えが効かない**

**確認項目**:

- LocalStorage権限設定
- useMessagesフック正常実行
- changeLocale()呼び出し確認

---

## 🔮 将来の拡張

### **準備済み機能**

- **新言語追加**: 中国語・韓国語等の追加容易
- **Go言語移行**: 言語中立設計でGo移行準備完了
- **CMS統合**: 翻訳者向けWeb UI実装可能
- **動的翻訳**: 実行時メッセージ更新システム

### **拡張手順例（中国語追加）**

1. `registry.yaml` に `supported_locales: ["ja", "en", "pseudo", "zh"]`
2. `packages/shared/src/messages/locales/zh.ts` 作成
3. `types.ts` の `SupportedLocale` 型更新
4. 翻訳データ追加

---

## 📚 関連ドキュメント

- **[API設計ガイド](../architecture/api-design.md)** - MessageKey統合API設計
- **[テスト戦略](./testing-strategy.md)** - MessageKey系テスト方針
- **[コード規約](../styleguide/code-standards.md)** - MessageKey命名規約詳細

---

## 💡 ベストプラクティス

### **✅ DO**

- MessageKeyは必ず `registry.yaml` で定義してから使用
- 翻訳関数は適切なコンテキスト関数を使用（`tUI`, `tError` 等）
- 新機能開発時は最初にメッセージ設計を行う
- ESLintエラーは必ず修正してからコミット

### **❌ DON'T**

- ハードコード文字列は一切使用しない
- MessageKeyを直接文字列連結しない
- 翻訳ファイルを直接編集せずレジストリ経由で管理
- 開発・テスト用メッセージを本番環境に混入させない

---

**🎉 Happy Coding with MessageKey System!**
