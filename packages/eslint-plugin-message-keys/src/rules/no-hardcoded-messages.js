/**
 * ESLint Rule: no-hardcoded-messages
 *
 * ハードコード文字列を検出してMessageKey使用を強制するルール
 *
 * 検出対象:
 * - 日本語文字列 (ひらがな・カタカナ・漢字を含む)
 * - 英語メッセージっぽい文字列 (長い文・特定パターン)
 *
 * 除外対象:
 * - console.log() 内
 * - テストファイル
 * - 設定ファイル
 * - MessageKey定数定義
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded user-facing messages, enforce MessageKey usage',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          allowedInConsole: {
            type: 'boolean',
            default: true,
          },
          allowedInTests: {
            type: 'boolean',
            default: true,
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedMessage:
        'Hardcoded user-facing message detected. Use MessageKey from registry instead.',
      japaneseString:
        'Japanese text detected: "{{text}}". Use MessageKey with tUI() or t() instead.',
      messagePattern:
        'Message-like string detected: "{{text}}". Consider using MessageKey if this is user-facing text.',
      suggestion: 'Consider using MessageKey: {{suggestion}}',
    },
  },

  create(context) {
    const options = (context.options && context.options[0]) || {}
    const allowedInConsole = options.allowedInConsole !== false
    const allowedInTests = options.allowedInTests !== false
    const ignorePatterns = options.ignorePatterns || []

    // 日本語文字検出正規表現
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/

    // 英語メッセージパターン検出正規表現
    const messagePatterns = [
      /^[A-Z][a-z].*[.!?]$/, // 大文字始まりで終端記号
      /\b(error|success|failed|complete|invalid|required|missing)\b/i, // キーワード含む
      /^.{20,}$/, // 長い文字列（20文字以上）
    ]

    // 除外すべきコンテキストかチェック
    function shouldIgnore(node) {
      const filename = context.getFilename()

      // テストファイル除外
      if (allowedInTests && /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filename)) {
        return true
      }

      // 設定ファイル・生成物・型定義ファイル除外
      if (
        /\.(config|rc)\.|generated\/|dist\/|codegen\/|\.d\.ts$/.test(filename)
      ) {
        return true
      }

      // メッセージキー関連ファイル除外（型定義、翻訳ファイル等）
      if (/messages\/(keys|types|locales|utils|index)\.ts$/.test(filename)) {
        return true
      }

      // バックエンド全体を除外（UIに関係しないため）
      if (/apps\/backend\//.test(filename)) {
        return true
      }

      // パッケージの内部実装ファイルを除外
      if (
        /packages\/.*\/(src|lib)\//.test(filename) &&
        !/frontend|ui|components/.test(filename)
      ) {
        return true
      }

      // カスタム除外パターン
      if (ignorePatterns.some(pattern => filename.includes(pattern))) {
        return true
      }

      // console.log内での使用は許可
      if (allowedInConsole && isInConsoleCall(node)) {
        return true
      }

      // MessageKey定数定義は除外
      if (isMessageKeyDefinition(node)) {
        return true
      }

      // import文・require内は除外
      if (isInImportOrRequire(node)) {
        return true
      }

      // JSX属性内（className, style等）は除外
      if (isInJSXAttribute(node)) {
        return true
      }

      // CSSクラス文字列（Tailwind等）は除外
      if (isCSSClass(node)) {
        return true
      }

      // URL・パステンプレート・ファイルパス除外
      if (isUrlOrPathTemplate(node)) {
        return true
      }

      return false
    }

    // console.log等の呼び出し内かチェック
    function isInConsoleCall(node) {
      let parent = node.parent
      while (parent) {
        if (
          parent.type === 'CallExpression' &&
          parent.callee &&
          parent.callee.object &&
          parent.callee.object.name === 'console'
        ) {
          return true
        }
        parent = parent.parent
      }
      return false
    }

    // MessageKey定数定義かチェック
    function isMessageKeyDefinition(node) {
      let parent = node.parent
      while (parent) {
        // const MESSAGE_KEY = 'key.value' パターン
        if (
          parent.type === 'VariableDeclarator' &&
          parent.id &&
          parent.id.name &&
          parent.id.name.includes('MESSAGE')
        ) {
          return true
        }
        // export const messages = {...} パターン
        if (
          parent.type === 'Property' &&
          parent.key &&
          parent.key.name &&
          /message|key|locale/i.test(parent.key.name)
        ) {
          return true
        }
        // MessageKey関数呼び出しの引数かチェック (t(), tUI(), tError()等)
        if (
          parent.type === 'CallExpression' &&
          parent.callee &&
          (parent.callee.name === 't' ||
            parent.callee.name === 'tUI' ||
            parent.callee.name === 'tError' ||
            parent.callee.name === 'tSuccess' ||
            parent.callee.name === 'tAction' ||
            parent.callee.name === 'tValidation' ||
            parent.callee.name === 'getMessageSafe')
        ) {
          return true
        }
        parent = parent.parent
      }
      return false
    }

    // import/require文内かチェック
    function isInImportOrRequire(node) {
      let parent = node.parent
      while (parent) {
        if (
          parent.type === 'ImportDeclaration' ||
          (parent.type === 'CallExpression' &&
            parent.callee &&
            parent.callee.name === 'require')
        ) {
          return true
        }
        parent = parent.parent
      }
      return false
    }

    // JSX属性内かチェック（className, style等）
    function isInJSXAttribute(node) {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXAttribute') {
          const attrName = parent.name && parent.name.name
          // className, style, id等のスタイル関連属性は除外
          if (
            [
              'className',
              'style',
              'id',
              'data-testid',
              'htmlFor',
              'role',
              'aria-label',
            ].includes(attrName)
          ) {
            return true
          }
        }
        parent = parent.parent
      }
      return false
    }

    // CSSクラス文字列かチェック（Tailwind CSS等）
    function isCSSClass(node) {
      if (typeof node.value !== 'string') {
        return false
      }

      const text = node.value

      // Tailwind CSS形式の判定
      const tailwindPatterns = [
        /^[\w-]+:[\w-]+/, // modifier:class (hover:bg-blue-500)
        /^(bg|text|border|p|m|w|h)-/, // common prefixes
        /^flex|grid|block|inline|hidden|visible/, // layout
        /^(sm|md|lg|xl|2xl):/, // responsive prefixes
        /^space-[xy]-\d+/, // spacing
        /^(rounded|shadow|cursor|focus|ring)/, // effects
      ]

      // スペース区切りの全ての部分がCSSクラスっぽいかチェック
      const parts = text.trim().split(/\s+/)
      if (parts.length > 1) {
        const allClassLike = parts.every(
          part =>
            tailwindPatterns.some(pattern => pattern.test(part)) ||
            /^[\w-]+$/.test(part) // 一般的なCSS class名
        )
        return allClassLike
      }

      // 単一のクラス名チェック
      return (
        tailwindPatterns.some(pattern => pattern.test(text)) &&
        !/[\s]/.test(text) && // スペースを含まない
        text.length > 3 &&
        text.length < 50
      ) // 適切な長さ
    }

    // 設定ファイルでの説明文字列かチェック
    function isDescriptionComment(node) {
      if (typeof node.value !== 'string') {
        return false
      }

      const text = node.value

      // 設定ファイルでよく使われる説明パターン
      const configPatterns = [
        /^[^.!?]*[接続URL|ポート|タイムアウト|設定|環境|バージョン]/,
        /^(接続|データベース|Redis|サーバー|アプリケーション|ヘルスチェック|システム)/,
        /（[^）]+）$/, // 括弧での説明
      ]

      return configPatterns.some(pattern => pattern.test(text))
    }

    // URL・パステンプレート・ファイルパス除外
    function isUrlOrPathTemplate(node) {
      if (typeof node.value !== 'string') {
        return false
      }

      const text = node.value

      // URLテンプレート（{}含む）
      if (text.includes('{}') || (text.includes('{') && text.includes('}'))) {
        return true
      }

      // ファイルパス形式
      if (/^[\.\/].*\.(json|yaml|yml|js|ts|env)$/.test(text)) {
        return true
      }

      // URL形式
      if (/^https?:\/\//.test(text) || text.includes('/.well-known/')) {
        return true
      }

      return false
    }

    // MessageKey提案生成
    function suggestMessageKey(text) {
      // 簡単なキー提案ロジック
      const cleaned = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30)

      if (japaneseRegex.test(text)) {
        return `ui.${cleaned}` // 日本語はUI系と推定
      } else if (/error|fail|invalid/.test(text)) {
        return `error.${cleaned}`
      } else if (/success|complete|done/.test(text)) {
        return `success.${cleaned}`
      } else {
        return `ui.${cleaned}`
      }
    }

    // 文字列チェック共通ロジック
    function checkStringContent(node, text) {
      // 空文字や短すぎる文字列は除外
      if (!text || text.length < 2) {
        return
      }

      // 除外コンテキストチェック
      if (shouldIgnore(node)) {
        return
      }

      // 日本語文字列検出
      if (japaneseRegex.test(text)) {
        const suggestion = suggestMessageKey(text)
        context.report({
          node,
          messageId: 'japaneseString',
          data: {
            text: text.length > 50 ? text.substring(0, 50) + '...' : text,
          },
          suggest: [
            {
              desc: `Use MessageKey: ${suggestion}`,
              fix(fixer) {
                return fixer.replaceText(node, `{t('${suggestion}')}`)
              },
            },
          ],
        })
        return
      }

      // 英語メッセージパターン検出（短い文字列は除外）
      if (text.length >= 10) {
        const isMessageLike = messagePatterns.some(pattern =>
          pattern.test(text)
        )
        if (isMessageLike) {
          const suggestion = suggestMessageKey(text)
          context.report({
            node,
            messageId: 'messagePattern',
            data: {
              text: text.length > 50 ? text.substring(0, 50) + '...' : text,
            },
            suggest: [
              {
                desc: `Use MessageKey: ${suggestion}`,
                fix(fixer) {
                  return fixer.replaceText(node, `{t('${suggestion}')}`)
                },
              },
            ],
          })
        }
      }
    }

    return {
      Literal(node) {
        // 文字列リテラルのみ対象
        if (typeof node.value !== 'string') {
          return
        }

        checkStringContent(node, node.value)
      },

      TemplateLiteral(node) {
        // テンプレートリテラル内の日本語もチェック
        const templateText = node.quasis.map(q => q.value.raw).join('{}')
        checkStringContent(node, templateText)
      },

      JSXText(node) {
        // JSX内のテキストコンテンツをチェック
        const text = node.value.trim()
        if (text) {
          checkStringContent(node, text)
        }
      },
    }
  },
}
