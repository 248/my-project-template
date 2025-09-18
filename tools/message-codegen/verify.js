#!/usr/bin/env node

/**
 * Message Registry Verification Tool
 *
 * Validates consistency between:
 * - Language-neutral registry (YAML)
 * - Generated TypeScript code
 * - Generated Go code (when enabled)
 * - Locale files (all languages)
 * - OpenAPI schema integration
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { loadRegistryFromConfig } = require('./registry-loader')

// Configuration
const configPath =
  process.env.MESSAGE_CONFIG_PATH || path.join(__dirname, 'config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

let registryContext = null

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

function validateRegistryContent(registry, results) {
  if (!isPlainObject(registry.metadata)) {
    results.addError('Registry metadata must be an object')
  }

  if (!isPlainObject(registry.messages)) {
    results.addError('Registry messages must be an object of namespaces')
    return
  }

  const requiredFields = [
    'key',
    'namespace',
    'category',
    'description',
    'template_params',
    'since',
    'deprecated',
    'api_usage',
    'ui_usage',
  ]

  for (const [namespace, entries] of Object.entries(registry.messages)) {
    if (!isPlainObject(entries)) {
      results.addError(`Registry namespace '${namespace}' must be an object`)
      continue
    }

    for (const [messageName, messageData] of Object.entries(entries)) {
      if (!isPlainObject(messageData)) {
        results.addError(
          `Registry message '${namespace}.${messageName}' must be an object`
        )
        continue
      }

      const missingFields = requiredFields.filter(
        field => messageData[field] === undefined
      )

      if (missingFields.length > 0) {
        results.addError(
          `Registry message '${namespace}.${messageName}' missing required fields: ${missingFields.join(', ')}`
        )
      }

      if (!Array.isArray(messageData.template_params)) {
        results.addError(
          `Registry message '${namespace}.${messageName}' expects template_params to be an array`
        )
      }

      const expectedKey = `${namespace}.${messageName}`
      if (messageData.key && messageData.key !== expectedKey) {
        results.addError(
          `Registry message '${namespace}.${messageName}' has mismatched key '${messageData.key}'`
        )
      }
    }
  }
}

function loadRegistryContext(forceRefresh = false) {
  if (!registryContext || forceRefresh) {
    registryContext = loadRegistryFromConfig(config.registry)
  }
  return registryContext
}

/**
 * Verification results aggregator
 */
class VerificationResults {
  constructor() {
    this.errors = []
    this.warnings = []
    this.info = []
    this.stats = {}
  }

  addError(message, details = {}) {
    this.errors.push({ message, details, type: 'error' })
  }

  addWarning(message, details = {}) {
    this.warnings.push({ message, details, type: 'warning' })
  }

  addInfo(message, details = {}) {
    this.info.push({ message, details, type: 'info' })
  }

  setStat(key, value) {
    this.stats[key] = value
  }

  hasErrors() {
    return this.errors.length > 0
  }

  hasWarnings() {
    return this.warnings.length > 0
  }

  getTotal() {
    return this.errors.length + this.warnings.length + this.info.length
  }
}

/**
 * Load and parse registry
 */
function loadRegistry(forceRefresh = false) {
  return loadRegistryContext(forceRefresh).registry
}

/**
 * Extract keys from registry
 */
function extractRegistryKeys(registry) {
  const keys = []
  for (const [namespace, namespaceMessages] of Object.entries(
    registry.messages || {}
  )) {
    for (const [messageKey, messageData] of Object.entries(namespaceMessages)) {
      keys.push({
        key: messageData.key,
        namespace: messageData.namespace,
        category: messageData.category,
        templateParams: messageData.template_params || [],
        deprecated: messageData.deprecated,
        apiUsage: messageData.api_usage,
        uiUsage: messageData.ui_usage,
      })
    }
  }
  return keys
}

/**
 * Verify TypeScript generated code
 */
