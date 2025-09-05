#!/usr/bin/env node

/**
 * TypeScript Code Generator for Message Registry
 *
 * Generates TypeScript definitions from language-neutral YAML registry
 * Supports: keys, types, validation, and locale files
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

// Load configuration
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
)

// Load registry
const registryPath = path.resolve(config.registry.path)
const registry = yaml.load(fs.readFileSync(registryPath, 'utf8'))

/**
 * Generate TypeScript keys file
 */
function generateKeysFile() {
  const messages = registry.messages || {}
  const allKeys = []

  // Extract all keys from nested structure
  for (const [namespace, namespaceMessages] of Object.entries(messages)) {
    for (const [messageKey, messageData] of Object.entries(namespaceMessages)) {
      allKeys.push(messageData.key)
    }
  }

  // Generate TypeScript code
  const tsCode = `/**
 * Generated Message Keys - DO NOT EDIT MANUALLY
 * 
 * Generated from: ${config.registry.path}
 * Version: ${registry.metadata.version}
 * Generated at: ${new Date().toISOString()}
 * 
 * Run 'pnpm gen:messages' to regenerate this file
 */

export const MESSAGE_KEYS = {
${allKeys.map(key => `  '${key}': '${key}',`).join('\n')}
} as const

/**
 * Message key union type (auto-generated)
 */
export type MessageKey = keyof typeof MESSAGE_KEYS

/**
 * Namespace-specific key types (auto-generated)
 */
${Object.keys(messages)
  .map(namespace => {
    const namespaceKeys = allKeys.filter(key => key.startsWith(`${namespace}.`))
    return `export type ${namespace.charAt(0).toUpperCase() + namespace.slice(1)}MessageKey = Extract<MessageKey, \`${namespace}.\${string}\`>`
  })
  .join('\n')}

/**
 * All message keys as array (for validation)
 */
export const ALL_MESSAGE_KEYS = Object.keys(MESSAGE_KEYS) as MessageKey[]

/**
 * Namespace-specific key arrays
 */
${Object.keys(messages)
  .map(namespace => {
    const constName = `${namespace.toUpperCase()}_KEYS`
    return `export const ${constName} = ALL_MESSAGE_KEYS.filter(k => k.startsWith('${namespace}.')) as ${namespace.charAt(0).toUpperCase() + namespace.slice(1)}MessageKey[]`
  })
  .join('\n')}

/**
 * Message metadata (generated from registry)
 */
export interface MessageMetadata {
  key: MessageKey
  namespace: string
  category: string
  description: string
  templateParams: string[]
  since: string
  deprecated: boolean
  apiUsage: boolean
  uiUsage: boolean
}

export const MESSAGE_METADATA: Record<MessageKey, MessageMetadata> = {
${allKeys
  .map(key => {
    // Find message data
    let messageData = null
    for (const [namespace, namespaceMessages] of Object.entries(messages)) {
      for (const [messageKey, data] of Object.entries(namespaceMessages)) {
        if (data.key === key) {
          messageData = data
          break
        }
      }
      if (messageData) break
    }

    return `  '${key}': {
    key: '${key}',
    namespace: '${messageData.namespace}',
    category: '${messageData.category}',
    description: '${messageData.description}',
    templateParams: [${messageData.template_params.map(p => `'${p}'`).join(', ')}],
    since: '${messageData.since}',
    deprecated: ${messageData.deprecated},
    apiUsage: ${messageData.api_usage},
    uiUsage: ${messageData.ui_usage}
  },`
  })
  .join('\n')}
}

/**
 * API-specific keys (for backend usage)
 */
export const API_MESSAGE_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].apiUsage
) as MessageKey[]

/**
 * UI-specific keys (for frontend usage)
 */
export const UI_MESSAGE_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].uiUsage
) as MessageKey[]

/**
 * Keys with template parameters
 */
export const TEMPLATED_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].templateParams.length > 0
) as MessageKey[]

/**
 * Deprecated keys (for migration warnings)
 */
export const DEPRECATED_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].deprecated
) as MessageKey[]
`

  // Write to output file
  const outputPath = path.resolve(config.targets.typescript.output_path)
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, tsCode, 'utf8')
  console.log(`✅ Generated TypeScript keys: ${outputPath}`)
}

/**
 * Update types file with registry-based definitions
 */
function updateTypesFile() {
  const typesPath = path.resolve('packages/shared/src/messages/types.ts')

  // Extract keys that have template parameters
  const templatedKeys = []
  for (const [namespace, namespaceMessages] of Object.entries(
    registry.messages || {}
  )) {
    for (const [messageKey, messageData] of Object.entries(namespaceMessages)) {
      if (
        messageData.template_params &&
        messageData.template_params.length > 0
      ) {
        templatedKeys.push({
          key: messageData.key,
          params: messageData.template_params,
        })
      }
    }
  }

  const typesCode = `import type { MessageKey } from './keys'

