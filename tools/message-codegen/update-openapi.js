#!/usr/bin/env node

/**
 * OpenAPI Schema Update Tool
 *
 * Updates OpenAPI schema with message registry enum definitions
 * Ensures API contract alignment with message code system
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

// Configuration
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
)

/**
 * Load message registry
 */
function loadRegistry() {
  const registryPath = path.resolve(config.registry.path)

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry file not found: ${registryPath}`)
  }

  return yaml.load(fs.readFileSync(registryPath, 'utf8'))
}

/**
 * Extract message keys from registry
 */
function extractMessageKeys(registry) {
  const keys = []
  for (const [namespace, namespaceMessages] of Object.entries(
    registry.messages || {}
  )) {
    for (const [messageKey, messageData] of Object.entries(namespaceMessages)) {
      keys.push({
        key: messageData.key,
        namespace: messageData.namespace,
        category: messageData.category,
        description: messageData.description,
        apiUsage: messageData.api_usage,
        uiUsage: messageData.ui_usage,
      })
    }
  }
  return keys
}

/**
 * Create enhanced API schema definitions
 */
function createApiSchemas(messageKeys) {
  const allKeys = messageKeys.map(k => k.key)
  const errorKeys = messageKeys
    .filter(
      k =>
        k.namespace === 'error' ||
        k.namespace === 'auth' ||
        k.namespace === 'validation'
    )
    .map(k => k.key)
  const successKeys = messageKeys
    .filter(k => k.namespace === 'success')
    .map(k => k.key)
  const validationKeys = messageKeys
    .filter(k => k.namespace === 'validation')
    .map(k => k.key)

  return {
    // Base API response schema
    ApiResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Response success indicator',
        },
        code: {
          type: 'string',
          enum: allKeys,
          description:
            'Message code from registry (language-neutral identifier)',
        },
        message: {
          type: 'string',
          description:
            'Human-readable message (optional for backward compatibility)',
          nullable: true,
        },
        data: {
          type: 'object',
          description: 'Response data',
          nullable: true,
        },
      },
      required: ['success', 'code'],
    },

    // Error response schema
    ApiError: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponse' },
        {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              enum: [false],
              example: false,
            },
            code: {
              type: 'string',
              enum: errorKeys,
              description: 'Error code from registry',
              example: 'error.user_not_found',
            },
            details: {
              type: 'object',
              description: 'Additional error context',
              nullable: true,
            },
          },
        },
      ],
    },

    // Success response schema
    ApiSuccess: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponse' },
        {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              enum: [true],
              example: true,
            },
            code: {
              type: 'string',
              enum: successKeys,
              description: 'Success code from registry',
              example: 'success.profile_retrieved',
            },
          },
        },
      ],
    },

    // Validation error detail
    ValidationErrorDetail: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'Field name that failed validation',
          example: 'email',
        },
        code: {
          type: 'string',
          enum: validationKeys,
          description: 'Validation error code',
          example: 'validation.field_required',
        },
        message: {
          type: 'string',
          description: 'Human-readable validation error message',
          example: 'Email is required',
        },
      },
      required: ['field', 'code', 'message'],
    },

    // Validation error response
    ValidationError: {
      allOf: [
        { $ref: '#/components/schemas/ApiError' },
        {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              enum: ['error.validation_failed'],
              example: 'error.validation_failed',
            },
            errors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ValidationErrorDetail',
              },
              description: 'Detailed validation errors',
            },
          },
          required: ['errors'],
        },
      ],
    },

    // Legacy error response (for backward compatibility)
    ErrorResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          enum: [false],
          example: false,
          deprecated: true,
        },
        message: {
          type: 'string',
          description: 'Error message (deprecated - use code instead)',
          example: 'User not found',
          deprecated: true,
        },
        error: {
          type: 'string',
          description:
            'Error details (deprecated - use code + details instead)',
          example: 'User not found. Please sign in again.',
          deprecated: true,
        },
        code: {
          type: 'string',
          enum: errorKeys,
          description: 'Error code (new standard)',
          example: 'error.user_not_found',
        },
        details: {
          type: 'object',
          description: 'Additional error context',
          nullable: true,
        },
      },
      required: ['success', 'code'],
      deprecated: true,
      description: 'Deprecated error response format - use ApiError instead',
    },
  }
}

/**
 * Update OpenAPI schema file
 */
function updateOpenApiSchema(messageKeys) {
  const schemaPath = path.resolve(config.openapi_integration.schema_path)

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`OpenAPI schema not found: ${schemaPath}`)
  }

  // Load current schema
  const schema = yaml.load(fs.readFileSync(schemaPath, 'utf8'))

  // Create new API schemas
  const apiSchemas = createApiSchemas(messageKeys)

  // Update components.schemas
  if (!schema.components) {
    schema.components = {}
  }
  if (!schema.components.schemas) {
    schema.components.schemas = {}
  }

  // Add new schemas
  Object.assign(schema.components.schemas, apiSchemas)

  // Add message code documentation
  schema.components.schemas.MessageCode = {
    type: 'string',
    enum: messageKeys.map(k => k.key),
    description: `Message codes from registry (version ${loadRegistry().metadata.version})`,
    'x-enum-descriptions': messageKeys.reduce((acc, k) => {
      acc[k.key] = `[${k.namespace}.${k.category}] ${k.description}`
      return acc
    }, {}),
  }

  // Add registry metadata to info
  const registry = loadRegistry()
  if (!schema.info['x-message-registry']) {
    schema.info['x-message-registry'] = {
      version: registry.metadata.version,
      total_keys: messageKeys.length,
      namespaces: Object.keys(registry.messages || {}),
      last_updated: new Date().toISOString(),
    }
  }

  return schema
}

/**
 * Generate schema validation report
 */
function generateReport(messageKeys, updatedSchema) {
  console.log('📄 OpenAPI Schema Update Report')
  console.log('='.repeat(50))

  console.log(`\\n📊 Statistics:`)
  console.log(`   Total message keys: ${messageKeys.length}`)
  console.log(`   API-used keys: ${messageKeys.filter(k => k.apiUsage).length}`)
  console.log(
    `   Error keys: ${messageKeys.filter(k => k.namespace === 'error' || k.namespace === 'auth' || k.namespace === 'validation').length}`
  )
  console.log(
    `   Success keys: ${messageKeys.filter(k => k.namespace === 'success').length}`
  )
  console.log(
    `   Validation keys: ${messageKeys.filter(k => k.namespace === 'validation').length}`
  )

  console.log(`\\n📋 Schema Updates:`)
  console.log(`   ✅ Added ApiResponse base schema`)
  console.log(`   ✅ Added ApiError with code enum`)
  console.log(`   ✅ Added ApiSuccess with code enum`)
  console.log(`   ✅ Added ValidationError with detailed validation`)
  console.log(`   ✅ Updated ErrorResponse (deprecated)`)
  console.log(`   ✅ Added MessageCode enum documentation`)

  console.log(`\\n🔗 Integration:`)
  console.log(`   Registry version: ${loadRegistry().metadata.version}`)
  console.log(`   Schema file: ${config.openapi_integration.schema_path}`)
  console.log(`   Last updated: ${new Date().toISOString()}`)
}

/**
 * Main update function
 */
function updateOpenApi() {
  console.log('📄 Updating OpenAPI schema with message registry...')

  try {
    // Load registry and extract keys
    console.log('📋 Loading message registry...')
    const registry = loadRegistry()
    const messageKeys = extractMessageKeys(registry)

    console.log(
      `   Loaded ${messageKeys.length} keys from ${Object.keys(registry.messages).length} namespaces`
    )

    // Update schema
    console.log('🔄 Updating OpenAPI schema...')
    const updatedSchema = updateOpenApiSchema(messageKeys)

    // Write updated schema
    const schemaPath = path.resolve(config.openapi_integration.schema_path)
    const yamlContent = yaml.dump(updatedSchema, {
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
      sortKeys: false,
    })

    fs.writeFileSync(schemaPath, yamlContent, 'utf8')
    console.log(`✅ Updated schema: ${schemaPath}`)

    // Generate report
    generateReport(messageKeys, updatedSchema)

    console.log('\\n✨ OpenAPI schema update completed successfully!')
    console.log('💡 Next steps:')
    console.log('   • Run `pnpm codegen` to regenerate TypeScript client')
    console.log('   • Update API implementations to use new response schemas')
    console.log('   • Migrate from ErrorResponse to ApiError schema')
  } catch (error) {
    console.error(`\\n❌ OpenAPI update failed: ${error.message}`)
    process.exit(1)
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
OpenAPI Schema Update Tool

Updates OpenAPI schema with message registry enum definitions

Usage: node update-openapi.js [options]

Options:
  --help, -h        Show this help message
  --dry-run         Preview changes without writing files (coming soon)

Examples:
  node update-openapi.js                    # Update OpenAPI schema
  pnpm gen:messages                         # Includes OpenAPI update
`)
    process.exit(0)
  }

  if (!config.openapi_integration.enabled) {
    console.log('⏭️  OpenAPI integration is disabled in config.json')
    process.exit(0)
  }

  updateOpenApi()
}

module.exports = { updateOpenApi }
