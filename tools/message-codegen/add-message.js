#!/usr/bin/env node

/**
 * Message Key Addition Tool
 *
 * CLI tool for adding new message keys to the registry
 * Supports multi-language message definition and automatic validation
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Message Key Addition Tool

Usage: node add-message.js <key> [options]

Arguments:
  key                   The message key to add (e.g., auth.new_feature)

Options:
  --ja <text>          Japanese message text
  --en <text>          English message text
  --description <text> Description of the message
  --category <cat>     Message category (error, success, info, label, etc.)
  --template-params    Comma-separated template parameters (e.g., field,value)
  --api-usage          Mark as used in API responses
  --ui-usage           Mark as used in UI display
  --dry-run            Show what would be added without making changes
  --help, -h           Show this help message

Examples:
  node add-message.js auth.new_feature \\
    --ja "新機能が利用できます" \\
    --en "New feature is available" \\
    --description "New feature availability message" \\
    --category "info" \\
    --ui-usage

  node add-message.js validation.custom_error \\
    --ja "{{field}}は{{rule}}に従ってください" \\
    --en "{{field}} must follow {{rule}}" \\
    --template-params "field,rule" \\
    --api-usage \\
    --ui-usage
`)
    process.exit(0)
  }

  const key = args[0]
  if (!key) {
    throw new Error('Message key is required')
  }

  const options = {
    key,
    ja: getArgValue(args, '--ja'),
    en: getArgValue(args, '--en'),
    description: getArgValue(args, '--description'),
    category: getArgValue(args, '--category', 'info'),
    templateParams: getArgValue(args, '--template-params', '')
      .split(',')
      .filter(Boolean),
    apiUsage: args.includes('--api-usage'),
    uiUsage: args.includes('--ui-usage'),
    dryRun: args.includes('--dry-run'),
  }

  return options
}

/**
 * Get argument value
 */
function getArgValue(args, flag, defaultValue = '') {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) {
    return defaultValue
  }
  return args[index + 1]
}

/**
 * Validate message key format
 */
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

/**
 * Validate options
 */
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
      `Validation errors:\\n${errors.map(e => `  • ${e}`).join('\\n')}`
    )
  }
}

/**
 * Load current registry
 */
function loadRegistry() {
  const registryPath = path.resolve('contracts/messages/registry.yaml')

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry file not found: ${registryPath}`)
  }

  return yaml.load(fs.readFileSync(registryPath, 'utf8'))
}

/**
 * Check if key already exists
 */
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

/**
 * Add message to registry
 */
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

/**
 * Add to locale files
 */
function addToLocaleFiles(options) {
  const localesDir = path.resolve('packages/shared/src/messages/locales')

  // Add to Japanese locale if provided
  if (options.ja) {
    const jaPath = path.join(localesDir, 'ja.ts')
    if (fs.existsSync(jaPath)) {
      addToLocaleFile(jaPath, options.key, options.ja, 'jaMessages')
    }
  }

  // Add to English locale if provided
  if (options.en) {
    const enPath = path.join(localesDir, 'en.ts')
    if (fs.existsSync(enPath)) {
      addToLocaleFile(enPath, options.key, options.en, 'enMessages')
    }
  }

  // Add to pseudo locale (always use English or Japanese as base)
  const pseudoPath = path.join(localesDir, 'pseudo.ts')
  if (fs.existsSync(pseudoPath)) {
    const pseudoText = `[!! ${options.en || options.ja} !!]`
    addToLocaleFile(pseudoPath, options.key, pseudoText, 'pseudoMessages')
  }
}

/**
 * Add entry to a specific locale file
 */
function addToLocaleFile(filePath, key, message, exportName) {
  const content = fs.readFileSync(filePath, 'utf8')

  // Find the closing brace of the export
  const exportPattern = new RegExp(
    `export const ${exportName}: LocaleMessages = \\{([\\s\\S]*?)\\n\\}`
  )
  const match = content.match(exportPattern)

  if (!match) {
    console.warn(`⚠️  Could not find export pattern in ${filePath}`)
    return
  }

  // Add new entry before the closing brace
  const newEntry = `  '${key}': '${message}',`
  const updatedContent = content.replace(
    exportPattern,
    `export const ${exportName}: LocaleMessages = {$1\n  ${newEntry}\n}`
  )

  fs.writeFileSync(filePath, updatedContent, 'utf8')
  console.log(`   ✅ Added to ${path.basename(filePath)}`)
}

/**
 * Save updated registry
 */
function saveRegistry(registry) {
  const registryPath = path.resolve('contracts/messages/registry.yaml')
  const yamlContent = yaml.dump(registry, {
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
  })

  fs.writeFileSync(registryPath, yamlContent, 'utf8')
  console.log(`✅ Updated registry: ${registryPath}`)
}

/**
 * Preview changes
 */
function previewChanges(options) {
  console.log('🔍 Preview of changes to be made:')
  console.log('─'.repeat(40))
  console.log(`Key: ${options.key}`)
  console.log(`Namespace: ${validateKey(options.key).namespace}`)
  console.log(`Description: ${options.description}`)
  console.log(`Category: ${options.category}`)
  console.log(`Template params: ${options.templateParams.join(', ') || 'none'}`)
  console.log(`API usage: ${options.apiUsage}`)
  console.log(`UI usage: ${options.uiUsage}`)

  if (options.ja) console.log(`Japanese: ${options.ja}`)
  if (options.en) console.log(`English: ${options.en}`)

  console.log('─'.repeat(40))
}

/**
 * Main function
 */
async function addMessage() {
  try {
    console.log('➕ Adding new message key...')

    // Parse and validate arguments
    const options = parseArguments()
    validateOptions(options)

    // Load current registry
    const registry = loadRegistry()

    // Check if key already exists
    if (checkKeyExists(registry, options.key)) {
      throw new Error(`Key '${options.key}' already exists in registry`)
    }

    // Preview changes
    previewChanges(options)

    if (options.dryRun) {
      console.log('\\n🧪 Dry run mode - no changes made')
      return
    }

    // Make changes
    console.log('\\n📝 Making changes...')

    // Update registry
    const updatedRegistry = addMessageToRegistry(registry, options)
    saveRegistry(updatedRegistry)

    // Update locale files
    console.log('🌐 Updating locale files...')
    addToLocaleFiles(options)

    // Success
    console.log('\\n✨ Message key added successfully!')
    console.log('💡 Next steps:')
    console.log('   • Run `pnpm gen:messages` to regenerate TypeScript code')
    console.log('   • Run `pnpm verify:messages` to validate consistency')
    console.log('   • Add missing locale translations if needed')
  } catch (error) {
    console.error(`\\n❌ Failed to add message: ${error.message}`)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  addMessage()
}

module.exports = { addMessage }
