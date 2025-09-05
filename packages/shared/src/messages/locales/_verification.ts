/**
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
    pseudo: pseudoMessages,
  }

  for (const [locale, messages] of Object.entries(locales)) {
    const messageKeys = new Set(Object.keys(messages))
    const missingKeys = ALL_KEYS.filter(key => !messageKeys.has(key))
    const extraKeys = Object.keys(messages).filter(
      key => !MESSAGE_KEYS.hasOwnProperty(key)
    )

    if (missingKeys.length > 0) {
      throw new Error(
        `Locale '${locale}' is missing keys: ${missingKeys.join(', ')}`
      )
    }

    if (extraKeys.length > 0) {
      throw new Error(
        `Locale '${locale}' has extra keys: ${extraKeys.join(', ')}`
      )
    }
  }
}

// Run verification during module import (build-time check)
verifyLocaleCompleteness()

export { verifyLocaleCompleteness }
