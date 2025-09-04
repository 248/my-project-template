# Development Scripts

開発環境管理用のスクリプト集

## スクリプト一覧

### stop-all (開発プロセス一括停止)

フロントエンド・バックエンド・Dockerコンテナを一括で停止するスクリプト

**ファイル:**

- `stop-all.ps1`: Windows PowerShell版
- `stop-all.sh`: Linux/Mac Bash版（旧版、広範囲停止）
- `stop-all-safe.sh`: Linux/Mac Bash版（安全版、推奨）

**⚠️ 重要:** Bash版は`stop-all-safe.sh`の使用を推奨します。`stop-all.sh`はClaude Codeセッションなど他のプロセスも停止してしまう可能性があります。

#### 使用方法

**推奨方法: pnpmコマンド経由**

```bash
# プロジェクトルートから実行
pnpm stop

# または
pnpm stop:all
```

**直接実行方法:**

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File infra/scripts/stop-all.ps1
```

Linux/Mac (Bash):

```bash
bash infra/scripts/stop-all.sh
# または
./infra/scripts/stop-all.sh
```

#### 停止対象

**ポート別停止:**

- `3000`: Frontend (Vite)
- `3005`: Frontend alternative
- `8000`: Backend (Hono)
- `5432`: PostgreSQL
- `6379`: Redis

**プロセス別停止:**

- Node.js開発プロセス (node, tsx, vite, pnpm dev)
- Docker コンテナ (実行中の全コンテナ)

## インフラ構成

```
infra/
├── docker/          # Docker Compose設定
│   ├── docker-compose.yml
│   └── ...
└── scripts/         # 開発環境管理スクリプト
    ├── stop-all.ps1  # Windows用停止スクリプト
    ├── stop-all.sh   # Linux/Mac用停止スクリプト
    └── README.md     # このファイル
```

## 開発フロー

1. **起動**

   ```bash
   pnpm dev          # フロントエンド + バックエンド
   pnpm dev:docker   # Docker サービス
   ```

2. **停止**

   ```bash
   pnpm stop         # 全て停止
   ```

3. **Docker管理**
   ```bash
   pnpm db:up        # データベースのみ起動
   pnpm db:down      # データベースのみ停止
   pnpm docker:clean # 完全クリーンアップ
   ```

## 注意事項

- スクリプトは開発用プロセスを強制終了します
- 本番環境では使用しないでください
- Dockerコンテナも停止されるため、データベースの状態に注意してください

## トラブルシューティング

### PowerShell実行ポリシーエラー

```powershell
# 一時的にポリシーを変更
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 権限エラー（Linux/Mac）

```bash
# 実行権限を付与
chmod +x infra/scripts/stop-all.sh
```
