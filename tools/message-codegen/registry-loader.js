const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

/**
 * Utility: check if value is a plain object
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

/**
 * Utility: deep-clone a JSON-compatible value
 */
function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map(item => cloneDeep(item))
  }

  if (isPlainObject(value)) {
    const clone = {}
    for (const key of Object.keys(value)) {
      clone[key] = cloneDeep(value[key])
    }
    return clone
  }

  return value
}

/**
 * Utility: compare objects shallowly for equality
 */
function objectsEqual(a, b) {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    const valueA = a[key]
    const valueB = b[key]

    const bothObjects = isPlainObject(valueA) && isPlainObject(valueB)
    const bothArrays = Array.isArray(valueA) && Array.isArray(valueB)

    if (bothObjects && !objectsEqual(valueA, valueB)) {
      return false
    }

    if (bothArrays && !arraysEqual(valueA, valueB)) {
      return false
    }

    if (!bothObjects && !bothArrays && valueA !== valueB) {
      return false
    }
  }

  return true
}

/**
 * Utility: compare arrays shallowly for equality
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i += 1) {
    const valueA = a[i]
    const valueB = b[i]

    const bothObjects = isPlainObject(valueA) && isPlainObject(valueB)
    const bothArrays = Array.isArray(valueA) && Array.isArray(valueB)

    if (bothObjects && !objectsEqual(valueA, valueB)) {
      return false
    }

    if (bothArrays && !arraysEqual(valueA, valueB)) {
      return false
    }

    if (!bothObjects && !bothArrays && valueA !== valueB) {
      return false
    }
  }

  return true
}

/**
 * Register origin paths for nested values (used for conflict reporting)
 */
function registerOrigins(value, originMap, sourcePath, prefix = []) {
  const currentPath = prefix.length > 0 ? prefix.join('.') : ''

  if (currentPath && !originMap.has(currentPath)) {
    originMap.set(currentPath, sourcePath)
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (isPlainObject(item) || Array.isArray(item)) {
        const nextPrefix = prefix.concat('[' + index + ']')
        registerOrigins(item, originMap, sourcePath, nextPrefix)
      }
    })
    return
  }

  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      registerOrigins(value[key], originMap, sourcePath, prefix.concat(key))
    }
  }
}

/**
 * Merge source fragment into target registry with conflict detection
 */
function mergeFragment(target, source, originMap, sourcePath, prefix = []) {
  if (!isPlainObject(source)) {
    throw new Error('Registry fragment must be a YAML object: ' + sourcePath)
  }

  for (const key of Object.keys(source)) {
    const nextPath = prefix.concat(key)
    const pathKey = nextPath.join('.')
    const incomingValue = source[key]
    const existingValue = target[key]

    if (existingValue === undefined) {
      target[key] = cloneDeep(incomingValue)
      registerOrigins(incomingValue, originMap, sourcePath, nextPath)
      continue
    }

    const bothObjects =
      isPlainObject(existingValue) && isPlainObject(incomingValue)
    const bothArrays =
      Array.isArray(existingValue) && Array.isArray(incomingValue)

    if (bothObjects) {
      mergeFragment(
        existingValue,
        incomingValue,
        originMap,
        sourcePath,
        nextPath
      )
      continue
    }

    if (bothArrays) {
      if (!arraysEqual(existingValue, incomingValue)) {
        const existingSource = originMap.get(pathKey) || 'previous fragment'
        throw new Error(
          'Conflicting array value for ' +
            "'" +
            pathKey +
            "' between " +
            existingSource +
            ' and ' +
            sourcePath
        )
      }
      continue
    }

    if (existingValue !== incomingValue) {
      const existingSource = originMap.get(pathKey) || 'previous fragment'
      throw new Error(
        'Conflicting value for ' +
          "'" +
          pathKey +
          "' between " +
          existingSource +
          ' and ' +
          sourcePath
      )
    }
  }
}

/**
 * Recursively collect YAML files under the directory
 */
function collectYamlFiles(rootDir) {
  const collected = []

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
        collected.push(fullPath)
      }
    }
  }

  walk(rootDir)
  collected.sort((a, b) => a.localeCompare(b))

  return collected
}

/**
 * Resolve registry sources based on configuration
 */
function resolveRegistrySources(registryConfig) {
  if (!registryConfig || !registryConfig.path) {
    throw new Error('registry.path is not defined in config.json')
  }

  const configuredPath = registryConfig.path
  let absolutePath = path.resolve(configuredPath)

  if (fs.existsSync(absolutePath)) {
    const stats = fs.statSync(absolutePath)
    if (stats.isFile()) {
      return {
        type: 'file',
        configuredPath,
        basePath: absolutePath,
        sources: [absolutePath],
      }
    }

    if (stats.isDirectory()) {
      const sources = collectYamlFiles(absolutePath)
      if (sources.length === 0) {
        throw new Error('No YAML files found under directory: ' + absolutePath)
      }

      return {
        type: 'directory',
        configuredPath,
        basePath: absolutePath,
        sources,
      }
    }
  }

  const ext = path.extname(absolutePath)
  if (ext && (ext === '.yaml' || ext === '.yml')) {
    const fallbackDir = path.join(
      path.dirname(absolutePath),
      path.basename(absolutePath, ext)
    )
    if (fs.existsSync(fallbackDir) && fs.statSync(fallbackDir).isDirectory()) {
      const sources = collectYamlFiles(fallbackDir)
      if (sources.length === 0) {
        throw new Error('No YAML files found under directory: ' + fallbackDir)
      }

      return {
        type: 'directory',
        configuredPath,
        basePath: fallbackDir,
        sources,
      }
    }
  }

  throw new Error('Registry path not found: ' + absolutePath)
}

/**
 * Load and merge registry fragments
 */
function loadRegistryFromConfig(registryConfig) {
  const resolved = resolveRegistrySources(registryConfig)
  const originMap = new Map()
  const registry = {}
  const sources = []

  for (const sourcePath of resolved.sources) {
    const fileContent = fs.readFileSync(sourcePath, 'utf8')
    const parsed = yaml.load(fileContent) || {}

    if (!isPlainObject(parsed)) {
      throw new Error(
        'Registry fragment must be an object at top level: ' + sourcePath
      )
    }

    mergeFragment(registry, parsed, originMap, sourcePath)
    sources.push({
      absolutePath: sourcePath,
      relativePath: path.relative(process.cwd(), sourcePath),
    })
  }

  return {
    registry,
    sources,
    sourceType: resolved.type,
    basePath: resolved.basePath,
    configuredPath: resolved.configuredPath,
  }
}

module.exports = {
  loadRegistryFromConfig,
  resolveRegistrySources,
}
