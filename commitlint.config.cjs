/**
 * Commitlint設定 - Conventional Commits準拠
 * 新人開発者が迷わないコミットメッセージルール
 */

module.exports = {
  // Conventional Commitsの基本ルールを適用
  extends: ['@commitlint/config-conventional'],
  
  // 日本語対応 + プロジェクト固有のルール
  rules: {
    // 型（type）のルール
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメント変更
        'style',    // コードフォーマット（機能に影響しない変更）
        'refactor', // リファクタリング
        'perf',     // パフォーマンス改善
        'test',     // テスト追加・修正
        'chore',    // ビルド・設定関連
        'ci',       // CI設定変更
        'revert',   // コミットの取り消し
      ],
    ],
    
    // 件名（subject）のルール
    'subject-min-length': [2, 'always', 3],    // 最低3文字
    'subject-max-length': [2, 'always', 100],  // 最大100文字
    'subject-empty': [2, 'never'],             // 空禁止
    'subject-case': [0, 'never'],              // 大文字小文字は問わない（日本語対応）
    
    // ヘッダー全体の長さ制限
    'header-max-length': [2, 'always', 100],
    
    // 本文の行の長さ制限を緩和（日本語対応）
    'body-max-line-length': [1, 'always', 200],
    
    // フッター設定
    'footer-max-line-length': [1, 'always', 200],
  },
  
  // ヘルパー情報（新人向け）
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  
  // カスタムメッセージ（日本語）
  prompt: {
    messages: {
      type: "コミットする変更の種類を選択:",
      scope: "変更のスコープ (省略可):",
      customScope: "カスタムスコープを入力:",
      subject: "変更の簡潔な説明:",
      body: "より詳細な説明 (省略可、改行で複数行可):",
      breaking: "BREAKING CHANGES (省略可):",
      footer: "クローズするIssue (省略可。例: #123, #456):",
      confirmCommit: "上記のコミットメッセージでよろしいですか?",
    },
    types: [
      { value: 'feat', name: 'feat:     新機能' },
      { value: 'fix', name: 'fix:      バグ修正' },
      { value: 'docs', name: 'docs:     ドキュメント変更' },
      { value: 'style', name: 'style:    コードフォーマット' },
      { value: 'refactor', name: 'refactor: リファクタリング' },
      { value: 'perf', name: 'perf:     パフォーマンス改善' },
      { value: 'test', name: 'test:     テスト追加・修正' },
      { value: 'chore', name: 'chore:    ビルド・設定関連' },
      { value: 'ci', name: 'ci:       CI設定変更' },
      { value: 'revert', name: 'revert:   コミットの取り消し' },
    ],
    useEmoji: false,
    allowCustomScopes: true,
    allowEmptyScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
  },
}
