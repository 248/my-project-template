import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('TypeScript Code Generation', () => {
  const testDataDir = path.resolve(__dirname, 'fixtures')
  const testOutputDir = path.resolve(testDataDir, 'output')
  const testRegistryPath = path.resolve(testDataDir, 'test-registry.yaml')
  const testConfigPath = path.resolve(testDataDir, 'test-config.json')
  const testOutputPath = path.resolve(testOutputDir, 'test-keys.ts')

  beforeEach(() => {
    // テスト用ディレクトリ作成
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true })
    }
  })

  afterEach(() => {
    // テストファイルのクリーンアップ
    const cleanupFiles = [testRegistryPath, testConfigPath, testOutputPath]
    cleanupFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    })
  })

  describe('Basic Code Generation', () => {
    it('should generate valid TypeScript code with proper types', () => {
      const testRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
          supported_locales: ['ja', 'en'],
        },
        messages: {
          auth: {
            signin_required: {
              key: 'auth.signin_required',
              namespace: 'auth',
              category: 'error',
              description: 'User authentication required',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
            welcome: {
              key: 'auth.welcome',
              namespace: 'auth',
              category: 'success',
              description: 'Welcome message with user name',
              template_params: ['userName'],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
          },
          validation: {
            required_field: {
              key: 'validation.required_field',
              namespace: 'validation',
              category: 'error',
              description: 'Field is required',
              template_params: ['fieldName'],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
          },
        },
      }

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/test-keys.ts',
            imports: [],
          },
        },
        validation: { strict_mode: false },
        openapi_integration: { enabled: false },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      // TypeScript生成実行
      execSync('node tools/message-codegen/generate-typescript.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
      })

      // 生成されたファイルを確認
      expect(fs.existsSync(testOutputPath)).toBe(true)

      const generatedCode = fs.readFileSync(testOutputPath, 'utf8')

      // 期待する内容をチェック
      expect(generatedCode).toContain(
        'Generated Message Keys - DO NOT EDIT MANUALLY'
      )
      expect(generatedCode).toContain('export const MESSAGE_KEYS')
      expect(generatedCode).toContain(
        "'auth.signin_required': 'auth.signin_required'"
      )
      expect(generatedCode).toContain("'auth.welcome': 'auth.welcome'")
      expect(generatedCode).toContain(
        "'validation.required_field': 'validation.required_field'"
      )

      // 基本的な型定義が含まれているかチェック
      expect(generatedCode).toContain('export type MessageKey')
      expect(generatedCode).toContain('export interface MessageMetadata')
    })

    it('should generate correct multiple namespace structure', () => {
      const testRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          ui: {
            save_button: {
              key: 'ui.save_button',
              namespace: 'ui',
              category: 'ui',
              description: 'Save button text',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
            cancel_button: {
              key: 'ui.cancel_button',
              namespace: 'ui',
              category: 'ui',
              description: 'Cancel button text',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
          },
        },
      }

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/test-keys.ts',
            imports: [],
          },
        },
        openapi_integration: { enabled: false },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      execSync('node tools/message-codegen/generate-typescript.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
      })

      const generatedCode = fs.readFileSync(testOutputPath, 'utf8')

      // フラット構造が正しく生成されているかチェック
      expect(generatedCode).toContain('export const MESSAGE_KEYS')
      expect(generatedCode).toContain("'ui.save_button': 'ui.save_button'")
      expect(generatedCode).toContain("'ui.cancel_button': 'ui.cancel_button'")
    })

    it('should handle messages with template parameters correctly', () => {
      const testRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          notification: {
            user_joined: {
              key: 'notification.user_joined',
              namespace: 'notification',
              category: 'info',
              description: 'User joined notification',
              template_params: ['userName', 'roomName'],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
          },
        },
      }

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/test-keys.ts',
            imports: [],
          },
        },
        openapi_integration: { enabled: false },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      execSync('node tools/message-codegen/generate-typescript.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
      })

      const generatedCode = fs.readFileSync(testOutputPath, 'utf8')

      expect(generatedCode).toContain(
        "'notification.user_joined': 'notification.user_joined'"
      )
      // メタデータにテンプレートパラメータが含まれることを確認
      expect(generatedCode).toContain(
        "templateParams: ['userName', 'roomName']"
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty registry gracefully', () => {
      const emptyRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {},
      }

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/test-keys.ts',
            imports: [],
          },
        },
        openapi_integration: { enabled: false },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(emptyRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/generate-typescript.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        })
      }).not.toThrow()

      // 空の構造でも有効なTypeScriptが生成されるかチェック
      const generatedCode = fs.readFileSync(testOutputPath, 'utf8')
      expect(generatedCode).toContain('export const MESSAGE_KEYS')
    })
  })

  describe('Configuration Integration', () => {
    it('should generate file regardless of enabled setting (individual generator)', () => {
      const testRegistry = {
        metadata: { version: '1.0.0' },
        messages: {
          test: {
            message: {
              key: 'test.message',
              namespace: 'test',
              category: 'info',
              description: 'Test message',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
          },
        },
      }

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: false, // 個別実行時は設定に関係なく生成される
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/test-keys.ts',
            imports: [],
          },
        },
        openapi_integration: { enabled: false },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      // 個別生成ツールは enabled 設定に関係なくファイル生成する
      execSync('node tools/message-codegen/generate-typescript.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
      })

      expect(fs.existsSync(testOutputPath)).toBe(true)
    })
  })
})