function verifyTypeScript(registryKeys, results) {
  const tsTarget = config.targets?.typescript

  if (!tsTarget || tsTarget.enabled === false) {
    results.addInfo(
      'TypeScript verification skipped (disabled or not configured)'
    )
    return
  }

  if (!tsTarget.output_path) {
    results.addWarning('TypeScript target output path not configured')
    return
  }

  const tsPath = path.resolve(tsTarget.output_path)

  if (!fs.existsSync(tsPath)) {
    results.addError('TypeScript generated file not found', { path: tsPath })
    return
  }

  try {
    const tsContent = fs.readFileSync(tsPath, 'utf8')

    // Check if all registry keys are present in TypeScript
    const missingKeys = []
    const extraKeys = []

    for (const { key } of registryKeys) {
      if (!tsContent.includes(`'${key}': '${key}'`)) {
        missingKeys.push(key)
      }
    }

    // Extract keys from TypeScript file
    const tsKeyMatches = tsContent.match(/'([^']+)':\s*'[^']+'/g) || []
    const tsKeys = tsKeyMatches.map(match => match.match(/'([^']+)':/)[1])
    const registryKeySet = new Set(registryKeys.map(k => k.key))

    for (const tsKey of tsKeys) {
      if (!registryKeySet.has(tsKey)) {
        extraKeys.push(tsKey)
      }
    }

    if (missingKeys.length > 0) {
      results.addError('TypeScript missing keys from registry', {
        keys: missingKeys,
      })
    }

    if (extraKeys.length > 0) {
      results.addError('TypeScript has extra keys not in registry', {
        keys: extraKeys,
      })
    }

    results.setStat('typescript_keys', tsKeys.length)
    results.addInfo(`TypeScript verification: ${tsKeys.length} keys processed`)
  } catch (error) {
    results.addError('Failed to verify TypeScript file', {
      error: error.message,
    })
  }
}

/**
 * Verify Go generated code
 */
function verifyGo(registryKeys, results) {
  if (!config.targets?.go?.enabled) {
    results.addInfo('Go verification skipped (disabled)')
    return
  }

  const goPath = path.resolve(config.targets?.go?.output_path)

  if (!fs.existsSync(goPath)) {
    results.addWarning('Go generated file not found', { path: goPath })
    return
  }

  try {
    const goContent = fs.readFileSync(goPath, 'utf8')

    // Check for Go constants (simplified check)
    const goConstMatches =
      goContent.match(/\s+\w+\s+MessageKey\s*=\s*"([^"]+)"/g) || []
    const goKeys = goConstMatches.map(match => match.match(/"([^"]+)"/)[1])

    const registryKeySet = new Set(registryKeys.map(k => k.key))
    const missingKeys = registryKeys
      .filter(k => !goKeys.includes(k.key))
      .map(k => k.key)
    const extraKeys = goKeys.filter(key => !registryKeySet.has(key))

    if (missingKeys.length > 0) {
      results.addError('Go missing keys from registry', { keys: missingKeys })
    }

    if (extraKeys.length > 0) {
      results.addError('Go has extra keys not in registry', { keys: extraKeys })
    }

    results.setStat('go_keys', goKeys.length)
    results.addInfo(`Go verification: ${goKeys.length} keys processed`)
  } catch (error) {
    results.addError('Failed to verify Go file', { error: error.message })
  }
}

/**
 * Verify locale files
 */
function verifyLocales(registryKeys, results) {
  const localeConfig = config.locales

  if (!localeConfig) {
    results.addInfo('Locale verification skipped (not configured)')
    return
  }

  const localesDir = path.resolve(
    localeConfig.output_dir || 'packages/shared/src/messages/locales'
  )
  const supportedLocales = Array.isArray(localeConfig.supported)
    ? localeConfig.supported
    : ['ja', 'en', 'pseudo']

  const registryKeySet = new Set(registryKeys.map(k => k.key))

  for (const locale of supportedLocales) {
    const localePath = path.join(localesDir, `${locale}.ts`)

    if (!fs.existsSync(localePath)) {
      results.addError(`Locale file not found: ${locale}`, { path: localePath })
      continue
    }

    try {
      const localeContent = fs.readFileSync(localePath, 'utf8')

      // Extract locale keys (simplified regex - assumes format: 'key': 'value')
      const localeKeyMatches =
        localeContent.match(/'([^']+)':\s*['"][^'"]*['"],?/g) || []
      const localeKeys = localeKeyMatches.map(
        match => match.match(/'([^']+)':/)[1]
      )

      const missingKeys = [...registryKeySet].filter(
        key => !localeKeys.includes(key)
      )
      const extraKeys = localeKeys.filter(key => !registryKeySet.has(key))

      if (missingKeys.length > 0) {
        results.addError(`Locale ${locale} missing keys`, { keys: missingKeys })
      }

      if (extraKeys.length > 0) {
        results.addError(`Locale ${locale} has extra keys`, { keys: extraKeys })
      }

      results.setStat(`${locale}_keys`, localeKeys.length)

      // Check for empty values
      const emptyValues = localeKeyMatches.filter(
        match => match.includes(": '',") || match.includes(': "",')
      )
      if (emptyValues.length > 0) {
        results.addWarning(`Locale ${locale} has empty values`, {
          count: emptyValues.length,
        })
      }
    } catch (error) {
      results.addError(`Failed to verify locale ${locale}`, {
        error: error.message,
      })
    }
  }
}

