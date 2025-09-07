#!/usr/bin/env node

/**
 * 品質チェック支援スクリプト
 * PR前の品質チェックを段階的に実行し、結果を分かりやすく表示
 */

import { execSync } from 'child_process'
import chalk from 'chalk'
import readline from 'readline'

// ログ出力ユーティリティ
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  step: (msg) => console.log(chalk.cyan(`\n🔄 ${msg}`)),
}

// コマンド実行ヘルパー
function runCommand(command, description) {
  log.step(description)
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    log.success(`${description} - 完了`)
    return true
  } catch (error) {
    log.error(`${description} - 失敗`)
    log.error(`エラーの詳細は上記の出力を確認してください`)
    return false
  }
}

// ユーザー入力取得
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase().startsWith('y'))
    })
  })
}

// 対処法表示
function showTroubleshootingTips(command) {
  const tips = {
    'pnpm codegen': [
      '• OpenAPI仕様ファイル（packages/api-contracts/openapi.yaml）の構文エラーを確認',
      '• 参照している`$ref`の定義が不足していないか確認',
      '• 必須フィールドの未定義がないか確認',
    ],
    'pnpm type-check': [
      '• TypeScriptエラーの確認：型定義の不整合がないか確認',
      '• 自動生成更新：pnpm codegen && pnpm db:generate を実行',
      '• import文の確認：存在しないファイル・モジュールをimportしていないか確認',
    ],
    'pnpm lint': [
      '• 自動修正を試す：pnpm lint:fix を実行',
      '• ESLint設定確認：ルール違反の内容を確認',
      '• ファイル固有の問題：特定ファイルの修正が必要か確認',
    ],
    'pnpm format:check': [
      '• 自動フォーマット：pnpm format を実行',
      '• エディタ設定確認：Prettierの設定が正しく動作しているか確認',
    ],
    'pnpm build': [
      '• 型チェック・Lintの事前確認：上記のチェックが通っているか確認',
      '• 依存関係確認：package.jsonの依存関係が正しいか確認',
      '• 環境変数確認：ビルドに必要な環境変数が設定されているか確認',
    ],
  }

  if (tips[command]) {
    log.info('対処方法：')
    tips[command].forEach(tip => console.log(`  ${tip}`))
  }
}

// 結果表示
function showResults(results, hasError) {
  console.log(chalk.bold.blue('\n📊 品質チェック結果\n'))
  
  results.forEach(result => {
    const status = result.success ? chalk.green('✅ 成功') : chalk.red('❌ 失敗')
    console.log(`${status} ${result.description}`)
  })

  console.log() // 改行

  if (hasError) {
    log.error('品質チェックで問題が発見されました')
    log.info('上記の問題を修正してから、再度チェックを実行してください')
    log.info('修正後は node tools/quality-check.mjs で再チェックできます')
    process.exit(1)
  } else {
    log.success('すべての品質チェックが完了しました！')
    log.success('PRの作成準備が整っています 🎉')
    
    console.log(chalk.bold.green('\n🚀 次のステップ:'))
    console.log('  1. git add . && git commit -m "説明的なコミットメッセージ"')
    console.log('  2. git push origin feature/your-branch-name')
    console.log('  3. GitHubでPR作成')
    
    process.exit(0)
  }
}

// 品質チェック実行関数
async function runQualityChecks() {
  console.log(chalk.bold.blue('\n🎯 品質チェックを開始します...\n'))

  const checks = [
    {
      command: 'pnpm codegen',
      description: 'OpenAPI型生成',
      required: true,
    },
    {
      command: 'pnpm type-check',
      description: 'TypeScript型チェック',
      required: true,
    },
    {
      command: 'pnpm lint',
      description: 'ESLintコード品質チェック',
      required: true,
    },
    {
      command: 'pnpm format:check',
      description: 'Prettierフォーマット確認',
      required: true,
    },
    {
      command: 'pnpm build',
      description: 'ビルド確認',
      required: true,
    },
  ]

  const results = []
  let hasError = false

  for (const check of checks) {
    const success = runCommand(check.command, check.description)
    results.push({ ...check, success })
    
    if (!success && check.required) {
      hasError = true
      log.warning(`必須チェック「${check.description}」が失敗しました`)
      
      // 対処法を表示
      showTroubleshootingTips(check.command)
      
      // ユーザーに継続確認
      const shouldContinue = await askQuestion('\n続行しますか？ (y/N): ')
      if (!shouldContinue) {
        log.info('品質チェックを中断しました。問題を修正してから再実行してください。')
        process.exit(1)
      }
    }
  }

  // 結果サマリー
  showResults(results, hasError)
}

// スクリプト実行
runQualityChecks().catch(error => {
  log.error(`予期しないエラーが発生しました: ${error.message}`)
  process.exit(1)
})