#!/usr/bin/env node

/**
 * Go Code Generator for Message Registry
 *
 * Generates Go definitions from language-neutral YAML registry
 * For future Go backend implementation
 */

const fs = require('fs')
const path = require('path')
const { loadRegistryFromConfig } = require('./registry-loader')
const { loadConfig } = require('./config-loader')

let currentConfig = null
let registryContext = null
let registry = null
let registrySourceLabel = 'registry.yaml'
let registryFragments = []

function refreshRegistryContext() {
  registry = registryContext.registry
  if (
    registryContext.sourceType === 'file' &&
    registryContext.sources.length === 1
  ) {
    registrySourceLabel = registryContext.sources[0].relativePath
  } else {
    registrySourceLabel = registryContext.configuredPath
  }
  registryFragments = registryContext.sources.map(source => source.relativePath)
}

/**
 * Convert snake_case to PascalCase for Go constants
 */
function toPascalCase(str) {
  return str
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * Convert message key to Go constant name
 */
function toGoConstantName(key) {
  return key
    .split('.')
    .map(part =>
      part
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
    )
    .join('')
}

/**
 * Generate Go code file
 */
function generateGoFile() {
  const config = currentConfig || loadConfig()
  const messages = registry.messages || {}
  const allKeys = []

  // Extract all keys from nested structure
  for (const [namespace, namespaceMessages] of Object.entries(messages)) {
    for (const [messageKey, messageData] of Object.entries(namespaceMessages)) {
      allKeys.push({
        key: messageData.key,
        constant: toGoConstantName(messageData.key),
        namespace: messageData.namespace,
        description: messageData.description,
        deprecated: messageData.deprecated,
        apiUsage: messageData.api_usage,
        uiUsage: messageData.ui_usage,
      })
    }
  }

  // Group by namespace
  const keysByNamespace = {}
  allKeys.forEach(keyData => {
    if (!keysByNamespace[keyData.namespace]) {
      keysByNamespace[keyData.namespace] = []
    }
    keysByNamespace[keyData.namespace].push(keyData)
  })

  const goCode = `// Code generated from message registry - DO NOT EDIT
//
// Generated from: ${registrySourceLabel}
// Version: ${registry.metadata.version}
// Generated at: ${new Date().toISOString()}
//
// Run 'pnpm gen:messages' to regenerate this file

package ${config.targets.go.package_name}

import (
	"errors"
	"fmt"
)

// MessageKey represents a message identifier
type MessageKey string

// Message key constants
const (
${allKeys
  .map(({ key, constant, description, deprecated }) => {
    const deprecatedComment = deprecated
      ? '\n\t// Deprecated: This message key is deprecated'
      : ''
    return `\t// ${description}${deprecatedComment}
\t${constant} MessageKey = "${key}"`
  })
  .join('\n\n')}
)

// Namespace constants
const (
${Object.keys(keysByNamespace)
  .map(namespace => `\tNamespace${toPascalCase(namespace)} = "${namespace}"`)
  .join('\n')}
)

// AllMessageKeys contains all valid message keys
var AllMessageKeys = []MessageKey{
${allKeys.map(({ constant }) => `\t${constant},`).join('\n')}
}

${Object.entries(keysByNamespace)
  .map(([namespace, keys]) => {
    const constName = `${toPascalCase(namespace)}MessageKeys`
    return `// ${constName} contains all ${namespace} namespace message keys
var ${constName} = []MessageKey{
${keys.map(({ constant }) => `\t${constant},`).join('\n')}
}`
  })
  .join('\n\n')}

// APIMessageKeys contains keys used in API responses
var APIMessageKeys = []MessageKey{
${allKeys
  .filter(k => k.apiUsage)
  .map(({ constant }) => `\t${constant},`)
  .join('\n')}
}

// UIMessageKeys contains keys used in UI display
var UIMessageKeys = []MessageKey{
${allKeys
  .filter(k => k.uiUsage)
  .map(({ constant }) => `\t${constant},`)
  .join('\n')}
}

// IsValidMessageKey checks if the given key is valid
func IsValidMessageKey(key MessageKey) bool {
	switch key {
${allKeys.map(({ constant }) => `\tcase ${constant}:`).join('\n')}
		return true
	default:
		return false
	}
}

// GetNamespace returns the namespace of a message key
func GetNamespace(key MessageKey) string {
	switch {
${Object.entries(keysByNamespace)
  .map(
    ([namespace, keys]) =>
      `\tcase ${keys.map(({ constant }) => `key == ${constant}`).join(' || ')}:
\t\treturn "${namespace}"`
  )
  .join('\n')}
	default:
		return ""
	}
}

// ValidateMessageKey validates a message key and returns error if invalid
func ValidateMessageKey(key MessageKey) error {
	if !IsValidMessageKey(key) {
		return errors.New(fmt.Sprintf("invalid message key: %s", string(key)))
	}
	return nil
}

// MessageMetadata contains metadata about a message key
type MessageMetadata struct {
	Key         MessageKey \`json:"key"\`
	Namespace   string     \`json:"namespace"\`
	Description string     \`json:"description"\`
	Deprecated  bool       \`json:"deprecated"\`
	APIUsage    bool       \`json:"api_usage"\`
	UIUsage     bool       \`json:"ui_usage"\`
}

// GetMessageMetadata returns metadata for a message key
func GetMessageMetadata(key MessageKey) (MessageMetadata, error) {
	metadata := map[MessageKey]MessageMetadata{
${allKeys
  .map(
    ({
      key,
      constant,
      namespace,
      description,
      deprecated,
      apiUsage,
      uiUsage,
    }) =>
      `\t\t${constant}: {
\t\t\tKey:         ${constant},
\t\t\tNamespace:   "${namespace}",
\t\t\tDescription: "${description}",
\t\t\tDeprecated:  ${deprecated},
\t\t\tAPIUsage:    ${apiUsage},
\t\t\tUIUsage:     ${uiUsage},
\t\t},`
  )
  .join('\n')}
	}
	
	if meta, exists := metadata[key]; exists {
		return meta, nil
	}
	
	return MessageMetadata{}, errors.New(fmt.Sprintf("metadata not found for key: %s", string(key)))
}

// APIError represents an API error response
type APIError struct {
	Success bool       \`json:"success"\`
	Code    MessageKey \`json:"code"\`
	Message string     \`json:"message,omitempty"\` // Optional for backward compatibility
	Details interface{} \`json:"details,omitempty"\`
}

// APISuccess represents an API success response
type APISuccess struct {
	Success bool        \`json:"success"\`
	Code    MessageKey  \`json:"code"\`
	Message string      \`json:"message,omitempty"\` // Optional for backward compatibility
	Data    interface{} \`json:"data,omitempty"\`
}

// ValidationError represents a validation error detail
type ValidationError struct {
	Field   string     \`json:"field"\`
	Code    MessageKey \`json:"code"\`
	Message string     \`json:"message"\`
}

// ValidationErrorResponse represents a validation error response
type ValidationErrorResponse struct {
	APIError
	Errors []ValidationError \`json:"errors"\`
}

// NewAPIError creates a new API error response
func NewAPIError(code MessageKey) *APIError {
	return &APIError{
		Success: false,
		Code:    code,
	}
}

// NewAPISuccess creates a new API success response
func NewAPISuccess(code MessageKey) *APISuccess {
	return &APISuccess{
		Success: true,
		Code:    code,
	}
}

// WithMessage adds a message to the API response (for backward compatibility)
func (e *APIError) WithMessage(message string) *APIError {
	e.Message = message
	return e
}

// WithDetails adds details to the API error
func (e *APIError) WithDetails(details interface{}) *APIError {
	e.Details = details
	return e
}

// WithMessage adds a message to the API response (for backward compatibility)
func (s *APISuccess) WithMessage(message string) *APISuccess {
	s.Message = message
	return s
}

// WithData adds data to the API success response
func (s *APISuccess) WithData(data interface{}) *APISuccess {
	s.Data = data
	return s
}`

  // Ensure output directory exists
  const outputPath = path.resolve(config.targets.go.output_path)
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write Go file
  fs.writeFileSync(outputPath, goCode, 'utf8')
  console.log(`✅ Generated Go code: ${outputPath}`)
}

/**
 * Main generation function
 */
function generateGo(configOverride) {
  const config = configOverride || loadConfig()
  currentConfig = config

  if (!config.targets?.go?.enabled) {
    console.log('⏭️  Go code generation is disabled')
    return
  }

  registryContext = loadRegistryFromConfig(config.registry)
  refreshRegistryContext()
  console.log('🚀 Generating Go code from message registry...')
  const basePathForLog =
    registryContext.basePath || path.resolve(config.registry.path)
  console.log(
    '📄 Registry source (' + registryContext.sourceType + '): ' + basePathForLog
  )
  if (registryContext.sourceType === 'directory') {
    console.log('   Config path: ' + config.registry.path)
  }
  if (registryFragments.length === 1) {
    console.log('   Fragment: ' + registryFragments[0])
  } else if (registryFragments.length > 1) {
    console.log('   Fragments (' + registryFragments.length + '):')
    for (const fragment of registryFragments) {
      console.log('   • ' + fragment)
    }
  }
  console.log(`🎯 Target: ${config.targets.go.output_path}`)

  try {
    generateGoFile()
    console.log('✨ Go code generation completed successfully!')
  } catch (error) {
    console.error('❌ Go generation failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateGo()
}

module.exports = { generateGo }
