/**
 * ESLint Rule: require-message-key
 *
 * 特定の関数でMessageKey使用を強制するルール
 *
 * 対象関数:
 * - createSuccessResponse(), createErrorResponse(), createValidationErrorResponse()
 * - t(), tUI(), tError(), tSuccess(), tValidation() from useMessages
 *
 * 検証:
 * - MessageKey形式チェック (namespace.key_name)
 * - 実際の文字列リテラルをMessageKeyに置換提案
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce MessageKey usage in specific API functions',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          apiResponseFunctions: {
            type: 'array',
            items: { type: 'string' },
            default: [
              'createSuccessResponse',
              'createErrorResponse',
              'createValidationErrorResponse',
            ],
          },
          translationFunctions: {
            type: 'array',
            items: { type: 'string' },
            default: ['t', 'tUI', 'tError', 'tSuccess', 'tValidation'],
          },
          strictMode: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      requireMessageKey:
        'Function "{{functionName}}" requires MessageKey format (namespace.key_name), got: {{actualValue}}',
      invalidMessageKeyFormat:
        'Invalid MessageKey format "{{key}}". Expected format: namespace.key_name',
      suggestMessageKey: 'Use MessageKey instead of string literal',
      notStringLiteral:
        'MessageKey parameter must be a string literal for static validation',
    },
  },

  create(context) {
    const options = (context.options && context.options[0]) || {}
    const apiResponseFunctions = options.apiResponseFunctions || [
      'createSuccessResponse',
      'createErrorResponse',
      'createValidationErrorResponse',
    ]
    const translationFunctions = options.translationFunctions || [
      't',
      'tUI',
      'tError',
      'tSuccess',
      'tValidation',
    ]
    const strictMode = options.strictMode !== false

    // MessageKey形式チェック
    function isValidMessageKeyFormat(key) {
      // namespace.key_name形式
      return /^[a-z]+\.[a-z_]+$/.test(key)
    }

    // 既知のMessageKeyかチェック (簡易版)
    function isKnownMessageKey(key) {
      // 実際の実装では packages/shared/src/messages/keys.ts からインポートして検証
      const knownNamespaces = [
        'auth',
        'error',
        'success',
        'ui',
        'action',
        'validation',
      ]
      const namespace = key.split('.')[0]
      return knownNamespaces.includes(namespace) && isValidMessageKeyFormat(key)
    }

    // 文字列からMessageKey提案生成
    function suggestMessageKeyFromString(text) {
      const cleaned = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30)

      // 内容に基づいてnamespace推定
      if (/error|fail|invalid|not found|missing/.test(text)) {
        return `error.${cleaned}`
      } else if (/success|complete|done|saved|updated/.test(text)) {
        return `success.${cleaned}`
      } else if (/required|too short|too long|invalid format/.test(text)) {
        return `validation.${cleaned}`
      } else if (/sign|auth|login|logout/.test(text)) {
        return `auth.${cleaned}`
      } else {
        return `ui.${cleaned}`
      }
    }

    // 関数呼び出しのMessageKeyパラメータチェック
    function checkMessageKeyParameter(node, paramIndex, functionName) {
      const args = node.arguments
      if (args.length <= paramIndex) {
        return // パラメータなし（オプショナル）
      }

      const keyArg = args[paramIndex]

      // 文字列リテラル以外は静的検証できないので警告
      if (keyArg.type !== 'Literal' || typeof keyArg.value !== 'string') {
        if (strictMode) {
          context.report({
            node: keyArg,
            messageId: 'notStringLiteral',
            data: { functionName },
          })
        }
        return
      }

      const keyValue = keyArg.value

      // MessageKey形式チェック
      if (!isValidMessageKeyFormat(keyValue)) {
        // 通常の文字列っぽい場合は提案付きエラー
        if (keyValue.length > 3 && !keyValue.includes('.')) {
          const suggestion = suggestMessageKeyFromString(keyValue)
          context.report({
            node: keyArg,
            messageId: 'requireMessageKey',
            data: {
              functionName,
              actualValue: keyValue,
            },
            fix(fixer) {
              return fixer.replaceText(keyArg, `'${suggestion}'`)
            },
          })
        } else {
          context.report({
            node: keyArg,
            messageId: 'invalidMessageKeyFormat',
            data: { key: keyValue },
          })
        }
        return
      }

      // 既知のMessageKeyかチェック（簡易版）
      if (strictMode && !isKnownMessageKey(keyValue)) {
        context.report({
          node: keyArg,
          messageId: 'invalidMessageKeyFormat',
          data: { key: keyValue },
        })
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee

        // 関数名取得
        let functionName = null
        if (callee.type === 'Identifier') {
          functionName = callee.name
        } else if (callee.type === 'MemberExpression' && callee.property) {
          functionName = callee.property.name
        }

        if (!functionName) return

        // API Response関数チェック
        if (apiResponseFunctions.includes(functionName)) {
          // createSuccessResponse(data, messageKey?) → messageKey = args[1]
          // createErrorResponse(messageKey, ...) → messageKey = args[0]
          if (functionName === 'createSuccessResponse') {
            checkMessageKeyParameter(node, 1, functionName) // 2番目のパラメータ
          } else if (functionName === 'createErrorResponse') {
            checkMessageKeyParameter(node, 0, functionName) // 1番目のパラメータ
          } else if (functionName === 'createValidationErrorResponse') {
            // バリデーションエラーはMessageKey固定なのでチェック不要
          }
        }

        // Translation関数チェック
        if (translationFunctions.includes(functionName)) {
          checkMessageKeyParameter(node, 0, functionName) // 1番目のパラメータ
        }
      },
    }
  },
}
