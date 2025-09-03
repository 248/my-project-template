---
title: リポジトリガイドライン
author: ChatGPT
created: 2025-08-28
updated: 2025-08-28
status: draft
---

# 推奨モノレポ構成（コード＋ドキュメント統合）

```
repo/
├─ apps/
│  ├─ frontend/                 # Next.js 15
│  └─ backend/                  # Hono API サーバー（TypeScript）
├─ packages/
│  ├─ ui/                       # 共有UI(React)
│  ├─ shared/                   # TS共通型/ユーティリティ（FE中心）
│  │  └─ api-client/            # 🆕 OpenAPI生成物の境界ラッパ（型安全APIクライアント）
├─ contracts/
│  └─ openapi.yaml              # API契約の単一ソース（真実の源泉）
├─ docs/                        # ← ドキュメントのトップ
│  ├─ index.md                  # ポータル（読む導線を役割別に整理）
│  ├─ meta/                     # プロジェクトのドキュメントポリシーや運用ルール
│  ├─ handbook/                 # 新規参画・日常手順（開発環境、規約）
│  ├─ architecture/             # 設計・サービス境界・図
│  ├─ runbooks/                 # 障害/運用手順（SRE向け）
│  ├─ adr/                      # Architectural Decision Records（YYYY-MM-DD-*.md）
│  ├─ rfc/                      # 大きめの提案/仕様検討（ドラフト→採択）
│  ├─ product/                  # 要件/ロードマップ/ユーザーストーリー
│  ├─ api/                      # ← contracts から自動生成されたAPIドキュメント
│  ├─ contrib/                  # コントリビュートガイド/レビュー方針
│  ├─ styleguide/               # コード規約/命名/ブランチ・コミット規約
│  └─ _assets/                  # 画像/図（Mermaid/PlantUML等）
├─ tools/
│  ├─ codegen/                  # openapi-generator / oapi-codegen / API docs 生成スクリプト
│  │  └─ generate-ts-client.mjs # 🆕 決定的な型安全クライアント生成（固定バージョン）
│  ├─ ci/                       # CI/CD用スクリプト
│  └─ docs/                     # docsビルド用スクリプト（Docusaurus/MkDocs等）
├─ infra/
│  ├─ docker/                   # Dockerfile群（fe/be）
│  ├─ k8s/                      # (任意) マニフェスト
│  └─ compose.yaml              # FE/BE/DB/Redis まとめ起動
├─ .devcontainer/               # VS Code/Devcontainers（FE/BE両方入る）
├─ .github/workflows/           # CI（パスベースで分離デプロイ）
└─ CODEOWNERS
```

**ポイント**

- ドキュメントは `docs/` に集約し、**役割別にサブディレクトリ**を切る（探しやすい）。
- **APIドキュメントは自動生成**して `docs/api/` に配置（手書きと明確に分離）。
- 契約は `contracts/openapi.yaml` を**唯一の真実**に。変更時は FE/BE 両方のビルド/テストを CI で走らせる。
- `CODEOWNERS` で `docs/` 配下の責務を明確化（例：`runbooks` は SRE、`adr` はTech Lead+PM）。

---

# 最小テンプレ（そのまま使える）

### `docs/index.md`

```md
---
title: プロジェクトドキュメント
---

# 目次（役割別の導線）

- はじめての方 → [handbook/overview.md](./handbook/overview.md)
- アーキテクチャ → [architecture/overview.md](./architecture/overview.md)
- 障害対応 → [runbooks/](./runbooks/)
- API（自動生成） → [api/](./api/)
- 意思決定（ADR） → [adr/](./adr/)
- 仕様提案（RFC） → [rfc/](./rfc/)
- スタイルガイド → [styleguide/](./styleguide/)
- コントリビュート → [contrib/](./contrib/)
```

### ADR テンプレ（`docs/adr/YYYY-MM-DD-title.md`）

```md
---
title: 認証方式の置き換え (OAuth 2.1)
status: proposed # proposed | accepted | superseded
deciders: [backend, frontend, security]
date: 2025-08-28
---

## Context

（背景・課題・制約）

## Decision

（採用案を一言で）

## Consequences

- 正の影響:
- 負の影響: （緩和策）

## Alternatives

- 案A:
- 案B:

## Links

- PR: #1234
- RFC: ../rfc/2025-08-10-auth-migration.md
```

### Runbook テンプレ（`docs/runbooks/incidents/502-gateway-timeout.md`）

```md
---
severity: high
service: backend
owner: sre
last_review: 2025-08-28
---

# 502 Gateway Timeout 対応

## まず5分でやること

1. /healthz の応答
2. HPA/POD 再起動回数
3. 直近デプロイ/DBマイグレーション

## 調査

- メトリクス:
- ログクエリ:

## 暫定対応 / 恒久対応

- 暫定:
- 恒久:
```

---

# 生成の自動化（contracts → docs/api）

例：`tools/codegen/generate-api-docs.mjs`

```js
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
mkdirSync('docs/api', { recursive: true })

// HTML or Markdown 生成（好きなジェネレータでOK）
execSync(
  `
  npx redoc-cli bundle contracts/openapi.yaml \
    -o docs/api/index.html --options.theme.colors.primary.main=#0ea5e9
`,
  { stdio: 'inherit' }
)

// 型やクライアント生成もここで一緒に
// - TypeScript client -> packages/shared/api
// - Go server stubs  -> apps/backend/internal/gen
```

`package.json`（ルート）

```jsonc
{
  "scripts": {
    "docs:gen": "node tools/codegen/generate-api-docs.mjs",
    "docs:build": "pnpm -C docs-site build", // Docusaurus/MkDocs を別フォルダに置く場合
    "docs:dev": "pnpm -C docs-site start",
    "docs:lint": "markdownlint \"docs/**/*.md\" --ignore \"docs/api/**\"",
  },
}
```

---

# CI 連携（抜粋）

**ドキュメント生成＆デプロイ（Pages/Vercel等）**

```yaml
name: docs
on:
  push:
    paths:
      - 'docs/**'
      - 'contracts/**'
      - 'tools/codegen/**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm i --frozen-lockfile
      - run: pnpm docs:gen
      - run: pnpm -C docs-site build # Docusaurus/MkDocs を採用する場合
      - uses: actions/upload-pages-artifact@v3
        with: { path: docs-site/build } # or docs/build
  deploy:
    needs: build
    permissions: { pages: write, id-token: write }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

**パスベースで別デプロイ（FE/BE）**

- `apps/frontend/**` 変更 → フロントだけビルド/デプロイ
- `apps/backend/**` 変更 → バックだけビルド/デプロイ
- `contracts/**` 変更 → **両方**のテストを必ず実行

---

# 最後に：CODEOWNERS の雛形

`.github/CODEOWNERS`

```
# ドキュメント責務
/docs/architecture/   @backend @frontend
/docs/runbooks/       @sre
/docs/adr/            @techlead @pm
/contracts/           @backend @frontend

# コード
/apps/frontend/       @frontend
/apps/backend/        @backend
/packages/ui/         @frontend
/packages/shared/     @frontend
```

---

この形なら、**コード・契約・ドキュメントの更新が“1つのPR”で繋がる**し、
将来 Go を別デプロイにしても CI は**パスベース**で完全に分離できます。
