---
title: プロジェクトテンプレート ドキュメント
author: @claude
created: 2025-09-03
updated: 2025-09-03
status: published
---

# プロジェクトドキュメント

> プロジェクト開発のためのドキュメントポータル

## 🎯 プロジェクトの特徴

このテンプレートは最新の技術スタックを使用したフルスタックWebアプリケーション開発のためのベースプロジェクトです：

- **フロントエンド**: Next.js + React + TypeScript
- **バックエンド**: Hono on Cloudflare Workers + TypeScript
- **データベース**: Neon PostgreSQL + Prisma
- **キャッシュ**: Upstash Redis
- **認証**: Clerk JWT
- **開発環境**: pnpm workspace + Cloudflare Workers

### 🚀 アーキテクチャ戦略

モノレポ構成でサーバーレス・エッジファーストのWebアプリケーション：

- **エッジファースト**: Cloudflare Workersでグローバル高速配信
- **型安全性**: OpenAPI仕様からの自動型生成でフルスタック型安全
- **データベース管理**: Prismaによる型安全・統一スキーマ管理
- **開発効率**: pnpm workspaceによる依存関係管理

## 🎯 役割別導線

### 🚀 はじめての方

- **[開発者ハンドブック](./handbook/developer-guide.md)** - Workers開発・セットアップ手順
- **[バックエンドデプロイメントガイド](./handbook/backend-deployment-guide.md)** - Cloudflare Workers デプロイ
- **[Prismaマイグレーションガイド](./handbook/prisma-migration-guide.md)** - データベース管理
- **[プロジェクト概要](../README.md)** - 技術スタック・アーキテクチャ概要

### 🏗️ アーキテクチャ・設計

- **[システムアーキテクチャ](./architecture/system-overview.md)** - 全体設計・技術選択
- **[要件定義](./architecture/requirements.md)** - プロジェクト要件・受け入れ基準
- **[API設計](./architecture/api-design.md)** - エンドポイント設計・認証パターン
- **[JWT認証ガイド](./architecture/jwt-authentication-guide.md)** - Clerk JWT認証の詳細実装
- **[移行戦略](./architecture/migration-strategy.md)** - スケーリング戦略・移行計画

### 🛠️ 実装・品質

- **[コード規約](./styleguide/code-standards.md)** - TypeScript・React・品質基準
- **[MessageKeyシステム](./handbook/message-system-guide.md)** - 統一メッセージ管理・多言語対応システム
- **[テスト戦略](./handbook/testing-strategy.md)** - 品質保証・静的解析・テスト方針
- **[貢献ガイドライン](./contrib/contribution-guide.md)** - PR 規約・レビュー観点

## 📚 外部リンク

- **[API 仕様 (OpenAPI)](../contracts/openapi.yaml)** - API の真実の源泉
- **[プロジェクト仕様](../.kiro/specs/)** - プロジェクト仕様・タスク管理

## 📋 メタ情報

- **[ドキュメント規約](./meta/documentation-guidelines.md)** - 文書作成・管理ルール
- **[実装ガイドライン](./meta/implementation-guidelines.md)** - TypeScript・品質保証
- **[リポジトリ構造](./meta/repository-structure.md)** - 推奨ディレクトリ構成

---

**💡 Tip**: 各ドキュメントは役割別に分類されています。迷った場合は該当する役割のセクションから探してください。
