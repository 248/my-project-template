---
title: 症状別トラブル診断ガイド
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 🔍 症状別トラブル診断ガイド

> **「何が起きているか分からない」から「適切な解決策」へ**：症状から逆引きするトラブル解決ガイド

## 🎯 このドキュメントの使い方

1. **症状を確認** - 下記の症状一覧から該当するものを探す
2. **診断実行** - 提示された診断手順を実行
3. **解決策適用** - 原因特定後、具体的な解決策を実行
4. **予防策実施** - 再発防止のための対策を実行

**環境固有の問題**は [セットアップトラブルシューティング](./setup-troubleshooting.md) も併用してください。

---

## 🚨 **よくある症状と診断フロー**

### 症状1: 「コマンドが実行できない / 見つからない」

#### 🔍 **症状の特定**

- [ ] `pnpm: command not found`
- [ ] `node: command not found`
- [ ] `Permission denied`
- [ ] `EACCES: permission denied`

#### 🔬 **診断手順**

**ステップ1: 基本環境確認**

```bash
# Node.js インストール確認
node --version
# Expected: v18.x.x または v20.x.x

# pnpm インストール確認
pnpm --version
# Expected: 8.x.x または 9.x.x

# 権限確認
whoami
# 現在のユーザー確認
```

**ステップ2: パス確認**

```bash
# PATH環境変数確認
echo $PATH

# Node.js場所確認
which node
which pnpm
```

#### 💊 **解決策**

