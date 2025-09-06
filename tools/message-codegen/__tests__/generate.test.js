import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Message Code Generation Orchestrator', () => {
  const testDataDir = path.resolve(__dirname, 'fixtures')
  const testOutputDir = path.resolve(testDataDir, 'output')
  const testRegistryPath = path.resolve(testDataDir, 'test-registry.yaml')
  const testConfigPath = path.resolve(testDataDir, 'test-config.json')

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
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  describe('Full Generation Pipeline', () => {
    it('should generate all enabled targets successfully', () => {
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
          },
          ui: {
            welcome: {
              key: 'ui.welcome',
              namespace: 'ui',
              category: 'info',
              description: 'Welcome message',
              template_params: ['userName'],
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
          version: '1.0.0',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
            imports: [
              '// Generated from test registry - DO NOT EDIT MANUALLY',
              '// Run test generation to regenerate',
            ],
          },
        },
        validation: {
          strict_mode: true,
          check_completeness: true,
          check_consistency: true,
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      const output = execSync('node tools/message-codegen/generate.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        encoding: 'utf8',
      })

      // 成功メッセージを確認
      expect(output).toContain(
        'Starting multi-language message code generation'
      )
      expect(output).toContain('TypeScript code generation completed')
      expect(output).toMatch(/completed for \d+ messages across \d+ namespaces/)

      // 生成されたファイルを確認
      const generatedTsPath = path.resolve(testOutputDir, 'keys.ts')
      expect(fs.existsSync(generatedTsPath)).toBe(true)

      const generatedContent = fs.readFileSync(generatedTsPath, 'utf8')
      expect(generatedContent).toContain(
        '// Generated from test registry - DO NOT EDIT MANUALLY'
      )
      expect(generatedContent).toContain('auth: {')
      expect(generatedContent).toContain(
        "signin_required: 'auth.signin_required'"
      )
      expect(generatedContent).toContain('ui: {')
      expect(generatedContent).toContain("welcome: 'ui.welcome'")
    })

    it('should handle registry validation in generation pipeline', () => {
      const invalidRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          invalid: {
            missing_fields: {
              key: 'invalid.missing_fields',
              // missing required fields
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
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
          },
        },
        validation: {
          strict_mode: true,
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(invalidRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/generate.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })
  })

  describe('Configuration Handling', () => {
    it('should use default configuration when no config file specified', () => {
      // デフォルト設定での実行（実際のファイルを使用）
      const output = execSync('node tools/message-codegen/generate.js', {
        encoding: 'utf8',
      })

      expect(output).toContain(
        'Starting multi-language message code generation'
      )
    })

    it('should handle disabled targets correctly', () => {
      const testRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
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
            enabled: false, // 無効化
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
          },
        },
        validation: {
          strict_mode: false,
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      const output = execSync('node tools/message-codegen/generate.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        encoding: 'utf8',
      })

      // TypeScript生成がスキップされることを確認
      expect(output).toContain(
        'Starting multi-language message code generation'
      )
      expect(output).not.toContain('TypeScript code generation completed')

      // ファイルが生成されていないことを確認
      const generatedTsPath = path.resolve(testOutputDir, 'keys.ts')
      expect(fs.existsSync(generatedTsPath)).toBe(false)
    })
  })

  describe('Error Reporting', () => {
    it('should provide clear error messages for missing registry file', () => {
      const testConfig = {
        registry: {
          path: 'nonexistent-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
          },
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/generate.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })

    it('should provide clear error messages for invalid YAML', () => {
      const invalidYaml = `
metadata:
  version: '1.0.0'
messages:
  invalid:
    - this is not valid YAML structure for our schema
      missing proper nesting
      `

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        targets: {
          typescript: {
            enabled: true,
            output_path:
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
          },
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testRegistryPath, invalidYaml)
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/generate.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })
  })

  describe('Statistics and Reporting', () => {
    it('should report correct message counts and namespace statistics', () => {
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
              description: 'Authentication required',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
            signin_success: {
              key: 'auth.signin_success',
              namespace: 'auth',
              category: 'success',
              description: 'Sign in successful',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: false,
              ui_usage: true,
            },
          },
          validation: {
            required: {
              key: 'validation.required',
              namespace: 'validation',
              category: 'error',
              description: 'Field is required',
              template_params: ['field'],
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
              'tools/message-codegen/__tests__/fixtures/output/keys.ts',
          },
        },
        validation: {
          strict_mode: false,
        },
        openapi_integration: {
          enabled: false,
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(testRegistry))
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      const output = execSync('node tools/message-codegen/generate.js', {
        env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        encoding: 'utf8',
      })

      // 統計情報を確認
      expect(output).toMatch(/Total messages: 3/)
      expect(output).toMatch(/Namespaces: 2/)
      expect(output).toContain('📁 auth: 2 messages')
      expect(output).toContain('📁 validation: 1 messages')
      expect(output).toContain('completed for 3 messages across 2 namespaces')
    })
  })
})
