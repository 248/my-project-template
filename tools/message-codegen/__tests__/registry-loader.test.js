import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

import registryLoader from '../registry-loader.js'

const { loadRegistryFromConfig } = registryLoader

const fixturesRoot = path.resolve(__dirname, 'fixtures', 'registry-split')

function writeYaml(filePath, lines) {
  const content = lines.join('\n') + '\n'
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

const toPosix = value => value.replaceAll('\\', '/')

describe('registry-loader', () => {
  beforeEach(() => {
    if (fs.existsSync(fixturesRoot)) {
      fs.rmSync(fixturesRoot, { recursive: true, force: true })
    }
    fs.mkdirSync(fixturesRoot, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(fixturesRoot)) {
      fs.rmSync(fixturesRoot, { recursive: true, force: true })
    }
  })

  it('merges registry fragments in stable path order', () => {
    const actionPath = path.join(fixturesRoot, 'action.yaml')
    const uiPath = path.join(fixturesRoot, 'ui.yaml')
    const featurePath = path.join(fixturesRoot, 'features', 'home.yaml')

    writeYaml(actionPath, [
      'metadata:',
      "  version: '1.0.0'",
      "  supported_languages: ['typescript']",
      "  supported_locales: ['ja', 'en']",
      'messages:',
      '  action:',
      '    primary_button:',
      "      key: 'action.primary_button'",
      "      namespace: 'action'",
      "      category: 'ui'",
      "      description: 'Primary action button label'",
      '      template_params: []',
      "      since: '1.0.0'",
      '      deprecated: false',
      '      api_usage: false',
      '      ui_usage: true',
    ])

    writeYaml(uiPath, [
      'messages:',
      '  ui:',
      '    welcome_message:',
      "      key: 'ui.welcome_message'",
      "      namespace: 'ui'",
      "      category: 'info'",
      "      description: 'Welcome banner message'",
      '      template_params: []',
      "      since: '1.0.0'",
      '      deprecated: false',
      '      api_usage: false',
      '      ui_usage: true',
    ])

    writeYaml(featurePath, [
      'messages:',
      '  ui:',
      '    home_title:',
      "      key: 'ui.home_title'",
      "      namespace: 'ui'",
      "      category: 'info'",
      "      description: 'Home page title'",
      '      template_params: []',
      "      since: '1.0.0'",
      '      deprecated: false',
      '      api_usage: false',
      '      ui_usage: true',
    ])

    const context = loadRegistryFromConfig({ path: fixturesRoot })

    expect(context.sourceType).toBe('directory')

    const sourcePaths = context.sources.map(source =>
      toPosix(source.relativePath)
    )

    expect(sourcePaths).toEqual([
      'tools/message-codegen/__tests__/fixtures/registry-split/action.yaml',
      'tools/message-codegen/__tests__/fixtures/registry-split/features/home.yaml',
      'tools/message-codegen/__tests__/fixtures/registry-split/ui.yaml',
    ])

    expect(context.registry.metadata.version).toBe('1.0.0')
    expect(context.registry.metadata.supported_locales).toEqual(['ja', 'en'])

    const namespaces = Object.keys(context.registry.messages)
    expect(namespaces).toEqual(['action', 'ui'])

    const uiKeys = Object.keys(context.registry.messages.ui)
    expect(uiKeys).toEqual(['home_title', 'welcome_message'])

    const fallbackContext = loadRegistryFromConfig({
      path: fixturesRoot + '.yaml',
    })

    expect(
      fallbackContext.sources.map(source => toPosix(source.relativePath))
    ).toEqual(sourcePaths)
  })
})
