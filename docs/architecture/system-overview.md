---
title: システム概要・アーキテクチャ
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# システム概要・アーキテクチャ

> プロジェクトの全体アーキテクチャ・設計方針

## 🎯 システム概要

### プロジェクトの特徴

- **フルスタック**: Next.js + Hono による統合開発環境
- **型安全**: TypeScript + OpenAPI による型安全な開発
- **モダンスタック**: React 19、Next.js 15 対応
- **開発効率**: モノレポ構成による統合管理

### アーキテクチャ原則

1. **型安全性**: OpenAPI仕様から自動生成による型安全性
2. **関心の分離**: フロントエンド・バックエンドの明確な分離
3. **依存性注入**: TSyringeによるサービス間の疎結合
4. **設定管理**: Zodスキーマによる型安全な設定検証
5. **開発効率**: 自動化とツール活用による高速開発
6. **拡張性**: スケーラブルな設計

## 🏗️ プロジェクト構成

### モノレポ構造

```
.
├─ apps/
│  ├─ frontend/                 # Next.js 15 アプリ
│  └─ backend/                  # Hono バックエンド
│     ├─ src/
│     │  ├─ interfaces/         # サービスインターフェース
│     │  ├─ services/           # 具象実装（Prisma, Redis, Pino等）
│     │  ├─ container/          # DIコンテナ設定
│     │  ├─ config/             # Zod設定スキーマ
│     │  ├─ lib/                # ヘルスチェック・DB・Redis
│     │  └─ routes/             # API ルート
├─ packages/
│  ├─ ui/                       # 共有UIコンポーネント（React + Tailwind）
│  ├─ shared/                   # 型定義・ユーティリティ
│  │  └─ api-client/            # OpenAPI生成クライアント
│  └─ config/                   # 共通設定（ESLint / TypeScript）
├─ contracts/                   # OpenAPI仕様（API契約）
├─ tools/
│  └─ codegen/                  # コード生成スクリプト
├─ infra/
│  ├─ docker/                   # Docker 環境設定
│  └─ scripts/                  # 開発プロセス停止スクリプト
├─ docs/                        # プロジェクトドキュメント
│  ├─ api/                      # API仕様
│  ├─ architecture/             # アーキテクチャガイド
│  └─ handbook/                 # 開発者ガイド
└─ .kiro/                       # Kiro 設定
```

## 🛠️ 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **State Management**: Zustand / React Query

### バックエンド

- **Runtime**: Node.js / Bun
- **Framework**: Hono
- **Database**: PostgreSQL + Prisma
- **Dependency Injection**: TSyringe
- **Configuration**: Zod（型安全な設定検証）
- **Authentication**: Clerk
- **Cache**: Redis
- **Logging**: Pino（構造化ログ）

### 開発ツール

- **Package Manager**: pnpm (workspace)
- **Code Generation**: OpenAPI Generator
- **Linting**: ESLint + Prettier
- **Testing**: Vitest / Jest
- **Container**: Docker + Docker Compose

## 🔄 データフロー

```mermaid
graph LR
    Frontend[Next.js Frontend] --> API[Hono API]

    API --> DI[DI Container]
    DI --> DatabaseService[Database Service]
    DI --> CacheService[Cache Service]
    DI --> LoggerService[Logger Service]

    DatabaseService --> DB[PostgreSQL]
    CacheService --> Cache[Redis Cache]
    API --> Auth[Clerk Auth]

    Config[Zod Config] --> DI
    Env[Environment Variables] --> Config

    Frontend --> CDN[Static Assets]
    OpenAPI[OpenAPI Spec] --> |generates| Types[TypeScript Types]
    Types --> Frontend
    Types --> API
```

## 🚀 デプロイメント

### 開発環境

- **Frontend**: `pnpm dev` (localhost:3000)
- **Backend**: `pnpm dev:api` (localhost:8000)
- **Database**: Docker Compose (PostgreSQL + Redis)

### 本番環境

- **Frontend**: Vercel / Netlify
- **Backend**: Vercel Functions / Railway / Render
- **Database**: Neon / Supabase / Railway
- **Cache**: Upstash Redis

## 🔐 セキュリティ

### 認証・認可

- **Authentication**: Clerk による認証
- **Session Management**: JWT トークン
- **API Protection**: 認証ミドルウェア

### データ保護

- **Input Validation**: Zod スキーマバリデーション
- **SQL Injection**: Prisma ORM による保護
- **CORS**: 適切な CORS 設定

## 📊 監視・ログ

- **Health Checks**: `/health` および `/health/detailed` エンドポイント
- **Error Tracking**: Sentry（推奨）
- **Analytics**: Google Analytics / Vercel Analytics
- **Logs**: 構造化ログ（Pino）
- **Performance**: Core Web Vitals 監視

## 🔗 関連ドキュメント

- [依存性注入アーキテクチャガイド](./dependency-injection.md) - TSyringeを用いたDI設計・実装
- [設定管理ガイド](./configuration-management.md) - Zodスキーマによる型安全な設定管理
- [ヘルスチェックAPI仕様](../api/health-check.md) - システム監視・診断API完全仕様
- [開発者ガイド](../handbook/developer-guide.md) - 開発手順・コマンド・DI使用法
- [要件定義](./requirements.md) - システム要件・仕様
- [API設計](./api-design.md) - API設計指針
