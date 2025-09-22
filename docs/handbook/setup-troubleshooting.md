---
title: セットアップトラブルシューティング
author: @claude
created: 2025-09-06
updated: 2025-09-06
status: published
---

# 🛟 セットアップトラブルシューティング

> **環境固有の問題と事前回避策**：初回セットアップで躓かないためのガイド

## 🎯 対象者

- **初回環境構築**で問題が発生した方
- **既存の開発者ガイド通りに進めても失敗**する方
- **OS固有の問題**で困っている方

基本的なセットアップ手順は [📖 開発者ガイド](./developer-guide.md) を先にご確認ください。

---

## 🔄 環境別セットアップガイド

### 🪟 **Windows 固有の対策**

#### よくある問題と事前回避策

| 問題               | 症状                    | 事前回避策                   |
| ------------------ | ----------------------- | ---------------------------- |
| **パス区切り文字** | `\` と `/` の混在エラー | WSL2使用推奨、Git Bash使用可 |
| **権限不足**       | npm script実行失敗      | 管理者権限でターミナル実行   |
| **改行コード**     | Git自動変換でビルド失敗 | `.gitattributes` で統一設定  |
| **長いパス**       | `node_modules` パス制限 | PowerShellで長いパス有効化   |

#### 推奨セットアップ手順（Windows）

```powershell
# 1. 管理者権限でPowerShell起動
# 2. 長いパス有効化
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# 3. Git設定（改行コード統一）
git config --global core.autocrlf false
git config --global core.eol lf

# 4. WSL2使用の場合
# WSL2内でプロジェクト全体を配置推奨
```

### 🍎 **macOS 固有の対策**

#### よくある問題と事前回避策

| 問題                   | 症状                      | 事前回避策               |
| ---------------------- | ------------------------- | ------------------------ | -------------- |
| **Node.js バージョン** | 古いNodeでビルド失敗      | nvm使用でNode 18+        |
| **Xcode不足**          | native modules ビルド失敗 | `xcode-select --install` |
| **権限問題**           | npm global install失敗    | nvm使用、sudo不使用      |
| **ポート使用**         | 開発サーバー起動失敗      | `lsof -ti:3000           | xargs kill -9` |

#### 推奨セットアップ手順（macOS）

```bash
# 1. Homebrew + nvm セットアップ
brew install nvm
nvm install 18
nvm use 18

# 2. Xcode Command Line Tools
xcode-select --install

# 3. ポート確認・解放
# プロジェクトルートで実行
lsof -ti:3000,8000 | xargs kill -9  # ポート3000,8000解放
```

### 🐧 **Linux 固有の対策**

#### よくある問題と事前回避策

| 問題                     | 症状                   | 事前回避策                   |
| ------------------------ | ---------------------- | ---------------------------- |
| **依存パッケージ不足**   | native modules失敗     | build-essential インストール |
| **メモリ不足**           | ビルド途中でクラッシュ | スワップファイル作成         |
| **文字エンコーディング** | ファイル名文字化け     | UTF-8環境設定                |

#### 推奨セットアップ手順（Linux）

```bash
# 1. 必要パッケージインストール（Ubuntu/Debian）
sudo apt update
sudo apt install build-essential curl git

# 2. Node.js セットアップ
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Docker権限設定
```

---

## 🔧 **よくあるセットアップエラーと解決法**

### ❌ **pnpm install 失敗**

#### 症状パターン

```bash
# パターン1: ネットワークエラー
ERR_PNPM_FETCH_FAILED

# パターン2: 権限エラー
EACCES: permission denied

# パターン3: native module ビルド失敗
node-gyp rebuild failed
```

#### 解決手順

```bash
# 1. キャッシュクリア
pnpm store prune
npm cache clean --force

# 2. レジストリ確認・変更
pnpm config get registry
pnpm config set registry https://registry.npmjs.org/

# 3. 権限修正（macOS/Linux）
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm-store

# 4. 再実行
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### ❌ **pnpm dev 起動失敗**

#### 症状パターン

```bash
# パターン1: ポート競合
Port 3000 is already in use

# パターン2: 環境変数未設定
Missing required environment variables

# パターン3: 型生成未完了
Module not found: @template/api-contracts-ts
```

#### 解決手順

```bash
# 1. ポート確認・解放
netstat -tulpn | grep :3000  # Linux
lsof -ti:3000 | xargs kill   # macOS

# 2. 環境変数設定
cp .env.example .env
# .envファイルを環境に合わせて編集

# 3. 型・スキーマ生成
pnpm codegen
pnpm db:generate

# 4. 再起動
pnpm dev
```

### ❌ **Workers 開発サーバー問題**

#### 症状パターン

```bash
# パターン1: Workersのポートが使用中
Error: failed: ::bind(sockfd, &addr.generic, addrlen)

# パターン2: ポート競合
Port is already allocated

# パターン3: メモリ不足
```

#### 解決手順

```bash
# 1. 残存プロセスの停止
pkill -f workerd 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# 2. ポート状況確認
ss -ltnp | grep ':3000\|:8787'

# 3. キャッシュやビルド成果物のクリーンアップ
rm -rf .next apps/frontend/.next

# 4. 再起動
pnpm dev:full
```

---

## 🎯 **事前チェックリスト**

セットアップ前に以下を確認することで、問題を事前回避できます。

### ✅ **必須環境確認**

```bash
# Node.js バージョン（18.0.0+）
node --version

# pnpm インストール確認
pnpm --version

# Git 設定確認
git config user.name
git config user.email

```

### ✅ **空きポート確認**

```bash
# 必要ポートが使用中でないか確認
# Windows
netstat -an | findstr ":3000 :8000"

# macOS/Linux
lsof -ti:3000,8000
```

### ✅ **ディスク容量確認**

```bash
# 最低5GB推奨
df -h .  # Linux/macOS
dir     # Windows
```

---

## 📞 **それでも解決しない場合**

### 1️⃣ **詳細情報の収集**

```bash
# 環境情報出力
node --version
pnpm --version
git --version
echo $SHELL

# エラーログ保存
pnpm install > install.log 2>&1
```

### 2️⃣ **クリーンインストール**

```bash
# 完全リセット
rm -rf node_modules pnpm-lock.yaml .next
pnpm store prune
pnpm install
```

### 3️⃣ **チームメンバーに相談**

以下の情報を含めて質問：

- OS・バージョン
- 実行したコマンド
- エラーメッセージ（全文）
- 試した解決策

---

## 🔗 **関連ドキュメント**

- **[📖 開発者ガイド](./developer-guide.md)** - 基本セットアップ手順
- **[🚀 クイックスタートガイド](./quickstart-guide.md)** - 新人向け概要
- **[🏗️ システム概要](../architecture/system-overview.md)** - 技術構成詳細

---

**💡 このガイドで解決しない問題があれば、ドキュメント改善のためフィードバックをお願いします！**
