const fs = require('fs')
const path = require('path')

let cachedConfig = null
let cachedPath = null

function getConfigPath() {
  return process.env.MESSAGE_CONFIG_PATH || path.join(__dirname, 'config.json')
}

function loadConfig(forceReload = false) {
  const configPath = getConfigPath()

  if (!forceReload && cachedConfig && cachedPath === configPath) {
    return cachedConfig
  }

  const content = fs.readFileSync(configPath, 'utf8')
  cachedConfig = JSON.parse(content)
  cachedPath = configPath
  return cachedConfig
}

module.exports = {
  loadConfig,
  getConfigPath,
}
