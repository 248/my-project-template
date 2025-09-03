# Go移行戦略

## 概要

将来的なバックエンドのGo移行を前提とした設計戦略について説明します。

## 現在の設計思想

### 現在の契約ベースアーキテクチャ

```
packages/
├── api-contracts/                      # 📝 OpenAPI契約の単一ソース
│   ├── openapi.yaml                   # 🌍 API仕様（言語非依存）
│   └── codegen/
│       ├── ts/                        # TypeScript契約パッケージ
│       │   ├── package.json           # zod, openapi-fetch依存を局所化
│       │   └── src/generated/
│       │       ├── types.ts           # OpenAPI → TypeScript型
│       │       ├── schemas.ts         # OpenAPI → Zod schemas
│       │       └── client.ts          # 型安全APIクライアント
│       └── go/ (将来)                  # Go契約パッケージ（準備済み）
│           ├── oapi-codegen.yaml      # 生成設定
│           └── contract.gen.go        # OpenAPI → Go structs
│
├── shared/                            # 🍃 軽量・言語非依存ユーティリティ
│   └── src/                          # 依存関係ゼロ（純粋）
│
apps/
├── frontend/ → @template/api-contracts-ts
└── backend/  → @template/api-contracts-ts
```

### 責務分離の設計原則

**📝 api-contracts（契約専用）:**

- OpenAPI仕様の管理と生成物
- TypeScript/Go両方の契約実装を提供
- 重い依存関係（zod, openapi-fetch）を局所化

**🍃 shared（軽量・純粋）:**

- 言語非依存のユーティリティのみ
- 依存関係ゼロを維持
- ビジネスロジック無関係な共通機能

**🎯 apps（実装）:**

- 契約パッケージから型をインポート
- 実装に専念、型定義は契約に委譲

## Go移行時の変更点

### 1. バックエンド実装の完全置換

**現在 (TypeScript + Hono):**

```typescript
import { z } from 'zod'
import { OpenAPIHono } from '@hono/zod-openapi'

const healthCheckSchema = z.object({
  message: z.string(),
  version: z.string(),
  status: z.string(),
  timestamp: z.string(),
})

app.openapi(healthCheckRoute, c => {
  return c.json({
    message: 'Project Template API Server',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})
```

**将来 (Go + Gin):**

```go
type HealthCheckResponse struct {
    Message   string `json:"message" binding:"required"`
    Version   string `json:"version" binding:"required"`
    Status    string `json:"status" binding:"required"`
    Timestamp string `json:"timestamp" binding:"required"`
}

func healthCheck(c *gin.Context) {
    response := HealthCheckResponse{
        Message:   "Project Template API Server",
        Version:   "0.1.0",
        Status:    "healthy",
        Timestamp: time.Now().Format(time.RFC3339),
    }
    c.JSON(200, response)
}
```

### 2. 型生成の言語別対応

**現在（TypeScript共通）:**

```bash
# 契約パッケージでTypeScript型生成
pnpm codegen  # → packages/api-contracts/codegen/ts/src/generated/
```

**Go移行時（言語別生成）:**

```bash
# TypeScript契約パッケージ
pnpm gen:ts   # → packages/api-contracts/codegen/ts/src/generated/

# Go契約パッケージ（新規追加）
pnpm gen:go   # → packages/api-contracts/codegen/go/contract.gen.go
```

### 3. 開発体験の保持

**契約駆動開発は継続:**

1. `packages/api-contracts/openapi.yaml` でAPI設計
2. フロント: TypeScript契約パッケージ → 型安全クライアント
3. バック: Go契約パッケージ → 型安全ハンドラ

**型安全性は双方で保持:**

- フロント: `@template/api-contracts-ts` パッケージ
- バック: `packages/api-contracts/codegen/go/` 生成物

## 移行手順

### フェーズ0: 準備期間（完了済み）

- [x] 契約ベース設計の確立
- [x] api-contracts パッケージによる責務分離
- [x] TypeScript契約パッケージの実装
- [x] Go契約パッケージの準備（ディレクトリ作成済み）

### フェーズ2: 並行開発期間

- [ ] Go版バックエンドの並行開発
- [ ] Goコード生成パイプライン構築
- [ ] 段階的エンドポイント移行

### フェーズ3: 完全移行

- [ ] TypeScript版バックエンド廃止
- [ ] Go版への完全切替
- [ ] パフォーマンス・メモリ最適化

## 移行の利点

### パフォーマンス向上

- **メモリ効率**: Go → 2-10倍効率的
- **並行処理**: ゴルーチン → 高いスループット
- **起動速度**: コンパイル済みバイナリ → 即座起動

### 運用コスト削減

- **シングルバイナリ**: Docker軽量化
- **低リソース消費**: サーバーコスト削減
- **デプロイ簡素化**: ランタイム依存なし

### 型安全性維持

- **OpenAPI契約**: 言語非依存の型安全性
- **コンパイル時チェック**: Go強型システム
- **ランタイムエラー削減**: structタグバリデーション

## 注意点・考慮事項

### 開発チーム考慮

- **学習コスト**: Goスキルの習得必要
- **ライブラリエコシステム**: TypeScript → Go移行
- **デバッグ・テスト環境**: ツールチェーン変更

### 漸進的移行

- **Critical path**: 重要APIから段階的移行
- **A/Bテスト**: パフォーマンス比較検証
- **ロールバック計画**: 問題時の迅速復旧

この戦略により、現在の開発効率を維持しながら、将来的なGo移行への道筋を確保できます。
