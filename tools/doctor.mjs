#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const rootDir = process.cwd()

const ICONS = {
  pass: '✅',
  warn: '⚠️',
  fail: '❌',
  info: 'ℹ️ ',
}

const results = []

function resolve(relativePath) {
  return path.join(rootDir, relativePath)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readKeyValues(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const map = new Map()
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const delimiterIndex = line.indexOf('=')
    if (delimiterIndex <= 0) continue

    const key = line.slice(0, delimiterIndex).trim()
    const value = line.slice(delimiterIndex + 1).trim()

    if (key) {
      map.set(key, value)
    }
  }
  return map
}

function addResult(status, message) {
  results.push({ status, message })
}

async function checkNodeVersion() {
  const version = process.versions.node
  const [major] = version.split('.')
  const numericMajor = Number(major)
  if (numericMajor >= 18) {
    addResult('pass', `Node.js v${version} (>= 18)`)
  } else {
    addResult('fail', `Node.js v${version} (18以上が推奨です)`)
  }
}

async function checkPnpm() {
  try {
    const { stdout } = await execAsync('pnpm --version')
    addResult('pass', `pnpm v${stdout.trim()}`)
  } catch (error) {
    addResult('fail', 'pnpm が見つかりません。`corepack enable pnpm` などでインストールしてください。')
  }
}

async function checkEnvLocal() {
  const relativePath = 'apps/frontend/.env.local'
  const absolute = resolve(relativePath)

  if (!(await fileExists(absolute))) {
    addResult('warn', `${relativePath} が存在しません。Clerk や API の環境変数を設定してください。`)
    return
  }

  const map = await readKeyValues(absolute)
  const requiredKeys = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']

  for (const key of requiredKeys) {
    const value = map.get(key)
    if (!value || !value.trim()) {
      addResult('warn', `${relativePath}: ${key} が設定されていません。`)
    }
  }

  const baseUrl = map.get('NEXT_PUBLIC_API_BASE_URL')
  if (baseUrl) {
    if (!/^https?:\/\//.test(baseUrl)) {
      addResult('warn', `${relativePath}: NEXT_PUBLIC_API_BASE_URL (${baseUrl}) の形式が不正です。http(s):// で始まるURLにしてください。`)
    } else {
      addResult('pass', `${relativePath}: NEXT_PUBLIC_API_BASE_URL=${baseUrl}`)
    }
  }
}

async function checkDevVars() {
  const target = resolve('apps/backend/.dev.vars')
  if (!(await fileExists(target))) {
    addResult('warn', 'apps/backend/.dev.vars が存在しません。`pnpm setup:local` を実行してください。')
    return
  }

  const map = await readKeyValues(target)
  const requiredKeys = ['DATABASE_URL', 'CLERK_SECRET_KEY', 'CORS_ORIGIN']
  for (const key of requiredKeys) {
    if (!map.has(key) || !map.get(key).trim()) {
      addResult('warn', `.dev.vars: ${key} が設定されていません。`)
    }
  }

  if (map.get('CORS_ORIGIN')) {
    addResult('pass', `.dev.vars: CORS_ORIGIN=${map.get('CORS_ORIGIN')}`)
  }
}

async function checkPrismaEnv() {
  const target = resolve('apps/backend/.env')
  if (!(await fileExists(target))) {
    addResult('info', 'apps/backend/.env は見つかりませんでした（Prisma CLI 使用時にのみ必要です）。')
    return
  }

  const map = await readKeyValues(target)
  if (!map.has('DATABASE_URL') || !map.get('DATABASE_URL').trim()) {
    addResult('warn', 'apps/backend/.env: DATABASE_URL が未設定です。Prisma CLI を利用する場合は設定してください。')
  } else {
    addResult('pass', 'apps/backend/.env: DATABASE_URL が設定されています。')
  }
}

async function checkPorts() {
  // 簡易チェック：現在 8787 が使用中かどうか
  // Node.js の net モジュールを使って接続を試みる
  const net = await import('net')
  await new Promise(resolve => {
    const socket = net.createConnection({ port: 8787, host: '127.0.0.1' }, () => {
      addResult('info', 'ポート8787は現在使用中です（wrangler devが起動中の場合は正常です）。')
      socket.end()
      resolve()
    })
    socket.on('error', () => {
      addResult('pass', 'ポート8787は現在空いています。')
      resolve()
    })
  })
}

async function main() {
  console.log('環境診断を開始します...\n')
  await checkNodeVersion()
  await checkPnpm()
  await checkEnvLocal()
  await checkDevVars()
  await checkPrismaEnv()
  await checkPorts()

  console.log('診断結果:')
  let hasFailure = false
  for (const { status, message } of results) {
    if (status === 'fail') {
      hasFailure = true
    }
    console.log(`  ${ICONS[status] ?? '•'} ${message}`)
  }

  if (hasFailure) {
    process.exitCode = 1
    console.log('\n❌ 問題が見つかりました。上記のメッセージを確認して修正してください。')
  } else {
    console.log('\n✅ 主要な環境チェックを通過しました。引き続き `pnpm dev:full` で開発を開始できます。')
  }
}

main().catch(error => {
  console.error('環境診断中にエラーが発生しました:', error)
  process.exitCode = 1
})
