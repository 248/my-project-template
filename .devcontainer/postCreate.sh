#!/usr/bin/env bash
set -euo pipefail

echo "[postCreate] start"

# --- 基本ツールの確認 ---
node -v
npm -v

# --- pnpm を Corepack で有効化（非対話）---
export COREPACK_ENABLE_DOWNLOAD_PROMPT=${COREPACK_ENABLE_DOWNLOAD_PROMPT:-0}
export CI=${CI:-1}

corepack enable || true
# 一部の corepack には --force が無いので付けない
if ! corepack prepare pnpm@latest --activate; then
  npm install -g pnpm --yes
fi
pnpm -v || (echo "[postCreate] pnpm setup failed" && exit 2)

# --- Codex CLI を導入 ---
npm i -g @openai/codex

# --- uv(astral) を導入（MCPで uvx を使うため）---
if ! command -v uvx >/dev/null 2>&1; then
  curl -fsSL https://astral.sh/uv/install.sh | sh
fi
# パス反映
if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.bashrc"; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi
export PATH="$HOME/.local/bin:$PATH"

# --- MCP Proxy を導入 ---
uv tool install mcp-proxy

# --- 依存インストール（任意）---
if [ -f pnpm-lock.yaml ] || [ -f package.json ]; then
  pnpm i || pnpm install
fi

# --- Codex の設定テンプレートを実パスで展開 ---
mkdir -p "$HOME/.codex"
WORKSPACE="$(pwd)"
TEMPLATE=".devcontainer/codex.config.toml.tmpl"
TARGET="$HOME/.codex/config.toml"
if [ ! -f "$TEMPLATE" ]; then
  echo "[postCreate] ERROR: $TEMPLATE not found"; exit 2
fi
# 環境変数を展開して出力
envsubst < "$TEMPLATE" > "$TARGET"
# sed "s#__WORKSPACE__#${WORKSPACE}#g" "$TEMPLATE" > "$HOME/.codex/config.toml"
echo "[postCreate] Done. Codex config written to $HOME/.codex/config.toml"

# --- Gemini Google Search MCP を事前に用意（npxの初回対話を潰す）---
npm i -g mcp-gemini-google-search || true
# npx --yes mcp-gemini-google-search --help >/dev/null 2>&1 || true

# --- APIキーを次回以降も使えるように（任意・存在すれば追記）---
if [ -n "${GEMINI_API_KEY:-}" ]; then
  if ! grep -q 'export GEMINI_API_KEY=' "$HOME/.bashrc"; then
    echo "export GEMINI_API_KEY=\"${GEMINI_API_KEY}\"" >> "$HOME/.bashrc"
  fi
fi
if [ -n "${GOOGLE_API_KEY:-}" ]; then
  if ! grep -q 'export GOOGLE_API_KEY=' "$HOME/.bashrc"; then
    echo "export GOOGLE_API_KEY=\"${GOOGLE_API_KEY}\"" >> "$HOME/.bashrc"
  fi
fi
if [ -n "${GEMINI_MODEL:-}" ]; then
  if ! grep -q 'export GEMINI_MODEL=' "$HOME/.bashrc"; then
    echo "export GEMINI_MODEL=\"${GEMINI_MODEL}\"" >> "$HOME/.bashrc"
  fi
else
  if ! grep -q 'export GEMINI_MODEL=' "$HOME/.bashrc"; then
    echo 'export GEMINI_MODEL="gemini-2.5-flash"' >> "$HOME/.bashrc"
  fi
fi

# --- 他の MCP も事前ウォーム（npx は --yes で非対話、uvx は絶対パス）---
# npx --yes @upstash/context7-mcp --help >/dev/null 2>&1 || true
# npx --yes @playwright/mcp@latest --help >/dev/null 2>&1 || true
# /home/vscode/.local/bin/uvx markitdown-mcp --help >/dev/null 2>&1 || true
# /home/vscode/.local/bin/uvx arxiv-mcp-server --help >/dev/null 2>&1 || true
# /home/vscode/.local/bin/uvx --from git+https://github.com/oraios/serena \
#   serena start-mcp-server --context codex --transport stdio --help >/dev/null 2>&1 || true

# claude mcp
claude mcp add serena -- uv tool run --from git+https://github.com/oraios/serena serena-mcp-server

# playwright
claude mcp add playwright npx @playwright/mcp@latest 

npm install -g mcp-gemini-google-search
claude mcp add gemini-google-search -e GEMINI_API_KEY=$GEMINI_API_KEY GEMINI_MODEL=$GEMINI_MODEL -- npx mcp-gemini-google-search || true
claude mcp add markitdown -s user -- uvx markitdown-mcp || true
claude mcp add arxiv-mcp-server -s user -- uvx arxiv-mcp-server || true
claude mcp add context7 -- npx @upstash/context7-mcp@latest || true
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer $GITHUB_TOKEN"

echo "[postCreate] complete"
