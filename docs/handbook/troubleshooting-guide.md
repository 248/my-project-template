# トラブルシューティングガイド

開発環境でよく発生する問題の調査方法と対処方法をまとめています。

## 🚨 よくある問題

### ポート競合エラー

**症状:**

- `Error: listen EADDRINUSE :::3000`
- `Port 3000 is already in use`

**調査方法:**

```bash
# Windows
netstat -ano | findstr :3000
tasklist /FI "PID eq [PID番号]"

# PowerShell
Get-NetTCPConnection -LocalPort 3000
Get-Process -Id [PID番号]

# Unix系
lsof -i :3000
ps aux | grep [PID番号]
```

**対処方法:**

```bash
# 1. 該当プロセスを停止
# Windows
taskkill /PID [PID番号] /F

# Unix系
kill -9 [PID番号]

# 2. 全てのNode.jsプロセスを停止（注意：他のNode.jsアプリも停止します）
# Windows
taskkill /IM node.exe /F

# Unix系
pkill -f node

# 3. Workers/Next.jsが残っている場合
pkill -f workerd 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
```

### プロセスが完全に停止しない

**症状:**

- サーバーを停止したはずなのにポートが使用中のまま
- `Ctrl+C` で停止してもプロセスが残る

**調査方法:**

```bash
# 関連プロセス一覧表示
# Windows
tasklist | findstr node
tasklist | findstr pnpm

# Unix系
ps aux | grep node
ps aux | grep pnpm
```

**対処方法:**

```bash
# 1. 親プロセスから停止
# Windowsでpnpmプロセスを特定して停止
wmic process where "name='node.exe' and commandline like '%pnpm%'" delete

# 2. 強制停止（最終手段）
# Windows - 全Node.jsプロセス停止
taskkill /IM node.exe /F /T

# Unix系 - 全Node.jsプロセス停止
sudo pkill -f node
```

### Workers開発サーバーの問題

**症状:**

- `pnpm dev:full` 実行直後に `::bind` などのエラーで落ちる
- API へのリクエストが `fetch failed` になる
- `pnpm dev:full` の実行ログに CORS や環境変数関連の警告が繰り返し出力される

**調査方法:**

```bash
# ポート使用状況確認（8787）
ss -ltnp | grep 8787

# 残存プロセス確認
pgrep -fl workerd

# ログ確認（pnpm dev:full のコンソール出力）
```

**対処方法:**

```bash
# 1. 残存プロセスを停止
pkill -f workerd 2>/dev/null || true

# 2. CORS_ORIGIN や DATABASE_URL が apps/backend/.dev.vars に設定されているか確認
grep -E '^(CORS_ORIGIN|DATABASE_URL|CLERK_SECRET_KEY)=' apps/backend/.dev.vars

# 3. 開発サーバーを再起動
pnpm dev:full
```

## 🔍 詳細調査方法

### システムリソース確認

```bash
# Windows
# CPU・メモリ使用状況
wmic process get name,processid,percentprocessortime,workingsetsize
# PowerShell版
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Unix系
top -o cpu
htop  # より詳細（要インストール）
```

### ネットワーク状況確認

```bash
# すべてのリスニングポート確認
# Windows
netstat -an | findstr LISTEN

# Unix系
netstat -tuln
ss -tuln  # 高速版
```

### ファイルロック確認

```bash
# Windows
# ファイルを使用しているプロセス確認
handle.exe [ファイルパス]  # SysinternalsのHandleツール

# Unix系
lsof [ファイルパス]
fuser [ファイルパス]
```

## 🛡️ 予防策

### 1. 適切な停止手順

```bash
# 推奨停止手順
1. Ctrl+C でグレースフル停止を試行
2. 数秒待機
3. プロセスが残っている場合は `pkill -f workerd` などで個別に停止
4. 再起動前に `ss -ltnp | grep 8787` でポートが空いているか確認
```

### 2. 開発環境の分離

```bash
# Workers とフロントエンドを分離して起動
pnpm dev:workers
pnpm dev

# APIベースURLを明示して起動
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 pnpm dev
```

### 3. 環境変数の確認

```bash
# 現在の環境変数確認
# Windows
set | findstr PORT
echo %PORT%

# Unix系
env | grep PORT
echo $PORT
```

## 🚑 緊急時の完全リセット

**全プロセス停止（注意：他の開発環境も影響を受けます）**

```bash
# Windows
# Node.js / pnpm / workerd 系プロセスを強制停止
taskkill /IM node.exe /F /T
taskkill /IM pnpm.exe /F /T
taskkill /IM workerd.exe /F /T 2>nul

# Unix系
# Node.js / pnpm / workerd 系プロセスを強制停止
sudo pkill -f node
sudo pkill -f pnpm
sudo pkill -f workerd 2>/dev/null || true
```

**システム再起動**

- 上記の方法で解決しない場合は、開発マシンの再起動が最も確実です

## 📞 サポート

1. **ドキュメント確認**: [開発者ガイド](developer-guide.md)
2. **ログ確認**: `pnpm dev:full` のターミナル出力でエラー内容を確認
3. **環境の初期化**: プロジェクトの再クローンと環境構築からやり直し

---

**注意**: `taskkill /F` や `pkill` などの強制終了コマンドは、データ損失の可能性があるため慎重に実行してください。