/**
 * Verify message key naming conventions
 */
function verifyNamingConventions(registryKeys, results) {
  const keyFormatRegex = /^[a-z]+\.[a-z_]+$/
  const invalidKeys = []

  for (const { key } of registryKeys) {
    if (!keyFormatRegex.test(key)) {
      invalidKeys.push(key)
    }
  }

  if (invalidKeys.length > 0) {
    results.addError('Invalid key naming convention', { keys: invalidKeys })
  }

  results.addInfo(
    `Naming convention check: ${registryKeys.length - invalidKeys.length}/${registryKeys.length} keys valid`
  )
}

/**
 * Check for potential duplicates or similar messages
 */
function checkForDuplicates(registryKeys, results) {
  // Simple duplicate key check
  const keySet = new Set()
  const duplicates = []

  for (const { key } of registryKeys) {
    if (keySet.has(key)) {
      duplicates.push(key)
    }
    keySet.add(key)
  }

  if (duplicates.length > 0) {
    results.addError('Duplicate keys found', { keys: duplicates })
  }

  results.addInfo(`Duplicate check: ${duplicates.length} duplicates found`)
}

/**
 * Verify OpenAPI integration
 */
function verifyOpenAPIIntegration(registryKeys, results) {
  if (!config.openapi_integration?.enabled) {
    results.addInfo('OpenAPI integration verification skipped (disabled)')
    return
  }

  const schemaPath = path.resolve(config.openapi_integration?.schema_path)

  if (!fs.existsSync(schemaPath)) {
    results.addWarning('OpenAPI schema not found - skipping', {
      path: schemaPath,
    })
    return
  }

  let schema
  try {
    schema = yaml.load(fs.readFileSync(schemaPath, 'utf8'))
  } catch (error) {
    results.addError('Failed to parse OpenAPI schema', {
      path: schemaPath,
      error: error.message,
    })
    return
  }

  const pathParts = config.openapi_integration?.error_code_enum_path.split('.')
  let enumNode = schema
  for (const part of pathParts) {
    if (enumNode && Object.prototype.hasOwnProperty.call(enumNode, part)) {
      enumNode = enumNode[part]
    } else {
      results.addWarning('Error code enum path not found in OpenAPI schema', {
        path: config.openapi_integration?.error_code_enum_path,
      })
      return
    }
  }

  if (!Array.isArray(enumNode)) {
    results.addWarning('OpenAPI error code enum is not an array', {
      path: config.openapi_integration?.error_code_enum_path,
    })
    return
  }

  const schemaKeys = new Set(enumNode)
  const registryApiKeys = registryKeys.filter(k => k.apiUsage).map(k => k.key)

  const registryApiKeySet = new Set(registryApiKeys)
  const missingInSchema = registryApiKeys.filter(k => !schemaKeys.has(k))
  const extraInSchema = enumNode.filter(k => !registryApiKeySet.has(k))

  if (missingInSchema.length > 0) {
    results.addError('OpenAPI schema missing message keys', {
      keys: missingInSchema,
    })
  }
  if (extraInSchema.length > 0) {
    results.addWarning('OpenAPI schema has additional message codes', {
      keys: extraInSchema,
    })
  }

  results.addInfo(
    `OpenAPI verification: ${
      registryApiKeys.length - missingInSchema.length
    }/${registryApiKeys.length} API keys match`
  )
}

/**
 * Generate verification report
 */
