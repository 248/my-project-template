import { describe, it, expect, afterEach } from 'vitest'

import {
  localeMessages,
  FALLBACK_SEQUENCE,
  FALLBACK_LOCALE,
  DEFAULT_LOCALE,
  normalizeLocale,
} from '../locales'
import { getMessageSafe, validateLocaleIntegrity } from '../utils'

const SAMPLE_KEY = 'ui.system_health_check_title'

const originalValues = {
  ja: localeMessages.ja[SAMPLE_KEY],
  en: localeMessages.en[SAMPLE_KEY],
  pseudo: localeMessages.pseudo[SAMPLE_KEY],
}

afterEach(() => {
  localeMessages.ja[SAMPLE_KEY] = originalValues.ja
  localeMessages.en[SAMPLE_KEY] = originalValues.en
  localeMessages.pseudo[SAMPLE_KEY] = originalValues.pseudo
})

describe('locale fallback policy', () => {
  it('falls back to Japanese first when primary locale lacks the message', () => {
    delete (localeMessages.en as Record<string, string>)[SAMPLE_KEY]

    const result = getMessageSafe(SAMPLE_KEY, 'en')

    expect(result).toBe(originalValues.ja)
  })

  it('falls back through the configured sequence for non-primary locales', () => {
    delete (localeMessages.pseudo as Record<string, string>)[SAMPLE_KEY]
    delete (localeMessages.ja as Record<string, string>)[SAMPLE_KEY]

    const result = getMessageSafe(SAMPLE_KEY, 'pseudo')

    expect(result).toBe(originalValues.en)
  })

  it('normalizes unsupported locales to the default locale (ja)', () => {
    expect(normalizeLocale('fr-FR')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale('')).toBe(DEFAULT_LOCALE)
  })

  it('uses the fallback sequence when validating locale integrity', () => {
    const report = validateLocaleIntegrity('pseudo')

    expect(report.missingKeys).toEqual([])
    expect(report.extraKeys).toEqual([])
    expect(report.isValid).toBe(true)
    expect(FALLBACK_SEQUENCE[0]).toBe('ja')
    expect(FALLBACK_SEQUENCE).toContain('en')
    expect(FALLBACK_LOCALE).toBe('ja')
  })
})
