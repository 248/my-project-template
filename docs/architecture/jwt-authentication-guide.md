---
title: JWT認証実装ガイド
author: @claude
date: 2025-09-05
tags: [authentication, jwt, clerk, security]
---

# JWT認証実装ガイド

## 📋 概要

本プロジェクトでは、Clerk を利用した JWT (JSON Web Token) ベースの認証システムを採用しています。このドキュメントでは、実装の詳細、設定方法、トラブルシューティングについて説明します。

## 🏗️ アーキテクチャ

### 認証フロー

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Clerk
    participant Backend
    participant JWKS

    User->>Frontend: ログイン
    Frontend->>Clerk: 認証リクエスト
    Clerk-->>Frontend: JWT トークン発行
    Frontend->>Backend: APIリクエスト (Bearer token)
    Backend->>JWKS: 公開鍵取得 (初回のみ)
    JWKS-->>Backend: JWK Set
    Backend->>Backend: JWT検証
    Backend-->>Frontend: APIレスポンス
```

### 主要コンポーネント

- **Clerk**: 外部認証プロバイダー
- **JWKS エンドポイント**: JWT署名検証用の公開鍵を提供
- **認証ミドルウェア**: すべての保護されたAPIエンドポイントで JWT を検証

## ⚙️ 環境変数設定

### 必須環境変数

```env
# Clerk認証設定（フロントエンド）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Clerk認証設定（バックエンド）
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_JWT_ISSUER=https://your-domain.clerk.accounts.dev

# オプション：JWT Audience（Clerkダッシュボードで設定した場合）
CLERK_JWT_AUD=api
```

### Clerk ダッシュボード設定

1. **JWT テンプレートの作成**
   - Clerk ダッシュボードで「JWT Templates」を選択
   - 新規テンプレートを作成（名前例：`backend` or `api`）
   - Audience を設定（例：`api`）
   - このAudienceを`CLERK_JWT_AUD`に設定

2. **重要な注意点**
   - テンプレートを作成した場合、`CLERK_JWT_AUD`の設定が必須
   - テンプレートを使用しない場合、`CLERK_JWT_AUD`は省略可能

## 🔧 実装詳細

### バックエンド実装 (Hono + jose)

#### 1. Clerk設定 (`apps/backend/src/config/clerk.ts`)

```typescript
import { z } from 'zod'

const clerkConfigSchema = z.object({
  // JWT発行者（Clerkドメイン）
  issuer: z.string().url('CLERK_JWT_ISSUER must be a valid URL'),

  // JWT受信者（API識別子）- optionalで設定
  audience: z.string().min(1).optional(),

  // JWKSエンドポイントURL（自動生成される）
  jwksUrl: z.string().url().optional(),
})

export function createClerkConfig(): ClerkConfig {
  const issuer = process.env['CLERK_JWT_ISSUER']
  const audience = process.env['CLERK_JWT_AUD']

  return {
    issuer,
    ...(audience && { audience }),
    jwksUrl: `${issuer}/.well-known/jwks.json`,
  }
}
```

#### 2. 認証ミドルウェア (`apps/backend/src/middleware/clerk-auth.ts`)

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose'

// JWKS キャッシュ（パフォーマンス向上）
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { clerk } = getConfig()

    // JWKSをキャッシュから取得（初回のみフェッチ）
    if (!jwksCache) {
      jwksCache = createRemoteJWKSet(
        new URL(`${clerk.issuer}/.well-known/jwks.json`)
      )
    }

    // JWT検証
    const { payload } = await jwtVerify(token, jwksCache, {
      issuer: clerk.issuer,
      ...(clerk.audience && { audience: clerk.audience }),
    })

    // 認証コンテキストを設定
    c.set('auth', {
      userId: String(payload.sub),
      sessionId: payload['sid'],
      orgId: payload['org_id'],
    })

    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

### フロントエンド実装 (Next.js)

#### ミドルウェア設定 (`apps/frontend/src/middleware.ts`)

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(async (auth, req) => {
  // パブリックルートの判定
  if (isPublicRoute(req)) return

  // 保護されたルートへのアクセス制御
  const authResult = await auth()
  if ('protect' in authResult) {
    await authResult.protect()
  }
})
```

#### APIクライアント実装

```typescript
import { useAuth } from '@clerk/nextjs'

export function useApiClient() {
  const { getToken } = useAuth()

  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const token = await getToken()

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  return { apiCall }
}
```

## 🐳 Docker環境での設定

### CORS設定の重要性

Docker環境では、フロントエンドとバックエンドが異なるコンテナで動作するため、適切なCORS設定が必要です。

```typescript
// apps/backend/src/index.ts
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000', // ローカル開発環境
      'http://frontend:3000', // Docker環境でのコンテナ間通信
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
```

### Docker Compose設定

```yaml
# infra/docker/docker-compose.yml
services:
  backend:
    env_file:
      - ../../.env # 環境変数を.envファイルから読み込み
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    networks:
      - app-network

  frontend:
    env_file:
      - ../../.env
    depends_on:
      - backend
    networks:
      - app-network
```

## 🔍 トラブルシューティング

### よくあるエラーと対処法

#### 1. 401 Unauthorized エラー

**原因と対処法：**

- **JWTテンプレートの不一致**
  - Clerkダッシュボードでテンプレートを作成した場合、`CLERK_JWT_AUD`を設定
  - バックエンドの`audience`設定を確認

- **環境変数の未設定**

  ```bash
  # 環境変数の確認
  docker compose exec backend env | grep CLERK
  ```

- **CORS設定の不備**
  - Docker環境では`http://frontend:3000`を追加
  - ブラウザの開発者ツールでCORSエラーを確認

#### 2. JWT検証エラー

**デバッグ方法：**

```typescript
// デバッグログの追加
console.log('Clerk config:', {
  issuer: clerk.issuer,
  audience: clerk.audience,
})

console.log('JWT payload:', payload)
```

#### 3. Docker環境での接続エラー

**チェックリスト：**

- [ ] 環境変数が正しく設定されているか
- [ ] コンテナ間ネットワークが適切に構成されているか
- [ ] CORS設定にDocker用のオリジンが含まれているか
- [ ] JWKSエンドポイントへの外部接続が可能か

### パフォーマンス最適化

1. **JWKS キャッシュ**
   - 公開鍵を毎回フェッチせずキャッシュを利用
   - jose ライブラリが自動的にキャッシュを管理

2. **トークンの有効期限**
   - 適切な有効期限を設定（推奨：1時間）
   - リフレッシュトークンの実装を検討

## 📚 参考資料

- [Clerk JWT Templates Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [jose Library Documentation](https://github.com/panva/jose)
- [JWT.io - JWT Debugger](https://jwt.io/)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)

## 🔄 更新履歴

- 2025-09-05: 初版作成 - Docker環境対応、JWKS検証実装
