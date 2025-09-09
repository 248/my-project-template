#!/bin/bash

# =============================================================================
# Vercel Ignored Build Step
# =============================================================================
# フロントエンドに影響しない変更の場合、ビルドをスキップする
# 戻り値: 0 = ビルド実行, 1 = ビルドスキップ
# =============================================================================

echo "🔍 フロントエンドのビルド必要性を検査中..."

# Git差分がない場合（初回デプロイなど）は常にビルド
if ! git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
  echo "✅ 初回デプロイまたはGit履歴なし → ビルド実行"
  exit 0
fi

# フロントエンドに影響するファイルパターン
FRONTEND_PATTERNS=(
  "apps/frontend/"
  "packages/ui/"
  "packages/shared/"
  "packages/api-contracts/"
  "packages/config/"
  "package.json"
  "pnpm-lock.yaml"
  "pnpm-workspace.yaml"
  "tsconfig.base.json"
  ".eslintrc.cjs"
  ".prettierrc"
  "tailwind.config.js"
)

# バックエンドのみの変更パターン（これらのみの変更はスキップ）
BACKEND_ONLY_PATTERNS=(
  "apps/backend/"
  "infra/docker/"
  "atlas.hcl.disabled"
  "db/"
  "*.md"
  "docs/"
  ".codex/"
  ".gemini/"
  "tools/"
)

# 前回のコミットとの差分を取得
echo "📊 変更ファイルを確認中..."
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "📝 変更ファイルなし → ビルド実行"
  exit 0
fi

echo "変更されたファイル:"
echo "$CHANGED_FILES" | sed 's/^/  - /'

# フロントエンド関連の変更があるかチェック
FRONTEND_CHANGED=false

for pattern in "${FRONTEND_PATTERNS[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "^$pattern"; then
    echo "✅ フロントエンド関連の変更を検出: $pattern"
    FRONTEND_CHANGED=true
    break
  fi
done

# フロントエンド関連の変更がある場合はビルド
if [ "$FRONTEND_CHANGED" = true ]; then
  echo "🚀 フロントエンドに影響する変更あり → ビルド実行"
  exit 0
fi

# バックエンドのみの変更かチェック
BACKEND_ONLY_CHANGED=true

while IFS= read -r file; do
  MATCHES_BACKEND_PATTERN=false
  
  for pattern in "${BACKEND_ONLY_PATTERNS[@]}"; do
    if [[ "$file" == $pattern* ]]; then
      MATCHES_BACKEND_PATTERN=true
      break
    fi
  done
  
  if [ "$MATCHES_BACKEND_PATTERN" = false ]; then
    BACKEND_ONLY_CHANGED=false
    break
  fi
done <<< "$CHANGED_FILES"

if [ "$BACKEND_ONLY_CHANGED" = true ]; then
  echo "⏭️  バックエンドのみの変更 → ビルドスキップ"
  exit 1
fi

# その他の変更はビルド実行
echo "🤔 判定困難な変更あり → 安全のためビルド実行"
exit 0