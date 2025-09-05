/**
 * ESLint Plugin for MessageKey enforcement
 *
 * Phase 5 開発者体験向上: ハードコードメッセージ復活防止
 */

const noHardcodedMessages = require('./rules/no-hardcoded-messages')
const requireMessageKey = require('./rules/require-message-key')

module.exports = {
  meta: {
    name: '@template/eslint-plugin-message-keys',
    version: '0.1.0',
  },

  rules: {
    'no-hardcoded-messages': noHardcodedMessages,
    'require-message-key': requireMessageKey,
  },

  configs: {
    recommended: {
      plugins: ['@template/message-keys'],
      rules: {
        '@template/message-keys/no-hardcoded-messages': 'error',
        '@template/message-keys/require-message-key': 'error',
      },
    },
  },
}