/**
 * Message parameters type definitions (auto-generated)
 * 
 * Generated from: ${config.registry.path}
 * Version: ${registry.metadata.version}
 * Generated at: ${new Date().toISOString()}
 */
export interface MessageParameters {
${templatedKeys
  .map(({ key, params }) => {
    const paramTypes = params
      .map(p => {
        // Infer parameter types based on common patterns
        if (p.includes('Length') || p.includes('Count')) return `${p}: number`
        return `${p}: string`
      })
      .join('; ')
    return `  '${key}': { ${paramTypes} }`
  })
  .join('\n')}
}

/**
 * Message key categories (auto-generated)
 */
export type MessageKeyWithParams = keyof MessageParameters
export type MessageKeyWithoutParams = Exclude<MessageKey, MessageKeyWithParams>

/**
 * Parameter type extraction utility
 */
export type MessageParamsFor<K extends MessageKey> = 
  K extends MessageKeyWithParams ? MessageParameters[K] : never

/**
 * Supported locales (from registry)
 */
export type SupportedLocale = ${registry.metadata.supported_locales.map(l => `'${l}'`).join(' | ')}

/**
 * Locale messages type
 */
export type LocaleMessages = Record<MessageKey, string>

/**
 * Message getter function types
 */
export interface MessageGetter {
  <K extends MessageKeyWithoutParams>(key: K): string
  <K extends MessageKeyWithParams>(key: K, params: MessageParameters[K]): string
}

/**
 * API Response types (enhanced with registry data)
 */
export interface ApiResponseWithCode {
  success: boolean
  code: MessageKey
  message?: string // Optional for backward compatibility
  data?: unknown
}

export interface ApiErrorResponse {
  success: false
  code: Extract<MessageKey, \`error.\${string}\` | \`auth.\${string}\` | \`validation.\${string}\`>
  message?: string
  details?: unknown
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  code: Extract<MessageKey, \`success.\${string}\`>
  message?: string
  data?: T
}

/**
 * Validation error types
 */
export interface ValidationErrorDetail {
  field: string
  code: Extract<MessageKey, \`validation.\${string}\`>
  message: string
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  code: 'error.validation_failed'
  errors: ValidationErrorDetail[]
}`

  fs.writeFileSync(typesPath, typesCode, 'utf8')
  console.log(`✅ Updated TypeScript types: ${typesPath}`)
}

/**
 * Generate locale verification
 */
function generateLocaleVerification() {
  const localesDir = path.resolve('packages/shared/src/messages/locales')
  const verificationCode = `/**
 * Locale file verification (auto-generated)
 * 
 * This file ensures all locale files have the correct keys
 * matching the message registry
 */

import { MESSAGE_KEYS, type MessageKey } from '../keys'
import { jaMessages } from './ja'
import { enMessages } from './en'
import { pseudoMessages } from './pseudo'

const ALL_KEYS = Object.keys(MESSAGE_KEYS) as MessageKey[]

/**
 * Verify locale completeness at build time
 */
function verifyLocaleCompleteness() {
  const locales = {
    ja: jaMessages,
    en: enMessages,
    pseudo: pseudoMessages
  }
  
  for (const [locale, messages] of Object.entries(locales)) {
    const messageKeys = new Set(Object.keys(messages))
    const missingKeys = ALL_KEYS.filter(key => !messageKeys.has(key))
    const extraKeys = Object.keys(messages).filter(key => !MESSAGE_KEYS.hasOwnProperty(key))
    
    if (missingKeys.length > 0) {
      throw new Error(\`Locale '\${locale}' is missing keys: \${missingKeys.join(', ')}\`)
    }
    
    if (extraKeys.length > 0) {
      throw new Error(\`Locale '\${locale}' has extra keys: \${extraKeys.join(', ')}\`)
    }
  }
}

// Run verification during module import (build-time check)
verifyLocaleCompleteness()

export { verifyLocaleCompleteness }`

  fs.writeFileSync(
    path.join(localesDir, '_verification.ts'),
    verificationCode,
    'utf8'
  )
  console.log(`✅ Generated locale verification`)
}

/**
 * Main generation function
 */
function generateTypeScript() {
  console.log('🚀 Generating TypeScript code from message registry...')
  console.log(`📄 Registry: ${registryPath}`)
  console.log(`🎯 Target: ${config.targets.typescript.output_path}`)

  try {
    generateKeysFile()
    updateTypesFile()
    generateLocaleVerification()

    console.log('✨ TypeScript code generation completed successfully!')
  } catch (error) {
    console.error('❌ TypeScript generation failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateTypeScript()
}

module.exports = { generateTypeScript }