function generateReport(results) {
  console.log('📊 Message Registry Verification Report')
  console.log('='.repeat(50))

  // Summary
  console.log(`\n📈 Summary:`)
  console.log(`   Errors: ${results.errors.length}`)
  console.log(`   Warnings: ${results.warnings.length}`)
  console.log(`   Info: ${results.info.length}`)

  // Statistics
  if (Object.keys(results.stats).length > 0) {
    console.log(`\n📊 Statistics:`)
    for (const [key, value] of Object.entries(results.stats)) {
      console.log(`   ${key}: ${value}`)
    }
  }

  // Errors
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`)
    for (const error of results.errors) {
      console.log(`   • ${error.message}`)
      if (error.details.keys && error.details.keys.length > 0) {
        console.log(
          `     Keys: ${error.details.keys.slice(0, 5).join(', ')}${error.details.keys.length > 5 ? '...' : ''}`
        )
      }
      if (error.details.path) {
        console.log(`     Path: ${error.details.path}`)
      }
    }
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`)
    for (const warning of results.warnings) {
      console.log(`   • ${warning.message}`)
      if (warning.details.keys && warning.details.keys.length > 0) {
        console.log(
          `     Keys: ${warning.details.keys.slice(0, 3).join(', ')}${warning.details.keys.length > 3 ? '...' : ''}`
        )
      }
    }
  }

  // Info
  if (results.info.length > 0) {
    console.log(`\n💡 Information:`)
    for (const info of results.info) {
      console.log(`   • ${info.message}`)
    }
  }

  // Conclusion
  console.log('\n' + '='.repeat(50))
  if (results.hasErrors()) {
    console.log('❌ Verification FAILED - Please fix errors before proceeding')
    return false
  } else if (results.hasWarnings()) {
    console.log('⚠️  Verification completed with warnings')
    return true
  } else {
    console.log('✅ Verification PASSED - All checks successful!')
    return true
  }
}

/**
 * Main verification function
 */
async function verifyMessages() {
  console.log('🔍 Starting message registry verification...\n')

  const results = new VerificationResults()

  try {
    // Load registry
    console.log('📄 Loading registry...')
    const context = loadRegistryContext(true)
    const registry = context.registry
    const registryKeys = extractRegistryKeys(registry)

    results.setStat('registry_keys', registryKeys.length)
    results.setStat('namespaces', Object.keys(registry.messages).length)

    validateRegistryContent(registry, results)

    console.log(
      `   Loaded ${registryKeys.length} keys from ${Object.keys(registry.messages).length} namespaces`
    )

    const basePathForLog =
      context.basePath || path.resolve(config.registry.path)
    console.log(
      '   Registry source (' + context.sourceType + '): ' + basePathForLog
    )
    if (context.sourceType === 'directory') {
      console.log('   Config path: ' + config.registry.path)
    }
    if (context.sources.length === 1) {
      console.log('   Fragment: ' + context.sources[0].relativePath)
    } else if (context.sources.length > 1) {
      console.log('   Fragments (' + context.sources.length + '):')
      for (const source of context.sources) {
        console.log('   • ' + source.relativePath)
      }
    }

    // Run verification checks
    console.log('\n🔷 Verifying TypeScript generation...')
    verifyTypeScript(registryKeys, results)

    console.log('🔶 Verifying Go generation...')
    verifyGo(registryKeys, results)

    console.log('🌐 Verifying locale files...')
    verifyLocales(registryKeys, results)

    console.log('📏 Verifying naming conventions...')
    verifyNamingConventions(registryKeys, results)

    console.log('🔍 Checking for duplicates...')
    checkForDuplicates(registryKeys, results)

    console.log('📄 Verifying OpenAPI integration...')
    verifyOpenAPIIntegration(registryKeys, results)

    // Generate report
    console.log('\n')
    const success = generateReport(results)

    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error(`\n❌ Verification failed: ${error.message}`)
    process.exit(1)
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Message Registry Verification Tool

Usage: node verify.js [options]

Options:
  --help, -h        Show this help message
  --verbose, -v     Verbose output (coming soon)
  --fix             Auto-fix issues where possible (coming soon)

Examples:
  node verify.js                    # Run all verification checks
  pnpm verify:messages              # Same as above via npm script
`)
    process.exit(0)
  }

  verifyMessages()
}

module.exports = { verifyMessages }
