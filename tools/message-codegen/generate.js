#!/usr/bin/env node

/**
 * Multi-Language Message Code Generator
 *
 * Orchestrates code generation for all supported languages
 * from the language-neutral message registry
 */

const fs = require('fs')
const path = require('path')
const { generateTypeScript } = require('./generate-typescript')
const { generateGo } = require('./generate-go')
const { updateOpenApi } = require('./update-openapi')
const { loadRegistryFromConfig } = require('./registry-loader')
const { loadConfig } = require('./config-loader')

const config = loadConfig()

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

function validateRegistryStructure(registry) {
  if (!isPlainObject(registry.metadata)) {
    throw new Error('Registry metadata must be an object with required fields')
  }

  if (!isPlainObject(registry.messages)) {
    throw new Error('Registry messages must be an object of namespaces')
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
      throw new Error(`Registry namespace '${namespace}' must be an object`)
    }

    for (const [messageName, messageData] of Object.entries(entries)) {
      if (!isPlainObject(messageData)) {
        throw new Error(
          `Registry message '${namespace}.${messageName}' must be an object`
        )
      }

      const missingFields = requiredFields.filter(
        field => messageData[field] === undefined
      )

      if (missingFields.length > 0) {
        throw new Error(
          `Registry message '${namespace}.${messageName}' missing required fields: ${missingFields.join(', ')}`
        )
      }

      if (!Array.isArray(messageData.template_params)) {
        throw new Error(
          `Registry message '${namespace}.${messageName}' expects template_params to be an array`
        )
      }
    }
  }
}

/**
 * Verify registry file exists and is valid
 */
function verifyRegistry() {
  const context = loadRegistryFromConfig(config.registry)
  const { registry, sources, sourceType, basePath } = context

  const baseForLog = basePath || path.resolve(config.registry.path)

  console.log('📄 Registry source (' + sourceType + '): ' + baseForLog)
  if (sourceType === 'directory' && config.registry.path) {
    console.log('   Config path: ' + config.registry.path)
  }

  if (sources.length === 1) {
    console.log('   Fragment: ' + sources[0].relativePath)
  } else if (sources.length > 1) {
    console.log('   Fragments (' + sources.length + '):')
    for (const source of sources) {
      console.log('   • ' + source.relativePath)
    }
  }

  if (!registry.metadata || !registry.messages) {
    throw new Error('Invalid registry format: missing metadata or messages')
  }

  if (registry.metadata.version) {
    console.log('📊 Registry version: ' + registry.metadata.version)
  }
  if (registry.metadata.supported_languages) {
    console.log(
      '🌐 Supported languages: ' +
        registry.metadata.supported_languages.join(', ')
    )
  }
  if (registry.metadata.supported_locales) {
    console.log(
      '🏷️  Supported locales: ' + registry.metadata.supported_locales.join(', ')
    )
  }

  validateRegistryStructure(registry)

  return context
}

/**
 * Count messages in registry
 */
function countMessages(registry) {
  let totalMessages = 0
  const namespaces = Object.keys(registry.messages || {})

  for (const [namespace, messages] of Object.entries(registry.messages || {})) {
    const messageCount = Object.keys(messages).length
    totalMessages += messageCount
    console.log(`  📁 ${namespace}: ${messageCount} messages`)
  }

  console.log(`📈 Total messages: ${totalMessages}`)
  console.log(`🏷️  Namespaces: ${namespaces.length} (${namespaces.join(', ')})`)

  return { totalMessages, namespaces }
}

/**
 * Generate locale JSON files for runtime usage
 */
function generateLocaleFiles(registry) {
  const localesDir = path.resolve('packages/shared/src/messages/locales')

  // Ensure locales directory exists
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true })
  }

  console.log('📁 Generating locale JSON files for runtime...')

  // For now, keep existing TypeScript files
  // In future iterations, we can generate JSON files for broader language support
  console.log('⏭️  Locale file generation: keeping existing TypeScript format')
  console.log('   (Future: JSON format for Go/other language support)')
}

/**
 * Update OpenAPI schema with message codes
 */
function updateOpenAPISchema(registry, currentConfig) {
  if (!currentConfig.openapi_integration.enabled) {
    console.log('⏭️  OpenAPI integration disabled')
    return
  }

  const schemaPath = path.resolve(currentConfig.openapi_integration.schema_path)

  if (!fs.existsSync(schemaPath)) {
    console.log(`⚠️  OpenAPI schema not found: ${schemaPath}`)
    return
  }

  console.log('🔄 Updating OpenAPI schema with message codes...')
  updateOpenApi(currentConfig)
}

/**
 * Main orchestration function
 */
