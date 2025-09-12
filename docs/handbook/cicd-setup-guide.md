# CI/CD セットアップガイド

> GitHub Actions を使用した自動デプロイパイプラインの設定手順

## 📋 概要

このプロジェクトは以下の機能を持つCI/CDパイプラインを実装しています：

- ✅ **PRプレビューデプロイ** - プルリクエストごとに独立した環境
- ✅ **フロントエンド成功依存** - バックエンドはフロント成功時のみデプロイ
- ✅ **動的CORS設定** - プレビュー環境のURL自動設定
- ✅ **競合実行防止** - 同一ブランチの古い実行を自動キャンセル
- ✅ **Vercel CLI公式フロー** - 環境変数統一によるビルド成功率向上
- ✅ **Prisma Client自動生成** - CI/CD失敗の根本原因を修正
- ✅ **段階的移行** - テスト無視 → テスト必須への段階的移行

## 🚀 クイックスタート

### 1. GitHub Secrets の設定

以下のSecretsをGitHubリポジトリに設定してください：

```bash
# Settings > Secrets and variables > Actions > New repository secret
```

#### Vercel関連

- `VERCEL_TOKEN` - [Vercelダッシュボード](https://vercel.com/account/tokens)から取得
- `VERCEL_ORG_ID` - Vercelプロジェクト設定から取得
- `VERCEL_PROJECT_ID` - Vercelプロジェクト設定から取得

#### Cloudflare関連

- `CLOUDFLARE_API_TOKEN` - [Cloudflareダッシュボード](https://dash.cloudflare.com/profile/api-tokens)から取得
- `CLOUDFLARE_ACCOUNT_ID` - CloudflareダッシュボードのURL内のID

### 2. GitHub Variables の設定（オプション）

段階的移行用の変数を設定：

```bash
# Settings > Secrets and variables > Actions > Variables > New repository variable
```

- `GATE_DEPLOY` - `false`（初期値）または `true`（テスト必須化）

### 3. CODEOWNERS の更新

`.github/CODEOWNERS`ファイルのユーザー名を更新：

```bash
# TODO: あなたのGitHubユーザー名に置き換えてください
* @your-github-username
```

### 4. Vercelの自動デプロイ設定

**現在の設定**: Vercel側でGit連携を無効化し、GitHub Actions経由でのみデプロイします。

**設定方法**:

1. **Vercel Dashboard** → プロジェクト → **Settings** → **Git**
2. **Git Integration** → **Disconnect** でGit連携を解除
3. これによりVercel側の自動デプロイは無効となり、GitHub Actions経由でのみデプロイされます

**メリット**:

- CI/CDパイプラインの完全制御
- プレビュー環境の動的URL設定が可能
- バックエンドとの依存関係管理が確実

### 5. 動的URL設定と本番環境スキップ

**現在の実装**：

- **プレビュー環境**：フロントエンドのプレビューURLから CORS_ORIGIN を動的設定
- **本番環境**：一時的にスキップ（Cloudflare GUIで固定オリジン設定予定）

`.github/workflows/deploy.yml`の設定状況：

```yaml
# プレビュー環境：動的CORS_ORIGIN設定
- name: Set CORS_ORIGIN (Preview)
  uses: cloudflare/wrangler-action@v3
  command: |
    echo "${{ needs.deploy-frontend.outputs.url }}" | sed -E 's#(/+$)||$##' | wrangler secret put CORS_ORIGIN --env preview

# 本番環境：一時的にスキップ
- name: Deploy to Cloudflare Workers (Production)
  if: false # 本番環境は未作成のため一時的にスキップ
```

## 📊 ワークフローの動作

### PR作成時の動作（改善版）

1. **変更検出** - どのパッケージが変更されたか判定
2. **品質チェック** - lint/type-check実行（失敗しても続行）
3. **テスト** - 現在はスキップ（将来実装）
4. **フロントエンドデプロイ** - Vercel CLI公式フローでプレビュー環境
5. **バックエンドデプロイ** - **フロントエンド成功時のみ**実行
   - 動的CORS_ORIGIN設定 → Cloudflareプレビューデプロイ
6. **コメント投稿** - PRにプレビューURLを自動コメント

### mainブランチへのpush時の動作

1. **品質チェック** - lint/type-check + **Prisma Client生成**実行
2. **テスト** - 現在はスキップ
3. **本番デプロイ** - **現在は一時的にスキップ**（フロントエンド・バックエンド共に）

## 🔄 段階的移行パス

### Phase 0: 初期状態（現在）

- テスト失敗してもデプロイ続行
- 手動承認は任意（スキップ可能）
- `GATE_DEPLOY=false`

### Phase 1: テスト必須化

- GitHubで`GATE_DEPLOY=true`に変更
- テスト失敗時はデプロイ停止
- YAMLの変更不要

### Phase 2: 承認必須化

- GitHub Environmentsで承認者を設定
- 本番デプロイ前に必ず人間の確認

## 📋 利用可能なコマンド

### ルートレベルのコマンド

**開発用:**

- `pnpm dev` - フロントエンド開発サーバー起動
- `pnpm dev:workers` - バックエンドWorkers開発サーバー起動
- `pnpm dev:workers-fullstack` - フルスタック開発環境起動

**ビルド用:**

- `pnpm build` - 全体ビルド
- `pnpm build:frontend` - フロントエンドのみビルド
- `pnpm build:backend` - バックエンドのみビルド

**品質チェック用:**

- `pnpm quality-check` - 全体的な品質チェック（codegen + gen:messages + db:generate + type-check + lint + test）
- `pnpm type-check` - 型チェック
- `pnpm lint` - Lint実行
- `pnpm test:run` - テスト実行

**その他:**

- `pnpm codegen` - API型定義生成
- `pnpm gen:messages` - メッセージキー型定義生成（38メッセージ）
- `pnpm db:generate` - **Prisma Client生成**（CI/CD必須）
- `pnpm clean` - 全パッケージのクリーンアップ

### 手動デプロイコマンド（緊急時用）

CI/CDが利用できない場合の手動デプロイ用：

**フロントエンド（Vercel）:**

- `pnpm deploy:vercel:production` - 本番環境への手動デプロイ
- `pnpm deploy:vercel:preview` - プレビュー環境への手動デプロイ

**バックエンド（Cloudflare Workers）:**

- `pnpm deploy:workers:preview` - プレビュー環境への手動デプロイ
- `pnpm deploy:workers:production` - 本番環境への手動デプロイ

**使用例:**

```bash
# 緊急時の本番デプロイ（CI/CDが動かない場合）
pnpm build:frontend && pnpm deploy:vercel:production
pnpm build:backend && pnpm deploy:workers:production
```

### 削除されたコマンド

以下のコマンドは**削除されました**（使用頻度が低いため）:

- `build:vercel` - `pnpm build:frontend`で代用可能
- `vercel:env` / `vercel:link` - 初回セットアップ時のみ手動実行
- フロントエンドの`db:*`コマンド群 - DBはバックエンドで管理

## 🔧 トラブルシューティング

### 🚨 CI/CD根本原因修正済み問題（2024年対応）

以下の問題は**修正済み**です：

1. **"Cannot find module '../../../generated/prisma'"エラー**
   - **原因**: CI環境でPrisma Client生成不足
   - **修正**: 全ワークフローに`pnpm db:generate`追加済み

2. **"Project not found" Vercelエラー**
   - **原因**: 不要な`vercel link`コマンド実行
   - **修正**: 環境変数による自動識別に変更済み

3. **フロント失敗時のバックエンドデプロイ実行**
   - **原因**: 並列実行設定
   - **修正**: フロントエンド成功依存に変更済み

### デプロイが失敗する場合

1. **Secrets確認** - 全てのSecretsが正しく設定されているか
2. **権限確認** - Vercel/CloudflareのAPIトークンに適切な権限があるか
3. **ログ確認** - GitHub Actionsのログでエラーメッセージをチェック
4. **Prisma Client確認** - バックエンドビルド前に生成されているか

### プレビューURLが表示されない

- Vercelプロジェクトが正しく設定されているか確認
- `VERCEL_PROJECT_ID`が正しいか確認
- Vercel CLI公式フローが正常に動作しているか確認

### 依存関係の変更が反映されない

- `turbo.json`の依存関係設定を確認
- キャッシュをクリアして再実行

### ビルドエラーが発生する場合

- `pnpm codegen && pnpm gen:messages && pnpm db:generate`の順序実行
- `pnpm clean && pnpm install`でクリーンインストール
- 各パッケージで`pnpm type-check`を個別実行して問題箇所を特定

## 📝 カスタマイズ

### 環境を追加する場合

`deploy.yml`に新しい環境のステップを追加：

```yaml
- name: Deploy to Staging
  if: github.ref == 'refs/heads/staging'
  # ...
```

### テストを有効化する場合

```yaml
- name: テスト実行
  run: pnpm test:run
  # continue-on-error: true を削除
```

## 📚 関連ドキュメント

- [開発者ガイド](./developer-guide.md)
- [バックエンドデプロイメントガイド](./backend-deployment-guide.md)
- [貢献ガイドライン](../contrib/contribution-guide.md)