| 診断結果                  | 解決方法                                            |
| ------------------------- | --------------------------------------------------- |
| **Node.js未インストール** | [Node.js公式](https://nodejs.org/)からインストール  |
| **pnpm未インストール**    | `npm install -g pnpm` でインストール                |
| **PATH未設定**            | シェル設定ファイル（`.bashrc`, `.zshrc`）にPATH追加 |
| **権限エラー**            | `sudo chown -R $(whoami) ~/.npm` で権限修正         |

### 症状2: 「画面が真っ白 / エラーページが表示される」

#### 🔍 **症状の特定**

- [ ] ブラウザで白い画面が表示
- [ ] 「Page not found」エラー
- [ ] 「Internal Server Error」表示
- [ ] 「Network Error」表示

#### 🔬 **診断手順**

**ステップ1: サーバー状態確認**

```bash
# 開発サーバーの起動確認
ps aux | grep "next\|node"

# ポート使用状況確認
netstat -tulpn | grep ":3000\|:8000"  # Linux
lsof -i :3000,8000                     # macOS

# プロセス確認
pnpm dev  # 実際に起動してみる
```

**ステップ2: ログ確認**

```bash
# ブラウザの開発者ツールコンソール確認
# F12 → Console タブ

# サーバーログ確認
# pnpm dev を実行中のターミナルログ確認
```

**ステップ3: ネットワーク確認**

```bash
# ローカルホスト接続確認
curl http://localhost:3000
curl http://localhost:8000

# DNS確認（該当時）
nslookup localhost
```

#### 💊 **解決策**

| 診断結果           | 解決方法                                      |
| ------------------ | --------------------------------------------- |
| **サーバー未起動** | `pnpm dev` または `pnpm dev:full` で起動      |
| **ポート競合**     | 他のプロセス終了：`kill $(lsof -ti:3000)`     |
| **環境変数未設定** | `.env` ファイル確認・設定                     |
| **ビルドエラー**   | `pnpm type-check && pnpm lint` で問題箇所特定 |
| **API接続エラー**  | バックエンドサーバーの起動確認                |

### 症状3: 「ビルド・型チェックが失敗する」

#### 🔍 **症状の特定**

- [ ] `Type 'X' is not assignable to type 'Y'`
- [ ] `Cannot find module 'X'`
- [ ] `Property 'X' does not exist`
- [ ] `Build failed`

#### 🔬 **診断手順**

**ステップ1: エラーメッセージ分析**

```bash
# 詳細エラー出力
pnpm type-check

# 特定ファイルのチェック
npx tsc --noEmit path/to/error/file.ts

# インクリメンタルビルドキャッシュクリア
rm -rf .next tsconfig.tsbuildinfo
```

**ステップ2: 自動生成ファイル確認**

```bash
# 型生成状況確認
ls -la packages/api-contracts/codegen/ts/src/generated/

# 再生成実行
pnpm codegen
pnpm db:generate
```

**ステップ3: 依存関係確認**

```bash
# package.json整合性確認
pnpm install

# node_modules確認
ls -la node_modules/@types/
```

#### 💊 **解決策**

| エラーパターン              | 解決方法                                                 |
| --------------------------- | -------------------------------------------------------- |
| **`Cannot find module`**    | import文のパス確認・ファイル存在確認・`pnpm install`実行 |
| **型不整合エラー**          | `pnpm codegen`で最新型に更新・型ガード追加               |
| **Property does not exist** | 自動生成ファイル更新・オプショナルチェーン使用           |
| **Build timeout**           | `NODE_OPTIONS="--max-old-space-size=8192" pnpm build`    |

### 症状4: 「テストが失敗する」

#### 🔍 **症状の特定**

- [ ] `Test suite failed to run`
- [ ] `Timeout - Async callback`
- [ ] `expect(...).toBeInTheDocument is not a function`
- [ ] `Cannot resolve module`

#### 🔬 **診断手順**

**ステップ1: テスト環境確認**

```bash
# テスト設定確認
cat vitest.config.js
cat vitest.setup.js

# テストファイル単体実行
pnpm test path/to/failing/test.spec.ts
```

**ステップ2: モック・依存関係確認**

```bash
# DOM環境確認
echo "console.log(typeof document)" | node

# 依存関係確認
pnpm list @testing-library/react
pnpm list vitest
```

#### 💊 **解決策**

| エラーパターン           | 解決方法                                       |
| ------------------------ | ---------------------------------------------- |
| **DOM環境エラー**        | `vitest.config.js`の`environment: 'jsdom'`確認 |
| **非同期タイムアウト**   | `waitFor`タイムアウト設定・`async/await`確認   |
| **モジュール解決エラー** | `vitest.config.js`のaliases設定確認            |
| **マッチャーエラー**     | `vitest.setup.js`でjest-dom import確認         |

### 症状5: 「Git操作でエラーが発生する」

#### 🔍 **症状の特定**

- [ ] `Permission denied (publickey)`
- [ ] `fatal: not a git repository`
- [ ] `Your branch is ahead of 'origin/main'`
- [ ] `merge conflict`

#### 🔬 **診断手順**

**ステップ1: Git設定確認**

```bash
# Git設定確認
git config --list
git remote -v

# リポジトリ状態確認
git status
git log --oneline -5
```

**ステップ2: 認証確認**

```bash
# SSH接続テスト
ssh -T git@github.com

# 認証情報確認
cat ~/.ssh/config
ls -la ~/.ssh/
```

#### 💊 **解決策**

| エラーパターン         | 解決方法                                                |
| ---------------------- | ------------------------------------------------------- |
| **SSH認証エラー**      | SSH鍵の生成・GitHub登録・ssh-agent設定                  |
| **リモート接続エラー** | `git remote set-url origin <correct-url>`               |
| **ブランチ同期エラー** | `git pull origin main --rebase`                         |
| **マージコンフリクト** | ファイル編集でコンフリクト解決・`git add`・`git commit` |

---

## 🛠️ **緊急時の診断コマンド集**

### 一括ヘルスチェック

```bash
#!/bin/bash
# システム全体の状態を一括確認

echo "🔍 システム診断開始..."

echo "\n📍 基本環境:"
node --version 2>/dev/null || echo "❌ Node.js 未インストール"
pnpm --version 2>/dev/null || echo "❌ pnpm 未インストール"
git --version 2>/dev/null || echo "❌ Git 未インストール"

echo "\n📍 プロジェクト状態:"
[ -f package.json ] && echo "✅ package.json 存在" || echo "❌ package.json 不在"
[ -d node_modules ] && echo "✅ node_modules 存在" || echo "❌ node_modules 不在"
[ -f .env ] && echo "✅ .env 存在" || echo "⚠️ .env 不在"

echo "\n📍 サービス状態:"
lsof -i :3000 >/dev/null 2>&1 && echo "✅ ポート3000使用中" || echo "⚠️ ポート3000空き"
lsof -i :8000 >/dev/null 2>&1 && echo "✅ ポート8000使用中" || echo "⚠️ ポート8000空き"

echo "\n📍 Git状態:"
git status --porcelain 2>/dev/null | wc -l | xargs echo "変更ファイル数:"
git log --oneline -1 2>/dev/null || echo "❌ Git履歴なし"

echo "\n✅ 診断完了"
```

### エラーログ収集

```bash
#!/bin/bash
# エラー情報を体系的に収集

echo "📋 エラーログ収集中..."

# 基本情報
echo "=== 基本環境情報 ===" > debug.log
uname -a >> debug.log
node --version >> debug.log 2>&1
pnpm --version >> debug.log 2>&1

# プロジェクト情報
echo "\n=== プロジェクト情報 ===" >> debug.log
pwd >> debug.log
git remote -v >> debug.log 2>&1
git status --porcelain >> debug.log 2>&1

# 最新エラーログ
echo "\n=== 最新の型チェックエラー ===" >> debug.log
pnpm type-check >> debug.log 2>&1

echo "\n=== 最新のLintエラー ===" >> debug.log
pnpm lint >> debug.log 2>&1

echo "📋 ログをdebug.logに保存しました"
echo "チームメンバーに相談する際にこのファイルを共有してください"
```

---

## 🔄 **段階的復旧手順**

### Level 1: 軽度リセット

```bash
# キャッシュクリア
pnpm store prune
rm -rf .next tsconfig.tsbuildinfo

# 再インストール
pnpm install
```

### Level 2: 中度リセット

```bash
# node_modules完全削除
rm -rf node_modules pnpm-lock.yaml

# 自動生成ファイルクリア
rm -rf packages/api-contracts/codegen/ts/src/generated

# 完全再構築
pnpm install
pnpm codegen
```

### Level 3: 重度リセット

```bash
# Gitでクリーンな状態に戻す
git stash push -u -m "backup before reset"
git clean -fd
git reset --hard HEAD

# 完全再構築
pnpm install
pnpm codegen
pnpm db:generate
```

---

## 🆘 **それでも解決しない場合**

### チームメンバーへの報告時に含める情報

1. **症状の詳細**
   - いつから発生しているか
   - 何をした後に発生したか
   - エラーメッセージの全文

2. **環境情報**
   - OS・ブラウザのバージョン
   - Node.js・pnpmのバージョン
   - 最後に成功した時期

3. **試した解決策**
   - 実行したコマンド
   - 変更した設定
   - 参照したドキュメント

4. **添付資料**
   - エラーログ（debug.log）
   - スクリーンショット
   - 関連するファイルの変更内容

### 質問テンプレート

```markdown
## 問題の概要

[症状を簡潔に記述]

## 発生環境

- OS:
- Node.js:
- pnpm:
- ブラウザ:

## 再現手順

1. [手順1]
2. [手順2]
3. [エラー発生]

## エラーメッセージ
```

[エラーメッセージの全文]

```

## 試した解決策
- [ ] [解決策1]
- [ ] [解決策2]

## 期待する動作
[正常時の期待動作]
```

---

## 🔗 **関連ドキュメント**

- **[セットアップトラブルシューティング](./setup-troubleshooting.md)** - 環境固有の問題
- **[品質チェックガイド](./quality-check-guide.md)** - ビルド・型チェック問題
- **[開発者ガイド](./developer-guide.md)** - 基本トラブルシューティング
- **[クイックスタートガイド](./quickstart-guide.md)** - 初期設定問題

---

**💡 トラブルシューティングは「症状→診断→解決→予防」の流れが重要です。焦らず一つずつ確認していきましょう！**
