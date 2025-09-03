---
title: プロジェクトドキュメント
author: team
created: 2025-08-28
updated: 2025-09-01
status: published
---

# プロジェクトドキュメント

> プロジェクト開発のためのドキュメントポータル

## 🎯 プロジェクトの特徴

このテンプレートは最新の技術スタックを使用したフルスタックWebアプリケーション開発のためのベースプロジェクトです：

- **フロントエンド**: Next.js + React + TypeScript
- **バックエンド**: Hono + TypeScript
- **データベース**: PostgreSQL + Prisma
- **認証**: Clerk
- **開発環境**: Docker + pnpm workspace

### 🚀 アーキテクチャ戦略

モノレポ構成でフロントエンドとバックエンドを統合管理：

- **高速プロトタイピング**: Hono で API 開発を高速化
- **型安全性**: OpenAPI による型安全な API 開発
- **開発効率**: pnpm workspace による依存関係管理

## 🎯 役割別導線

### 🚀 はじめての方

- **[開発者ハンドブック](./handbook/developer-guide.md)** - セットアップ手順・開発の流れ
- **[プロジェクト概要](../README.md)** - 技術スタック・アーキテクチャ概要

### 🏗️ アーキテクチャ・設計

- **[システムアーキテクチャ](./architecture/system-overview.md)** - 全体設計・技術選択
- **[要件定義](./architecture/requirements.md)** - プロジェクト要件・受け入れ基準
- **[API設計](./architecture/api-design.md)** - エンドポイント設計・認証パターン
- **[移行戦略](./architecture/migration-strategy.md)** - スケーリング戦略・移行計画

### 🛠️ 実装・品質

- **[コード規約](./styleguide/code-standards.md)** - TypeScript・React・品質基準
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
