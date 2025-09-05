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

// Configuration
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
)

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
function loadRegistry() {
  const registryPath = path.resolve(config.registry.path)

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry file not found: ${registryPath}`)
  }

  try {
    return yaml.load(fs.readFileSync(registryPath, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to parse registry: ${error.message}`)
  }
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
  const tsPath = path.resolve(config.targets.typescript.output_path)

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
  if (!config.targets.go.enabled) {
    results.addInfo('Go verification skipped (disabled)')
    return
  }

  const goPath = path.resolve(config.targets.go.output_path)

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
  const localesDir = path.resolve('packages/shared/src/messages/locales')
  const supportedLocales = ['ja', 'en', 'pseudo']

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
        localeContent.match(/'([^']+)':\s*'[^']*',?/g) || []
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
  if (!config.openapi_integration.enabled) {
    results.addInfo('OpenAPI integration verification skipped (disabled)')
    return
  }

  const schemaPath = path.resolve(config.openapi_integration.schema_path)

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

  const pathParts = config.openapi_integration.error_code_enum_path.split('.')
  let enumNode = schema
  for (const part of pathParts) {
    if (enumNode && Object.prototype.hasOwnProperty.call(enumNode, part)) {
      enumNode = enumNode[part]
    } else {
      results.addWarning('Error code enum path not found in OpenAPI schema', {
        path: config.openapi_integration.error_code_enum_path,
      })
      return
    }
  }

  if (!Array.isArray(enumNode)) {
    results.addWarning('OpenAPI error code enum is not an array', {
      path: config.openapi_integration.error_code_enum_path,
    })
    return
  }

  const schemaKeys = new Set(enumNode)
  const registryErrorKeys = registryKeys
    .filter(
      k =>
        k.apiUsage &&
        (k.category === 'error' ||
          k.category === 'client_error' ||
          k.category === 'server_error')
    )
    .map(k => k.key)

  const registryErrorKeySet = new Set(registryErrorKeys)
  const missingInSchema = registryErrorKeys.filter(k => !schemaKeys.has(k))
  const extraInSchema = enumNode.filter(k => !registryErrorKeySet.has(k))

  if (missingInSchema.length > 0) {
    results.addError('OpenAPI schema missing message keys', {
      keys: missingInSchema,
    })
  }
  if (extraInSchema.length > 0) {
    results.addError('OpenAPI schema has unknown message keys', {
      keys: extraInSchema,
    })
  }

  results.addInfo(
    `OpenAPI verification: ${
      registryErrorKeys.length - missingInSchema.length
    }/${registryErrorKeys.length} error keys match`
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
    const registry = loadRegistry()
    const registryKeys = extractRegistryKeys(registry)

    results.setStat('registry_keys', registryKeys.length)
    results.setStat('namespaces', Object.keys(registry.messages).length)

    console.log(
      `   Loaded ${registryKeys.length} keys from ${Object.keys(registry.messages).length} namespaces`
    )

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
