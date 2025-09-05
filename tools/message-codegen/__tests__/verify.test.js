import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Message Registry Verification', () => {
  const testDataDir = path.resolve(__dirname, 'fixtures')
  const originalConfigPath = path.resolve(__dirname, '../config.json')
  const testConfigPath = path.resolve(testDataDir, 'test-config.json')
  const testRegistryPath = path.resolve(testDataDir, 'test-registry.yaml')
  const testOpenApiPath = path.resolve(testDataDir, 'test-openapi.yaml')

  beforeEach(async () => {
    // テスト用のディレクトリ作成
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
  })

  afterEach(() => {
    // テストファイルのクリーンアップ
    const cleanupFiles = [testConfigPath, testRegistryPath, testOpenApiPath]
    cleanupFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    })
  })

  describe('Registry Format Validation', () => {
    it('should validate correct registry format', () => {
      const validRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript', 'go'],
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
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(validRegistry))

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        validation: {
          strict_mode: true,
          check_completeness: true,
        },
        openapi_integration: { enabled: false },
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        })
      }).not.toThrow()
    })

    it('should reject registry with missing required fields', () => {
      const invalidRegistry = {
        metadata: { version: '1.0.0' },
        messages: {
          auth: {
            invalid_message: {
              // missing required fields
              key: 'auth.invalid_message',
            },
          },
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(invalidRegistry))

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        validation: { strict_mode: true },
        openapi_integration: { enabled: false },
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })

    it('should validate key consistency (namespace.key matches actual key)', () => {
      const inconsistentRegistry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          auth: {
            signin_required: {
              key: 'wrong.key_name', // doesn't match auth.signin_required
              namespace: 'auth',
              category: 'error',
              description: 'Test message',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
          },
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(inconsistentRegistry))

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        validation: { check_consistency: true },
        openapi_integration: { enabled: false },
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })
  })

  describe('OpenAPI Integration Validation', () => {
    it('should validate error code consistency with OpenAPI schema', () => {
      const registry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          error: {
            not_found: {
              key: 'error.not_found',
              namespace: 'error',
              category: 'error',
              description: 'Resource not found',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
          },
        },
      }

      const openApiSchema = {
        openapi: '3.0.0',
        components: {
          schemas: {
            ApiError: {
              properties: {
                code: {
                  enum: ['error.not_found', 'error.internal_server'],
                },
              },
            },
          },
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(registry))
      fs.writeFileSync(testOpenApiPath, yaml.dump(openApiSchema))

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        validation: { strict_mode: false },
        openapi_integration: {
          enabled: true,
          schema_path:
            'tools/message-codegen/__tests__/fixtures/test-openapi.yaml',
          error_code_enum_path:
            'components.schemas.ApiError.properties.code.enum',
        },
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
        })
      }).not.toThrow()
    })

    it('should detect missing error codes in OpenAPI schema', () => {
      const registry = {
        metadata: {
          version: '1.0.0',
          supported_languages: ['typescript'],
        },
        messages: {
          error: {
            not_found: {
              key: 'error.not_found',
              namespace: 'error',
              category: 'error',
              description: 'Resource not found',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
            unauthorized: {
              key: 'error.unauthorized',
              namespace: 'error',
              category: 'error',
              description: 'Unauthorized access',
              template_params: [],
              since: '1.0.0',
              deprecated: false,
              api_usage: true,
              ui_usage: true,
            },
          },
        },
      }

      const openApiSchema = {
        openapi: '3.0.0',
        components: {
          schemas: {
            ApiError: {
              properties: {
                code: {
                  enum: ['error.not_found'], // missing error.unauthorized
                },
              },
            },
          },
        },
      }

      fs.writeFileSync(testRegistryPath, yaml.dump(registry))
      fs.writeFileSync(testOpenApiPath, yaml.dump(openApiSchema))

      const testConfig = {
        registry: {
          path: 'tools/message-codegen/__tests__/fixtures/test-registry.yaml',
        },
        validation: { strict_mode: true },
        openapi_integration: {
          enabled: true,
          schema_path:
            'tools/message-codegen/__tests__/fixtures/test-openapi.yaml',
          error_code_enum_path:
            'components.schemas.ApiError.properties.code.enum',
        },
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: { ...process.env, MESSAGE_CONFIG_PATH: testConfigPath },
          stdio: 'pipe',
        })
      }).toThrow()
    })
  })

  describe('Configuration Validation', () => {
    it('should use default config when no custom config provided', () => {
      // デフォルト設定での検証実行
      expect(() => {
        execSync('node tools/message-codegen/verify.js', { stdio: 'pipe' })
      }).not.toThrow()
    })

    it('should handle missing config file gracefully', () => {
      expect(() => {
        execSync('node tools/message-codegen/verify.js', {
          env: {
            ...process.env,
            MESSAGE_CONFIG_PATH: 'nonexistent-config.json',
          },
          stdio: 'pipe',
        })
      }).toThrow()
    })
  })
})
