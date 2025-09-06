/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // テスト環境の設定
    environment: 'jsdom',

    // グローバル設定
    globals: true,

    // セットアップファイル
    setupFiles: ['./vitest.setup.js'],

    // テストファイルの検索パターン
    include: [
      '**/__tests__/**/*.{js,ts,jsx,tsx}',
      '**/?(*.)+(spec|test).{js,ts,jsx,tsx}',
    ],

    // 除外パターン
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.cache/**',
      '**/infra/**',
      '**/.next/**',
      '**/coverage/**',
    ],

    // レポーター設定
    reporter: ['verbose', 'json', 'html'],

    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'infra/',
        '**/*.config.{js,ts}',
        '**/types.ts',
        '**/*.d.ts',
        'packages/api-contracts/codegen/ts/src/generated/**',
      ],
    },

    // タイムアウト設定
    testTimeout: 10000,
    hookTimeout: 10000,

    // 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },

  // エイリアス設定
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/frontend/src'),
      '@shared': resolve(__dirname, 'packages/shared/src'),
      '@ui': resolve(__dirname, 'packages/ui/src'),
      '@config': resolve(__dirname, 'packages/config/src'),
      '@frontend': resolve(__dirname, 'apps/frontend/src'),
      '@backend': resolve(__dirname, 'apps/backend/src'),
      '@template/api-contracts-ts': resolve(
        __dirname,
        'packages/api-contracts/codegen/ts/src'
      ),
    },
  },

  // 外部モジュールの変換設定
  esbuild: {
    target: 'node14',
  },
})
