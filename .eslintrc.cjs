/** 
 * ESLint設定 - 段階的厳格化とパフォーマンス最適化版
 * - 型付きLintは型境界レイヤーのみに限定（高速化）
 * - 開発時warn、CI時errorの段階的厳格化
 * - 329行→120行への大幅簡素化
 */
/* eslint-env node */
const isStrict = process.env.CI === 'true' || process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  ignorePatterns: [
    // 自動生成・ビルド成果物を確実に除外
    '**/node_modules/**',
    '**/dist/**', 
    '**/.next/**',
    '**/coverage/**',
    '**/generated/**',
    '**/build/**',
    // 設定ファイル・ログ・スクリプト
    '**/*.config.*',
    '**/*.rc.*',
    '.eslintrc.cjs',
    'scripts/**',
    'logs/**',
    // Message生成物は既存通り除外
    'packages/shared/src/messages/**',
    'packages/eslint-plugin-message-keys/**',
    'tools/**',
    'contracts/**',
  ],

  // デフォルト設定（型情報なし＝高速）
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: false, // 型境界レイヤー以外は型情報不使用
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  // import解決設定
  settings: {
    'import/resolver': {
      typescript: { 
        project: [
          './tsconfig.eslint.json',
          './apps/frontend/tsconfig.json',
          './apps/backend/tsconfig.json',
          './packages/shared/tsconfig.json',
          './packages/ui/tsconfig.json',
          './packages/config/tsconfig.json',
        ]
      }
    }
  },

  plugins: [
    '@typescript-eslint',
    'unused-imports', 
    'import',
    'react',
    '@template/message-keys',
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript', 
    'plugin:prettier/recommended',
  ],

  // ベースルール（開発速度優先）
  rules: {
    // 段階的厳格化
    'no-console': isStrict ? 'error' : 'off',
    '@typescript-eslint/no-explicit-any': isStrict ? 'error' : 'warn',

    // 実害が大きいので常時強化
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn', 
      { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],

    // import健全性（循環依存・解決ミス防止）
    'import/no-unresolved': 'error',
    'import/no-cycle': isStrict ? 'error' : 'warn',
    'import/order': ['warn', {
      groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true }
    }],

    // TypeScript基本ルール
    'prefer-const': 'error',
    'no-var': 'error',
  },

  overrides: [
    // 1) FRONTEND（Next.js + React）
    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      env: { browser: true, es2022: true },
      extends: [
        'next/core-web-vitals',
        'plugin:react/recommended',
        'plugin:@template/message-keys/recommended',
      ],
      settings: {
        react: { version: 'detect' },
        next: { rootDir: 'apps/frontend/' },
      },
      rules: {
        // React/Next.js専用ルール
        'react/react-in-jsx-scope': 'off', // Next.js 13+では不要
        'react/jsx-no-useless-fragment': isStrict ? 'error' : 'warn',
        'next/no-html-link-for-pages': 'off', // App Router対応
        // Message Keys段階的移行
        '@template/message-keys/no-hardcoded-messages': 'warn',
      }
    },

    // 2) BACKEND（Node.js + Cloudflare Workers）
    {
      files: ['apps/backend/**/*.{ts,tsx}'],
      env: { node: true, es2022: true },
      rules: {
        'no-console': 'off', // バックエンドではログ出力を許可
        'no-process-env': 'off', // バックエンドでは環境変数アクセスを許可
        // Message Keys無効化（バックエンドでは不要）
        '@template/message-keys/no-hardcoded-messages': 'off',
        '@template/message-keys/require-message-key': 'off',
      }
    },

    // 3) TYPE-BOUNDARY（型境界レイヤー・ここだけ型付きLint）
    {
      files: [
        // 既存の型境界ディレクトリ
        'apps/frontend/src/boundary/**/*.{ts,tsx}',
        'apps/frontend/src/server/db/**/*.{ts,tsx}',
        'packages/api-client/**/*.{ts,tsx}',
        // 新規型境界（外部I/O入口）
        'apps/backend/**/env*.{ts,tsx}',
        'apps/backend/**/config*.{ts,tsx}',
        'packages/shared/type-boundary/**/*.{ts,tsx}',
        // routes/handlers（API境界）
        '**/{routes,handlers,adapters}/**/*.{ts,tsx}',
      ],
      parserOptions: {
        // 型付きLintを有効化（重いので境界のみ）
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
      extends: [
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // 型境界では厳格化（no-unsafe系の発生源を抑制）
        '@typescript-eslint/no-unsafe-assignment': isStrict ? 'error' : 'warn',
        '@typescript-eslint/no-unsafe-member-access': isStrict ? 'error' : 'warn', 
        '@typescript-eslint/no-unsafe-call': isStrict ? 'error' : 'warn',
        '@typescript-eslint/no-unsafe-return': isStrict ? 'error' : 'warn',
        '@typescript-eslint/no-unsafe-argument': isStrict ? 'error' : 'warn',
        '@typescript-eslint/restrict-template-expressions': [
          isStrict ? 'error' : 'warn',
          { allowNumber: true, allowBoolean: true }
        ],
        // 型アサーションは境界では必要に応じて許可
        '@typescript-eslint/consistent-type-assertions': [
          'warn',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' }
        ],
        // 型境界ではconsole使用を許可（デバッグのため）
        'no-console': 'off',
        // Message Keys無効化（外部I/O層では不要）
        '@template/message-keys/no-hardcoded-messages': 'off',
        '@template/message-keys/require-message-key': 'off',
      }
    },

    // 4) 自動生成ファイル（全ルール緩和）
    {
      files: [
        'packages/api-contracts/codegen/ts/src/generated/**/*',
        'apps/frontend/next-env.d.ts',
        '**/prisma/seed.ts',
      ],
      parser: 'espree',
      parserOptions: { project: null },
      rules: {
        // 生成物は全てのルールを無効化
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        'unused-imports/no-unused-imports': 'off',
      }
    },
  ],
};