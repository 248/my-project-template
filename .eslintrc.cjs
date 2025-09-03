/** ルートは"配線"だけ。生成物は ignorePatterns で確実に除外 */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    'logs/',
    '**/*.config.*',
    '**/*.rc.*',
    '.eslintrc.*',
    'scripts/**',
    '**/next-env.d.ts',
    '**/prisma/seed.ts',
    // 生成物はここで全体除外
    '**/generated/**',
  ],

  // デフォルトパーサー設定
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },

  // 設定ファイルを TS 解析から外す（ここ重要）
  overrides: [
    {
      files: ['**/*.config.*', '**/*.rc.*', '.eslintrc.*', 'scripts/**'],
      parser: 'espree',
      parserOptions: { project: null, ecmaVersion: 2022, sourceType: 'module' },
      rules: {},
    },

    // Next.js自動生成ファイル（next-env.d.ts）は三重スラッシュルール除外
    {
      files: ['apps/frontend/next-env.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },

    // TypeScript + React ファイル（Next.js前提）
    {
      files: ['apps/frontend/**/*.{ts,tsx}', '!apps/frontend/next-env.d.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './apps/frontend/tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      env: {
        browser: true,
        es2022: true,
        node: true,
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'next/core-web-vitals',
      ],
      rules: {
        // ベース
        'prefer-const': 'error',
        'no-var': 'error',
        'no-console': 'warn',

        // any/unknown を締める
        '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-ignore': 'allow-with-description' },
        ],
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' },
        ],

        // App Router なので Pages 前提ルールは無効化
        'next/no-html-link-for-pages': 'off',

        // 型情報活用
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',

        // 未使用変数
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
      settings: {
        next: {
          rootDir: 'apps/frontend/',
        },
      },
    },

    // boundaryディレクトリは型制約緩和（"境界だけ any OK"）
    {
      files: ['apps/frontend/src/boundary/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
    },

    // Prisma境界層は開発用console許可と型アサーション許可
    {
      files: ['apps/frontend/src/server/db/**/*'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
      },
    },

    // Backend用のTypeScriptファイル
    {
      files: ['apps/backend/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './apps/backend/tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      env: {
        node: true,
        es2022: true,
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // ベース
        'prefer-const': 'error',
        'no-var': 'error',
        'no-console': 'off', // バックエンドではconsole許可

        // any/unknown を締める
        '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-ignore': 'allow-with-description' },
        ],
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' },
        ],

        // 型情報活用
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',

        // 未使用変数
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },

    // packages ディレクトリ（TypeScript ファイル）
    {
      files: ['packages/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          'packages/shared/tsconfig.json',
          'packages/ui/tsconfig.json',
          'packages/api-contracts/codegen/ts/tsconfig.json',
          'packages/config/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      env: {
        browser: true,
        es2022: true,
        node: true,
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // ベース
        'prefer-const': 'error',
        'no-var': 'error',
        'no-console': 'warn',

        // any/unknown を締める
        '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-ignore': 'allow-with-description' },
        ],
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' },
        ],

        // 型情報活用
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',

        // 未使用変数
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },

    // api-client パッケージの一時的な実装は型制約を緩和
    {
      files: ['packages/api-client/**/*'],
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
      },
    },

    // OpenAPI生成物は型チェックから除外
    {
      files: ['packages/api-client/src/generated/**/*'],
      parser: 'espree',
      parserOptions: {
        project: null,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        // 生成物なので全てのルールを緩和
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
    },
  ],
}