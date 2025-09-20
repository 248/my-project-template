#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { loadRegistryFromConfig } = require('./registry-loader')

function readConfig() {
  const configPath =
    process.env.MESSAGE_CONFIG_PATH || path.join(__dirname, 'config.json')
  const raw = fs.readFileSync(configPath, 'utf8')
  return JSON.parse(raw)
}

function ensureLocaleFile(localePath) {
  if (!fs.existsSync(localePath)) {
    return null
  }

  return fs.readFileSync(localePath, 'utf8')
}

function extractLocaleKeys(fileContent) {
  const matches = fileContent.match(/'([^']+)':\s*['"][^'"]*['"],?/g) || []
  return matches.map(match => match.match(/'([^']+)':/)[1])
}

function main() {
  const summary = {
    locales: {},
    registryKeyCount: 0,
    warnings: 0,
  }

  const config = readConfig()
  const context = loadRegistryFromConfig(config.registry)
  const registry = context.registry
  const registryKeys = new Set()

  for (const messages of Object.values(registry.messages || {})) {
    for (const { key } of Object.values(messages || {})) {
      if (key) {
        registryKeys.add(key)
      }
    }
  }

  summary.registryKeyCount = registryKeys.size

  const localesDir = path.resolve(
    config.locales?.output_dir || 'packages/shared/src/messages/locales'
  )
  const supportedLocales = Array.isArray(config.locales?.supported)
    ? config.locales.supported
    : ['ja', 'en', 'pseudo']

  for (const locale of supportedLocales) {
    const localePath = path.join(localesDir, `${locale}.ts`)
    const fileContent = ensureLocaleFile(localePath)

    if (!fileContent) {
      summary.locales[locale] = {
        missing: Array.from(registryKeys),
        extra: [],
        error: `Locale file not found at ${localePath}`,
      }
      summary.warnings += 1
      continue
    }

    const localeKeys = new Set(extractLocaleKeys(fileContent))
    const missing = Array.from(registryKeys).filter(key => !localeKeys.has(key))
    const extra = Array.from(localeKeys).filter(key => !registryKeys.has(key))

    summary.locales[locale] = {
      missing,
      extra,
    }

    if (missing.length > 0 || extra.length > 0) {
      summary.warnings += 1
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
