# Repository Guidelines

## プロジェクト構成とモジュール

- `apps/frontend`: Next.js 15（React 19, TS）。`src/` にUI・ページ。
- `apps/backend`: Hono API。`prisma/` にスキーマ/seed。
- `packages/`: 共通ライブラリ — `shared/`（utils/メッセージ）、`ui/`（コンポーネント）、`api-contracts/`（OpenAPI）、`config/`。
- `infra/docker`: 旧ローカル環境（現在は未使用）。
- `tools/`: コード生成・メッセージツール（生成物は手編集禁止）。

## 開発・ビルド・テスト

- 依存関係: `pnpm install`
- フロント: `pnpm dev` → http://localhost:3000
- Workers: `pnpm dev:workers` → http://127.0.0.1:8787
- フルスタック: `pnpm dev:full`
- 環境診断: `pnpm run doctor`
- Prisma: `pnpm db:generate|push|migrate|studio`
- ビルド: `pnpm build`、起動: `pnpm start` / `pnpm start:api`
- 品質: `pnpm type-check` / `pnpm lint` / `pnpm format:check` / `pnpm quality-check`
- テスト: `pnpm test`、実行専用: `pnpm test:run`、カバレッジ: `pnpm test:coverage`

## コーディングスタイルと命名

- TypeScript strict、インデント2スペース、シングルクォート、セミコロン無（Prettier）。
- Lint: ESLint + `@typescript-eslint`（FEは Next ルール含む）。
- メッセージはキー経由で。ハードコード文言は避ける（適用範囲で検査）。
- 生成物は編集禁止: `packages/api-contracts/codegen/**`、`packages/shared/src/messages/**`
- APIファースト: `packages/api-contracts/openapi.yaml` を更新 → `pnpm codegen` を実行。

## テスト指針

- フレームワーク: Vitest（`jsdom`）。配置: `**/__tests__/**` または `*.test.ts(x)`。
- カバレッジ: `pnpm test:coverage`（HTML/JSON）。ビルド・生成物・infraは除外。
- React は Testing Library を使用。副作用はモックし、セットアップでクリーンアップ。

## コミット・PR ガイド

- Conventional Commits（例: `feat:`, `fix:`, `chore:`）。
- ブランチ: `feature/*`, `fix/*`, `chore/*`。
- PR 前に `pnpm quality-check`。説明・関連Issue・UIはスクショ添付。
- 詳細: `docs/contrib/contribution-guide.md` を参照。

## セキュリティと設定

- `.env` は `cp .env.example .env` で用意。秘密はコミットしない。
- `infra/docker`（レガシー資材）や契約（OpenAPI）の変更は PR で合意し段階的に。
