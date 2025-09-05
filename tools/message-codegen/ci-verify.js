#!/usr/bin/env node

/**
 * CI Message Verification Tool
 *
 * Comprehensive verification for continuous integration
 * Enforces "guard rails" for message registry consistency
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { verifyMessages } = require('./verify')

/**
 * CI-specific verification results
 */
class CIVerificationResults {
  constructor() {
    this.checks = []
    this.failed = []
    this.warnings = []
    this.startTime = Date.now()
  }

  addCheck(name, success, details = {}, duration = 0) {
    const check = { name, success, details, duration, timestamp: Date.now() }
    this.checks.push(check)

    if (!success) {
      this.failed.push(check)
    }

    return check
  }

  addWarning(message, details = {}) {
    this.warnings.push({ message, details, timestamp: Date.now() })
  }

  hasFailures() {
    return this.failed.length > 0
  }

  getTotalDuration() {
    return Date.now() - this.startTime
  }

  getSuccessRate() {
    return this.checks.length > 0
      ? ((this.checks.length - this.failed.length) / this.checks.length) * 100
      : 0
  }
}

/**
 * Run command with timing
 */
function runCommand(command, description) {
  const startTime = Date.now()
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    const duration = Date.now() - startTime
    return { success: true, result, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    return { success: false, error: error.message, duration }
  }
}

/**
 * Check bundle size impact
 */
function checkBundleSize(results) {
  console.log('📦 Checking bundle size impact...')

  const startTime = Date.now()

  try {
    // Check if size-limit is configured
    const packageJsonPath = path.resolve('package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    if (!packageJson['size-limit']) {
      results.addWarning('size-limit not configured', {
        recommendation: 'Add size-limit configuration to monitor bundle impact',
      })
      return results.addCheck(
        'Bundle size monitoring',
        false,
        {
          error: 'size-limit not configured',
        },
        Date.now() - startTime
      )
    }

    // Run size-limit check
    const sizeResult = runCommand('npx size-limit', 'Bundle size check')

    results.addCheck(
      'Bundle size verification',
      sizeResult.success,
      {
        duration: sizeResult.duration,
        output: sizeResult.success
          ? 'Bundle size within limits'
          : sizeResult.error,
      },
      sizeResult.duration
    )
  } catch (error) {
    results.addCheck(
      'Bundle size verification',
      false,
      {
        error: error.message,
      },
      Date.now() - startTime
    )
  }
}

/**
 * Check for similar/duplicate messages
 */
function checkMessageSimilarity(results) {
  console.log('🔍 Checking for similar/duplicate messages...')

  const startTime = Date.now()

  try {
    // Load registry
    const registryPath = path.resolve('contracts/messages/registry.yaml')
    const yaml = require('js-yaml')
    const registry = yaml.load(fs.readFileSync(registryPath, 'utf8'))

    // Extract messages for similarity check
    const messages = []
    for (const [namespace, namespaceMessages] of Object.entries(
      registry.messages || {}
    )) {
      for (const [messageKey, messageData] of Object.entries(
        namespaceMessages
      )) {
        messages.push({
          key: messageData.key,
          description: messageData.description,
          namespace: messageData.namespace,
        })
      }
    }

    // Simple similarity check (can be enhanced)
    const similarityThreshold = 0.8
    const similarPairs = []
    const duplicateDescriptions = []

    // Check for exact duplicate descriptions
    const descriptionMap = new Map()
    for (const message of messages) {
      if (descriptionMap.has(message.description)) {
        duplicateDescriptions.push({
          description: message.description,
          keys: [descriptionMap.get(message.description), message.key],
        })
      } else {
        descriptionMap.set(message.description, message.key)
      }
    }

    // Check for similar descriptions (simplified)
    for (let i = 0; i < messages.length; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const desc1 = messages[i].description.toLowerCase()
        const desc2 = messages[j].description.toLowerCase()

        // Simple word overlap check
        const words1 = new Set(desc1.split(/\\s+/))
        const words2 = new Set(desc2.split(/\\s+/))
        const intersection = new Set([...words1].filter(x => words2.has(x)))
        const union = new Set([...words1, ...words2])
        const similarity = intersection.size / union.size

        if (similarity > similarityThreshold && desc1 !== desc2) {
          similarPairs.push({
            key1: messages[i].key,
            key2: messages[j].key,
            similarity: Math.round(similarity * 100),
            desc1: messages[i].description,
            desc2: messages[j].description,
          })
        }
      }
    }

    const hasIssues =
      duplicateDescriptions.length > 0 || similarPairs.length > 0

    results.addCheck(
      'Message similarity check',
      !hasIssues,
      {
        duplicates: duplicateDescriptions.length,
        similar_pairs: similarPairs.length,
        details: hasIssues
          ? { duplicateDescriptions, similarPairs: similarPairs.slice(0, 5) }
          : {},
      },
      Date.now() - startTime
    )

    if (hasIssues) {
      results.addWarning(
        `Found ${duplicateDescriptions.length} duplicate and ${similarPairs.length} similar message descriptions`
      )
    }
  } catch (error) {
    results.addCheck(
      'Message similarity check',
      false,
      {
        error: error.message,
      },
      Date.now() - startTime
    )
  }
}

/**
 * Check TypeScript compilation
 */
function checkTypeScriptCompilation(results) {
  console.log('🔷 Checking TypeScript compilation...')

  const tsResult = runCommand('pnpm type-check', 'TypeScript compilation')

  results.addCheck(
    'TypeScript compilation',
    tsResult.success,
    {
      output: tsResult.success ? 'All types valid' : tsResult.error,
    },
    tsResult.duration
  )
}

/**
 * Check linting
 */
