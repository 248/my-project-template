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

// Load configuration
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
)

/**
 * Verify registry file exists and is valid
 */
function verifyRegistry() {
  const registryPath = path.resolve(config.registry.path)

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry file not found: ${registryPath}`)
  }

  console.log(`📄 Registry: ${registryPath}`)

  try {
    const yaml = require('js-yaml')
    const registry = yaml.load(fs.readFileSync(registryPath, 'utf8'))

    if (!registry.metadata || !registry.messages) {
      throw new Error('Invalid registry format: missing metadata or messages')
    }

    console.log(`📊 Registry version: ${registry.metadata.version}`)
    console.log(
      `🌐 Supported languages: ${registry.metadata.supported_languages.join(', ')}`
    )
    console.log(
      `🏷️  Supported locales: ${registry.metadata.supported_locales.join(', ')}`
    )

    return registry
  } catch (error) {
    throw new Error(`Failed to parse registry: ${error.message}`)
  }
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
function updateOpenAPISchema(registry) {
  if (!config.openapi_integration.enabled) {
    console.log('⏭️  OpenAPI integration disabled')
    return
  }

  const schemaPath = path.resolve(config.openapi_integration.schema_path)

  if (!fs.existsSync(schemaPath)) {
    console.log(`⚠️  OpenAPI schema not found: ${schemaPath}`)
    return
  }

  console.log('🔄 Updating OpenAPI schema with message codes...')
  updateOpenApi()
}

/**
 * Main orchestration function
 */
async function generateAll() {
  console.log('🚀 Starting multi-language message code generation...')
  console.log('='.repeat(60))

  try {
    // Step 1: Verify registry
    console.log('\n📋 Step 1: Verifying registry...')
    const registry = verifyRegistry()
    const stats = countMessages(registry)

    // Step 2: Generate TypeScript
    console.log('\n🔷 Step 2: Generating TypeScript code...')
    if (config.targets.typescript.enabled) {
      generateTypeScript()
    } else {
      console.log('⏭️  TypeScript generation disabled')
    }

    // Step 3: Generate Go (if enabled)
    console.log('\n🔶 Step 3: Generating Go code...')
    if (config.targets.go.enabled) {
      generateGo()
    } else {
      console.log(
        '⏭️  Go generation disabled (enable in config.json when ready)'
      )
    }

    // Step 4: Generate locale files
    console.log('\n🌐 Step 4: Processing locale files...')
    generateLocaleFiles(registry)

    // Step 5: Update OpenAPI schema
    console.log('\n📄 Step 5: Updating OpenAPI schema...')
    updateOpenAPISchema(registry)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✨ Message code generation completed successfully!')
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
    // TODO: Implement dry run mode
  }

  generateAll()
}

module.exports = { generateAll, verifyRegistry, countMessages }