async function generateAll(options = {}) {
  console.log('🚀 Starting multi-language message code generation...')
  console.log('='.repeat(60))

  try {
    // Step 1: Verify registry
    console.log('\n📋 Step 1: Verifying registry...')
    const registryContext = verifyRegistry()
    const { registry } = registryContext
    const stats = countMessages(registry)
    const targets = config.targets || {}
    const tsTarget = targets.typescript
    const goTarget = targets.go
    const tsEnabled = Boolean(tsTarget && tsTarget.enabled)
    const goEnabled = Boolean(goTarget && goTarget.enabled)

    if (options.dryRun) {
      console.log('\n🧪 Dry run summary:')

      const dryRunSteps = []

      if (tsEnabled) {
        const outputPath =
          tsTarget.output_path || 'unknown TypeScript output path'
        dryRunSteps.push({
          enabled: true,
          message: `Would generate TypeScript code at ${outputPath}`,
        })
      }

      if (goEnabled) {
        const outputPath = goTarget.output_path || 'unknown Go output path'
        dryRunSteps.push({
          enabled: true,
          message: `Would generate Go code at ${outputPath}`,
        })
      }

      dryRunSteps.push({
        enabled: true, // locale files are always processed
        message: 'Would process locale files',
      })

      if (config.openapi_integration?.enabled) {
        dryRunSteps.push({
          enabled: true,
          message: `Would update OpenAPI schema at ${config.openapi_integration.schema_path}`,
        })
      }

      for (const step of dryRunSteps) {
        if (step.enabled) {
          console.log(`   • ${step.message}`)
        }
      }

      console.log('\n' + '='.repeat(60))
      console.log(
        `✨ Dry run completed for ${stats.totalMessages} messages across ${stats.namespaces.length} namespaces`
      )
      return
    }

    // Step 2: Generate TypeScript
    console.log('\n🔷 Step 2: Generating TypeScript code...')
    if (tsEnabled) {
      generateTypeScript(config)
    } else if (tsTarget) {
      console.log('⏭️  TypeScript generation disabled')
    } else {
      console.log('⏭️  TypeScript target not configured')
    }

    // Step 3: Generate Go (if enabled)
    console.log('\n🔶 Step 3: Generating Go code...')
    if (goEnabled) {
      generateGo(config)
    } else if (goTarget) {
      console.log(
        '⏭️  Go generation disabled (enable in config.json when ready)'
      )
    } else {
      console.log('⏭️  Go target not configured')
    }

    // Step 4: Generate locale files
    console.log('\n🌐 Step 4: Processing locale files...')
    generateLocaleFiles(registry)

    // Step 5: Update OpenAPI schema
    console.log('\n📄 Step 5: Updating OpenAPI schema...')
    updateOpenAPISchema(registry, config)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✨ Message code generation completed successfully!')
    console.log(
      `completed for ${stats.totalMessages} messages across ${stats.namespaces.length} namespaces`
    )
    console.log(
      `📊 Generated code for ${stats.totalMessages} messages across ${stats.namespaces.length} namespaces`
    )
    console.log('💡 Next steps:')
    console.log('   • Run `pnpm verify:messages` to validate consistency')
    console.log('   • Run `pnpm type-check` to verify generated TypeScript')
    console.log('   • Begin staged migration from hardcoded messages')
  } catch (error) {
    console.error('\n❌ Code generation failed:')
    console.error(`   ${error.message}`)
    console.error('\n🔧 Troubleshooting:')
    console.error('   • Check registry.yaml syntax and structure')
    console.error('   • Ensure output directories are writable')
    console.error('   • Verify all required dependencies are installed')
    process.exit(1)
  }
}

/**
 * CLI argument handling
 */
function parseArguments() {
  const args = process.argv.slice(2)
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run'),
    typescript: args.includes('--typescript') || args.includes('--ts'),
    go: args.includes('--go'),
    help: args.includes('--help') || args.includes('-h'),
  }

  if (options.help) {
    console.log(`
Message Code Generator

Usage: node generate.js [options]

Options:
  --verbose, -v     Verbose output
  --dry-run         Show what would be generated without writing files
  --typescript      Generate only TypeScript code  
  --go              Generate only Go code
  --help, -h        Show this help message

Examples:
  node generate.js                 # Generate all enabled languages
  node generate.js --typescript    # Generate only TypeScript
  node generate.js --verbose       # Verbose output
`)
    process.exit(0)
  }

  return options
}

// Run if called directly
if (require.main === module) {
  const options = parseArguments()

  if (options.verbose) {
    console.log('🔧 Configuration:', JSON.stringify(config, null, 2))
  }

  if (options.dryRun) {
    console.log('🧪 Dry run mode: no files will be written')
  }

  generateAll(options)
}

module.exports = { generateAll, verifyRegistry, countMessages }