function checkLinting(results) {
  console.log('🧹 Running linting checks...')

  const lintResult = runCommand('pnpm lint', 'ESLint check')

  results.addCheck(
    'Linting',
    lintResult.success,
    {
      output: lintResult.success ? 'No linting errors' : lintResult.error,
    },
    lintResult.duration
  )
}

/**
 * Verify generated code is up-to-date
 */
function checkGeneratedCodeFreshness(results) {
  console.log('🔄 Checking if generated code is up-to-date...')

  const startTime = Date.now()

  try {
    // Generate code in temporary directory and compare
    const tempDir = fs.mkdtempSync(
      path.join(require('os').tmpdir(), 'msg-verify-')
    )

    // This is a simplified check - in practice, you'd generate to temp and compare
    // For now, just check if the generated files exist and are newer than registry

    const registryPath = path.resolve('contracts/messages/registry.yaml')
    const tsKeysPath = path.resolve('packages/shared/src/messages/keys.ts')

    const registryStat = fs.statSync(registryPath)
    const tsKeysStat = fs.existsSync(tsKeysPath)
      ? fs.statSync(tsKeysPath)
      : null

    const isUpToDate = tsKeysStat && tsKeysStat.mtime >= registryStat.mtime

    results.addCheck(
      'Generated code freshness',
      isUpToDate,
      {
        registry_modified: registryStat.mtime.toISOString(),
        keys_generated: tsKeysStat ? tsKeysStat.mtime.toISOString() : 'never',
        recommendation: isUpToDate
          ? 'Generated code is up-to-date'
          : 'Run pnpm gen:messages to update generated code',
      },
      Date.now() - startTime
    )

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })
  } catch (error) {
    results.addCheck(
      'Generated code freshness',
      false,
      {
        error: error.message,
      },
      Date.now() - startTime
    )
  }
}

/**
 * Generate CI report
 */
function generateCIReport(results) {
  const totalDuration = results.getTotalDuration()
  const successRate = results.getSuccessRate()

  console.log('\\n' + '='.repeat(60))
  console.log('🔍 CI Message Verification Report')
  console.log('='.repeat(60))

  console.log(`\\n📊 Summary:`)
  console.log(`   Total checks: ${results.checks.length}`)
  console.log(`   Passed: ${results.checks.length - results.failed.length}`)
  console.log(`   Failed: ${results.failed.length}`)
  console.log(`   Warnings: ${results.warnings.length}`)
  console.log(`   Success rate: ${successRate.toFixed(1)}%`)
  console.log(`   Total duration: ${totalDuration}ms`)

  if (results.checks.length > 0) {
    console.log(`\\n📋 Check Results:`)
    for (const check of results.checks) {
      const status = check.success ? '✅' : '❌'
      const duration = check.duration ? ` (${check.duration}ms)` : ''
      console.log(`   ${status} ${check.name}${duration}`)

      if (!check.success && check.details.error) {
        console.log(`      Error: ${check.details.error}`)
      }
      if (check.details.recommendation) {
        console.log(`      💡 ${check.details.recommendation}`)
      }
    }
  }

  if (results.warnings.length > 0) {
    console.log(`\\n⚠️  Warnings:`)
    for (const warning of results.warnings) {
      console.log(`   • ${warning.message}`)
    }
  }

  if (results.failed.length > 0) {
    console.log(`\\n❌ Failed Checks:`)
    for (const failure of results.failed) {
      console.log(`   • ${failure.name}`)
      if (failure.details.error) {
        console.log(`     ${failure.details.error}`)
      }
    }
  }

  console.log('\\n' + '='.repeat(60))

  if (results.hasFailures()) {
    console.log('❌ CI verification FAILED')
    console.log('💡 Fix the issues above and re-run verification')
    return false
  } else {
    console.log('✅ CI verification PASSED')
    return true
  }
}

/**
 * Main CI verification function
 */
async function runCIVerification() {
  console.log('🚀 Starting CI message verification...')
  console.log('⏱️  Running comprehensive checks for continuous integration\\n')

  const results = new CIVerificationResults()

  try {
    // 1. Core message verification
    console.log('📋 Running core message verification...')
    const coreVerifyResult = runCommand(
      'node tools/message-codegen/verify.js',
      'Core verification'
    )
    results.addCheck(
      'Core message verification',
      coreVerifyResult.success,
      {
        output: coreVerifyResult.success
          ? 'All core checks passed'
          : coreVerifyResult.error,
      },
      coreVerifyResult.duration
    )

    // 2. Generated code freshness
    checkGeneratedCodeFreshness(results)

    // 3. TypeScript compilation
    checkTypeScriptCompilation(results)

    // 4. Linting
    checkLinting(results)

    // 5. Message similarity check
    checkMessageSimilarity(results)

    // 6. Bundle size check
    checkBundleSize(results)

    // Generate report
    const success = generateCIReport(results)

    // Exit with appropriate code
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error(`\\n💥 CI verification crashed: ${error.message}`)
    process.exit(1)
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CI Message Verification Tool

Comprehensive verification for continuous integration environments.
Enforces "guard rails" for message registry consistency.

Usage: node ci-verify.js [options]

Options:
  --help, -h        Show this help message
  --verbose, -v     Verbose output (shows all check details)

Checks performed:
  • Core message verification (registry ↔ generated code ↔ locales)
  • Generated code freshness (detect stale generated files)
  • TypeScript compilation (ensure generated code compiles)
  • Linting (code quality and style)
  • Message similarity detection (duplicate/similar messages)
  • Bundle size monitoring (Tree Shaking effectiveness)

Examples:
  node ci-verify.js                     # Run all CI checks
  pnpm ci:verify:messages               # Same via npm script
`)
    process.exit(0)
  }

  runCIVerification()
}

module.exports = { runCIVerification }
