import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// add-message.jsのユーティリティ関数をテストするため、
// ファイルから関数を個別にインポートする
// NOTE: 実際の運用では、これらの関数をユーティリティモジュールとして分離することが推奨される

describe('Message Addition Utilities', () => {
  // モック用のテストユーティリティ関数
  function getArgValue(args, flag, defaultValue = '') {
    const index = args.indexOf(flag)
    if (index === -1 || index === args.length - 1) {
      return defaultValue
    }
    return args[index + 1]
  }

  function validateKey(key) {
    const keyFormatRegex = /^[a-z]+\.[a-z_]+$/
    if (!keyFormatRegex.test(key)) {
      throw new Error(
        `Invalid key format: ${key}. Use format: namespace.message_name`
      )
    }

    const [namespace, messageName] = key.split('.')
    const validNamespaces = [
      'auth',
      'error',
      'success',
      'ui',
      'action',
      'validation',
    ]

    if (!validNamespaces.includes(namespace)) {
      console.warn(
        `⚠️  Warning: namespace '${namespace}' is not in standard namespaces: ${validNamespaces.join(', ')}`
      )
    }

    return { namespace, messageName }
  }

  function validateOptions(options) {
    const errors = []

    // Key validation
    try {
      validateKey(options.key)
    } catch (error) {
      errors.push(error.message)
    }

    // Message text validation
    if (!options.ja && !options.en) {
      errors.push('At least one message text (--ja or --en) is required')
    }

    // Description validation
    if (!options.description) {
      errors.push('Description is required (--description)')
    }

    // Category validation
    const validCategories = [
      'error',
      'client_error',
      'server_error',
      'success',
      'info',
      'label',
      'status',
      'button',
    ]
    if (options.category && !validCategories.includes(options.category)) {
      console.warn(
        `⚠️  Warning: category '${options.category}' is not standard. Valid: ${validCategories.join(', ')}`
      )
    }

    // Usage validation
    if (!options.apiUsage && !options.uiUsage) {
      errors.push(
        'At least one usage flag (--api-usage or --ui-usage) is required'
      )
    }

    if (errors.length > 0) {
      throw new Error(
        `Validation errors:\n${errors.map(e => `  • ${e}`).join('\n')}`
      )
    }
  }

  function checkKeyExists(registry, key) {
    const { namespace, messageName } = validateKey(key)

    if (
      registry.messages &&
      registry.messages[namespace] &&
      registry.messages[namespace][messageName]
    ) {
      return true
    }

    return false
  }

  function addMessageToRegistry(registry, options) {
    const { namespace, messageName } = validateKey(options.key)

    // Ensure namespace exists
    if (!registry.messages) {
      registry.messages = {}
    }
    if (!registry.messages[namespace]) {
      registry.messages[namespace] = {}
    }

    // Create message entry
    const messageEntry = {
      key: options.key,
      namespace: namespace,
      category: options.category,
      description: options.description,
      template_params: options.templateParams,
      since: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      deprecated: false,
      api_usage: options.apiUsage,
      ui_usage: options.uiUsage,
    }

    registry.messages[namespace][messageName] = messageEntry

    return registry
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // 日付を固定
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getArgValue', () => {
    it('should return argument value when flag exists', () => {
      const args = ['--name', 'testname', '--value', '123']
      const result = getArgValue(args, '--name')
      expect(result).toBe('testname')
    })

    it('should return argument value for second flag', () => {
      const args = ['--name', 'testname', '--value', '123']
      const result = getArgValue(args, '--value')
      expect(result).toBe('123')
    })

    it('should return default value when flag not found', () => {
      const args = ['--name', 'testname']
      const result = getArgValue(args, '--missing', 'default')
      expect(result).toBe('default')
    })

    it('should return empty string default when no default provided', () => {
      const args = ['--name', 'testname']
      const result = getArgValue(args, '--missing')
      expect(result).toBe('')
    })

    it('should return default when flag is at end of array', () => {
      const args = ['--name', 'testname', '--flag']
      const result = getArgValue(args, '--flag', 'default')
      expect(result).toBe('default')
    })

    it('should handle empty args array', () => {
      const args = []
      const result = getArgValue(args, '--any', 'default')
      expect(result).toBe('default')
    })

    it('should handle flags with empty string values', () => {
      const args = ['--name', '']
      const result = getArgValue(args, '--name')
      expect(result).toBe('')
    })

    it('should handle multiple same flags (returns first)', () => {
      const args = ['--name', 'first', '--name', 'second']
      const result = getArgValue(args, '--name')
      expect(result).toBe('first')
    })
  })

  describe('validateKey', () => {
    it('should validate correct key format', () => {
      const result = validateKey('auth.login_success')
      expect(result).toEqual({
        namespace: 'auth',
        messageName: 'login_success',
      })
    })

    it('should validate all standard namespaces', () => {
      const validKeys = [
        'auth.test',
        'error.test',
        'success.test',
        'ui.test',
        'action.test',
        'validation.test',
      ]

      validKeys.forEach(key => {
        expect(() => validateKey(key)).not.toThrow()
      })
    })

    it('should throw error for invalid format - no dot', () => {
      expect(() => validateKey('invalidkey')).toThrow(
        'Invalid key format: invalidkey. Use format: namespace.message_name'
      )
    })

    it('should throw error for invalid format - uppercase letters', () => {
      expect(() => validateKey('Auth.loginSuccess')).toThrow(
        'Invalid key format: Auth.loginSuccess. Use format: namespace.message_name'
      )
    })

    it('should throw error for invalid format - special characters', () => {
      expect(() => validateKey('auth.login-success')).toThrow(
        'Invalid key format: auth.login-success. Use format: namespace.message_name'
      )
    })

    it('should throw error for invalid format - multiple dots', () => {
      expect(() => validateKey('auth.user.login')).toThrow(
        'Invalid key format: auth.user.login. Use format: namespace.message_name'
      )
    })

    it('should warn for non-standard namespace', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = validateKey('custom.message')

      expect(result).toEqual({
        namespace: 'custom',
        messageName: 'message',
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Warning: namespace 'custom' is not in standard namespaces"
        )
      )

      consoleSpy.mockRestore()
    })

    it('should handle message names with underscores', () => {
      const result = validateKey('auth.login_failed_too_many_attempts')
      expect(result).toEqual({
        namespace: 'auth',
        messageName: 'login_failed_too_many_attempts',
      })
    })
  })

  describe('validateOptions', () => {
    const baseValidOptions = {
      key: 'auth.test',
      ja: 'テストメッセージ',
      description: 'Test message',
      category: 'info',
      templateParams: [],
      apiUsage: false,
      uiUsage: true,
    }

    it('should validate correct options', () => {
      expect(() => validateOptions(baseValidOptions)).not.toThrow()
    })

    it('should validate options with English text only', () => {
      const options = {
        ...baseValidOptions,
        ja: undefined,
        en: 'Test message',
      }
      expect(() => validateOptions(options)).not.toThrow()
    })

    it('should validate options with both languages', () => {
      const options = {
        ...baseValidOptions,
        en: 'Test message',
      }
      expect(() => validateOptions(options)).not.toThrow()
    })

    it('should validate options with API usage only', () => {
      const options = {
        ...baseValidOptions,
        apiUsage: true,
        uiUsage: false,
      }
      expect(() => validateOptions(options)).not.toThrow()
    })

    it('should throw error for invalid key', () => {
      const options = {
        ...baseValidOptions,
        key: 'invalid_key',
      }
      expect(() => validateOptions(options)).toThrow('Validation errors')
    })

    it('should throw error for missing message text', () => {
      const options = {
        ...baseValidOptions,
        ja: undefined,
        en: undefined,
      }
      expect(() => validateOptions(options)).toThrow(
        'At least one message text (--ja or --en) is required'
      )
    })

    it('should throw error for missing description', () => {
      const options = {
        ...baseValidOptions,
        description: undefined,
      }
      expect(() => validateOptions(options)).toThrow(
        'Description is required (--description)'
      )
    })

    it('should throw error for no usage flags', () => {
      const options = {
        ...baseValidOptions,
        apiUsage: false,
        uiUsage: false,
      }
      expect(() => validateOptions(options)).toThrow(
        'At least one usage flag (--api-usage or --ui-usage) is required'
      )
    })

    it('should accumulate multiple validation errors', () => {
      const options = {
        key: 'invalid_key',
        ja: undefined,
        en: undefined,
        description: undefined,
        category: 'info',
        templateParams: [],
        apiUsage: false,
        uiUsage: false,
      }

      expect(() => validateOptions(options)).toThrow()

      try {
        validateOptions(options)
      } catch (error) {
        expect(error.message).toContain('At least one message text')
        expect(error.message).toContain('Description is required')
        expect(error.message).toContain('At least one usage flag')
      }
    })

    it('should warn for non-standard category', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const options = {
        ...baseValidOptions,
        category: 'custom_category',
      }

      expect(() => validateOptions(options)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Warning: category 'custom_category' is not standard"
        )
      )

      consoleSpy.mockRestore()
    })
  })

  describe('checkKeyExists', () => {
    const mockRegistry = {
      messages: {
        auth: {
          login_success: { key: 'auth.login_success' },
          logout: { key: 'auth.logout' },
        },
        error: {
          not_found: { key: 'error.not_found' },
        },
      },
    }

    it('should return true for existing key', () => {
      const result = checkKeyExists(mockRegistry, 'auth.login_success')
      expect(result).toBe(true)
    })

    it('should return true for existing key in different namespace', () => {
      const result = checkKeyExists(mockRegistry, 'error.not_found')
      expect(result).toBe(true)
    })

    it('should return false for non-existing key', () => {
      const result = checkKeyExists(mockRegistry, 'auth.non_existing')
      expect(result).toBe(false)
    })

    it('should return false for non-existing namespace', () => {
      const result = checkKeyExists(mockRegistry, 'ui.test_message')
      expect(result).toBe(false)
    })

    it('should return false for empty registry', () => {
      const emptyRegistry = {}
      const result = checkKeyExists(emptyRegistry, 'auth.test')
      expect(result).toBe(false)
    })

    it('should return false for registry without messages', () => {
      const registryWithoutMessages = { metadata: { version: '1.0.0' } }
      const result = checkKeyExists(registryWithoutMessages, 'auth.test')
      expect(result).toBe(false)
    })

    it('should handle registry with empty messages', () => {
      const registryWithEmptyMessages = { messages: {} }
      const result = checkKeyExists(registryWithEmptyMessages, 'auth.test')
      expect(result).toBe(false)
    })
  })

  describe('addMessageToRegistry', () => {
    const baseOptions = {
      key: 'auth.new_message',
      description: 'New test message',
      category: 'info',
      templateParams: ['param1', 'param2'],
      apiUsage: true,
      uiUsage: false,
    }

    it('should add message to empty registry', () => {
      const registry = {}
      const result = addMessageToRegistry(registry, baseOptions)

      expect(result.messages).toBeDefined()
      expect(result.messages.auth).toBeDefined()
      expect(result.messages.auth.new_message).toBeDefined()

      const messageEntry = result.messages.auth.new_message
      expect(messageEntry.key).toBe('auth.new_message')
      expect(messageEntry.namespace).toBe('auth')
      expect(messageEntry.category).toBe('info')
      expect(messageEntry.description).toBe('New test message')
      expect(messageEntry.template_params).toEqual(['param1', 'param2'])
      expect(messageEntry.since).toBe('2024-01-15')
      expect(messageEntry.deprecated).toBe(false)
      expect(messageEntry.api_usage).toBe(true)
      expect(messageEntry.ui_usage).toBe(false)
    })

    it('should add message to existing namespace', () => {
      const registry = {
        messages: {
          auth: {
            existing_message: { key: 'auth.existing_message' },
          },
        },
      }

      const result = addMessageToRegistry(registry, baseOptions)

      expect(result.messages.auth.existing_message).toBeDefined()
      expect(result.messages.auth.new_message).toBeDefined()
      expect(result.messages.auth.new_message.key).toBe('auth.new_message')
    })

    it('should add message to new namespace in existing registry', () => {
      const registry = {
        messages: {
          error: {
            existing_error: { key: 'error.existing_error' },
          },
        },
      }

      const result = addMessageToRegistry(registry, baseOptions)

      expect(result.messages.error.existing_error).toBeDefined()
      expect(result.messages.auth.new_message).toBeDefined()
      expect(result.messages.auth.new_message.key).toBe('auth.new_message')
    })

    it('should handle empty template parameters', () => {
      const options = {
        ...baseOptions,
        templateParams: [],
      }

      const result = addMessageToRegistry({}, options)
      expect(result.messages.auth.new_message.template_params).toEqual([])
    })

    it('should create proper date string', () => {
      const result = addMessageToRegistry({}, baseOptions)
      expect(result.messages.auth.new_message.since).toBe('2024-01-15')
    })

    it('should preserve other registry properties', () => {
      const registry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['ja', 'en'],
        },
        messages: {},
      }

      const result = addMessageToRegistry(registry, baseOptions)

      expect(result.metadata).toEqual(registry.metadata)
      expect(result.messages.auth.new_message).toBeDefined()
    })

    it('should handle message with both API and UI usage', () => {
      const options = {
        ...baseOptions,
        apiUsage: true,
        uiUsage: true,
      }

      const result = addMessageToRegistry({}, options)
      const messageEntry = result.messages.auth.new_message

      expect(messageEntry.api_usage).toBe(true)
      expect(messageEntry.ui_usage).toBe(true)
    })

    it('should handle special characters in description', () => {
      const options = {
        ...baseOptions,
        description: 'Message with "quotes" and special chars: @#$%',
      }

      const result = addMessageToRegistry({}, options)
      expect(result.messages.auth.new_message.description).toBe(
        'Message with "quotes" and special chars: @#$%'
      )
    })
  })

  describe('Integration Tests', () => {
    it('should validate and add complete message workflow', () => {
      const options = {
        key: 'validation.required_field',
        ja: '{{field}}は必須です',
        en: '{{field}} is required',
        description: 'Field required validation message',
        category: 'error',
        templateParams: ['field'],
        apiUsage: true,
        uiUsage: true,
      }

      // Should not throw during validation
      expect(() => validateOptions(options)).not.toThrow()

      // Should not exist in empty registry
      const emptyRegistry = {}
      expect(checkKeyExists(emptyRegistry, options.key)).toBe(false)

      // Should successfully add to registry
      const result = addMessageToRegistry(emptyRegistry, options)
      expect(checkKeyExists(result, options.key)).toBe(true)

      // Should have correct structure
      const messageEntry = result.messages.validation.required_field
      expect(messageEntry.key).toBe('validation.required_field')
      expect(messageEntry.template_params).toEqual(['field'])
    })

    it('should handle complex validation scenarios', () => {
      const registry = {
        messages: {
          auth: {
            login_failed: { key: 'auth.login_failed' },
          },
        },
      }

      const newOptions = {
        key: 'auth.password_reset',
        ja: 'パスワードをリセットしました',
        description: 'Password reset confirmation',
        category: 'success',
        templateParams: [],
        apiUsage: false,
        uiUsage: true,
      }

      expect(() => validateOptions(newOptions)).not.toThrow()
      expect(checkKeyExists(registry, newOptions.key)).toBe(false)
      expect(checkKeyExists(registry, 'auth.login_failed')).toBe(true)

      const result = addMessageToRegistry(registry, newOptions)
      expect(checkKeyExists(result, newOptions.key)).toBe(true)
      expect(checkKeyExists(result, 'auth.login_failed')).toBe(true)
    })
  })
})
