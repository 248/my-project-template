---
title: Documentation Guidelines
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# Documentation Guidelines

この文書は、本リポジトリにおける **ドキュメント作成・管理ルール** を定義するものです。  
コード規約や実装ガイドラインとは異なり、すべてのドキュメント作成者に適用されます。

---

## 1. ファイル配置

- ドキュメントは `docs/` 配下に配置する。
- 役割別のサブディレクトリに分類する：

```

docs/
├─ handbook/ # 新規参画・日常手順
├─ architecture/ # 設計・アーキテクチャ
├─ runbooks/ # 障害対応手順
├─ adr/ # Architectural Decision Records
├─ rfc/ # 仕様提案・RFC
├─ product/ # 要件・ロードマップ
├─ contrib/ # 貢献ガイドライン
├─ styleguide/ # コード規約
├─ api/ # 自動生成APIドキュメント
├─ meta/ # メタ情報・ガイドライン（本ドキュメント）
└─ \_assets/ # 画像・図

```

---

## 2. ファイル命名規則

- **Markdown ファイル**: `kebab-case.md`
  - ✅ `error-handling.md`
  - ❌ `ErrorHandling.md`, `errorHandling.md`
- **ADR**: `YYYY-MM-DD-title.md`
  - 例: `2025-08-28-replace-auth-method.md`
- **RFC**: `YYYY-MM-DD-title.md`
- **画像/図**: `関連文書名-001.png` を `docs/_assets/` 配下に保存

---

## 3. Frontmatter（必須）

すべての主要文書には冒頭に YAML Frontmatter を記載する。

```yaml
---
title: 認証方式の置き換え
author: @username
created: 2025-08-28
updated: 2025-09-02
status: draft    # draft | review | published
changes:
  - 2025-09-02: セキュリティチームのレビュー反映
  - 2025-08-28: 初版作成
---
```

### 項目説明

- **title**: 文書タイトル
- **author**: 作成者（GitHub ID 推奨）
- **created**: 初版作成日
- **updated**: 最終更新日
- **status**: `draft`（草稿）/ `review`（レビュー中）/ `published`（承認済み）
- **changes**: 主な変更履歴（任意、重要なもののみ）

---

## 4. 更新ルール

- 文書を更新した場合は **必ず `updated` を修正**すること。
- 重要な変更があれば `changes` に一行で追加する。
- 大幅な改訂は新しい ADR / RFC として記録し、古い文書には `superseded by: ...` を追記。

---

## 5. レビュー・承認フロー

- PR 作成時に reviewer は Frontmatter の更新を確認する。
- 更新日が記載されていない場合は差し戻す。
- `status: draft` → `review` → `published` の順に進める。

---

## 6. 自動チェック（任意）

将来的に CI で以下を検証することを推奨する：

- Markdown の Frontmatter に `created` と `updated` が存在するか
- `updated` が PR の日付以降になっているか
- ファイル名が規則に従っているか（`kebab-case` / 日付プレフィックス付き）

---

## 7. コンテンツ作成ルール

### 7.1 コードの記載禁止

**ドキュメントには具体的なコード実装例を含めない** ことを原則とする。

#### 禁止対象

- TypeScript/JavaScript のコード例
- Prisma スキーマ定義
- SQL クエリ
- JSON 設定ファイルの詳細
- API リクエスト・レスポンス例
- テストコード例

#### 理由

- **メンテナンス性向上**: 実装コードとドキュメントの二重管理を避ける
- **整合性確保**: コードとドキュメントの不整合によるバグを防止
- **責任分離**: ドキュメントは「方針・思想」、コードは「実装」として明確に分離

#### 推奨表現

具体的なコードの代わりに以下のような表現を使用する：

- **実装方針の説明**: 「ユーザーテーブルには認証ID、メール、ユーザー名フィールドが必要」
- **設計思想の記述**: 「エラーハンドリングは型安全なResult型パターンを採用」
- **アーキテクチャの説明**: 「Pinoベースの構造化ログシステムを実装する」
- **図表の活用**: Mermaid図やフローチャートでの視覚的説明

#### 例外

以下は記載可能とする：

- コマンドライン実行例（`npm install` など）
- 設定ファイルの構造概要（詳細な値は除く）
- 概念的な疑似コード（実装を意図しないもの）

---

## 8. 今後の拡張

- 用語集（`docs/glossary.md`）を整備し、全ドキュメントで統一された言葉を使う
- 生成ドキュメント（API / 図）との整合性を定期的に CI で確認する
- バージョン別ドキュメント（v1, v2 など）が必要になったら `docs/v1/`, `docs/v2/` に分割

---
