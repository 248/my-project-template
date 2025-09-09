# CI/CD セットアップガイド

> GitHub Actions を使用した自動デプロイパイプラインの設定手順

## 📋 概要

このプロジェクトは以下の機能を持つCI/CDパイプラインを実装しています：

- ✅ **PRプレビューデプロイ** - プルリクエストごとに独立した環境
- ✅ **手動承認ステップ** - 本番デプロイ前の安全確認
- ✅ **依存関係スキップ** - 変更がないパッケージはデプロイしない
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

### 4. Vercelの自動デプロイを無効化

`vercel.json`で自動デプロイが無効化されています：

```json
{
  "git": {
    "deploymentEnabled": false // GitHub Actionsでデプロイ制御
  }
}
```

**注意**: これによりVercel側の自動デプロイは無効となり、GitHub Actions経由でのみデプロイされます。

### 5. 本番URLの設定

`.github/workflows/deploy.yml`の本番URLを更新：

```yaml
# TODO: 本番URLが決まったら更新
FRONTEND_URL: ${{ needs.deploy-frontend.outputs.prod-url || 'https://your-production-domain.com' }}
```

## 📊 ワークフローの動作

### PR作成時の動作

1. **変更検出** - どのパッケージが変更されたか判定
2. **品質チェック** - lint/type-check実行（失敗しても続行）
3. **テスト** - 現在はスキップ（将来実装）
4. **プレビューデプロイ** - Vercel/Cloudflareのプレビュー環境
5. **コメント投稿** - PRにプレビューURLを自動コメント

### mainブランチへのpush時の動作

1. **品質チェック** - lint/type-check実行
2. **テスト** - 現在はスキップ
3. **本番デプロイ** - 手動承認後に本番環境へデプロイ

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

- `pnpm quality-check` - 全体的な品質チェック（codegen + gen:messages + type-check + lint + test）
- `pnpm type-check` - 型チェック
- `pnpm lint` - Lint実行
- `pnpm test:run` - テスト実行

**その他:**

- `pnpm codegen` - API型定義生成
- `pnpm gen:messages` - メッセージキー型定義生成（38メッセージ）
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

### デプロイが失敗する場合

1. **Secrets確認** - 全てのSecretsが正しく設定されているか
2. **権限確認** - Vercel/CloudflareのAPIトークンに適切な権限があるか
3. **ログ確認** - GitHub Actionsのログでエラーメッセージをチェック

### プレビューURLが表示されない

- Vercelプロジェクトが正しく設定されているか確認
- `VERCEL_PROJECT_ID`が正しいか確認

### 依存関係の変更が反映されない

- `turbo.json`の依存関係設定を確認
- キャッシュをクリアして再実行

### ビルドエラーが発生する場合

- `pnpm codegen`を実行してAPI型定義を最新化
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
