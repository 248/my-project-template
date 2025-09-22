#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'

const rootDir = process.cwd()

const filesToCopy = [
  {
    template: '.env.local.example',
    target: '.env.local',
    description: 'Devcontainer environment (.env.local)',
    postCopyNote: 'Devcontainer 用の環境変数が必要な場合は、このファイルを編集してください。',
  },
  {
    template: 'apps/frontend/.env.local.example',
    target: 'apps/frontend/.env.local',
    description: 'Next.js app environment (apps/frontend/.env.local)',
    postCopyNote:
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY や NEXT_PUBLIC_API_BASE_URL をアプリ用に設定してください。',
  },
  {
    template: 'apps/backend/.dev.vars.example',
    target: 'apps/backend/.dev.vars',
    description: 'Workers development variables (.dev.vars)',
    postCopyNote:
      'DATABASE_URL / CLERK_SECRET_KEY など、Cloudflare Workers で利用する値を実環境に合わせて設定してください。',
  },
]

const backendEnvFile = {
  target: 'apps/backend/.env',
  description: 'Prisma CLI 用環境変数 (apps/backend/.env)',
  placeholder: 'DATABASE_URL="postgresql://username:password@endpoint.neon.tech/dbname?sslmode=require"\n',
  note: 'Prisma CLI 用に DATABASE_URL を設定しました。Neon など実際の接続文字列に置き換えてください。',
}

const messages = []

function resolvePath(relativePath) {
  return path.join(rootDir, relativePath)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function copyTemplate({ template, target, description, postCopyNote }) {
  const templatePath = resolvePath(template)
  const targetPath = resolvePath(target)

  const templateAvailable = await fileExists(templatePath)
  if (!templateAvailable) {
    messages.push({
      kind: 'warn',
      message: `${description}: 雛形 ${template} が見つかりませんでした。手動で作成してください。`,
    })
    return
  }

  if (await fileExists(targetPath)) {
    messages.push({
      kind: 'info',
      message: `${description}: 既に存在するためコピーをスキップしました (${target})。`,
    })
    return
  }

  await fs.copyFile(templatePath, targetPath)
  messages.push({
    kind: 'success',
    message: `${description}: ${target} を作成しました。`,
  })

  if (postCopyNote) {
    messages.push({ kind: 'note', message: postCopyNote })
  }
}

async function ensureBackendEnv(fileConfig) {
  const targetPath = resolvePath(fileConfig.target)
  if (await fileExists(targetPath)) {
    messages.push({
      kind: 'info',
      message: `${fileConfig.description}: 既に存在するため作成をスキップしました。`,
    })
    return
  }

  const dir = path.dirname(targetPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(targetPath, fileConfig.placeholder)
  messages.push({ kind: 'success', message: `${fileConfig.description}: ${fileConfig.target} を作成しました。` })
  if (fileConfig.note) {
    messages.push({ kind: 'note', message: fileConfig.note })
  }
}

async function main() {
  await Promise.all(filesToCopy.map(copyTemplate))
  await ensureBackendEnv(backendEnvFile)

  printSummary()
}

function printSummary() {
  const icons = {
    success: '✅',
    info: 'ℹ️ ',
    warn: '⚠️',
    note: '🔧',
  }

  console.log('\nローカルセットアップ結果:')
  for (const { kind, message } of messages) {
    console.log(`  ${icons[kind] ?? '•'} ${message}`)
  }

  console.log('\n次のステップ:')
  console.log('  1. `apps/frontend/.env.local` と `apps/backend/.dev.vars` を開き、実際の値に更新してください。')
  console.log('  2. `apps/backend/.env` に設定した DATABASE_URL を本番/開発環境に合わせて書き換えてください (Prisma CLI を使う場合)。')
  console.log('  3. 準備が整ったら `pnpm dev:full` で開発サーバーを起動できます。')
}

main().catch(error => {
  console.error('ローカルセットアップ中にエラーが発生しました:', error)
  process.exitCode = 1
})
