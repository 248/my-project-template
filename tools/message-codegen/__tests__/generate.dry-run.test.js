const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

test('dry run skips file generation and logs summary', () => {
  const keysPath = path.resolve(
    __dirname,
    '../../../packages/shared/src/messages/keys.ts'
  )

  const before = fs.readFileSync(keysPath, 'utf8')

  const output = execSync('node tools/message-codegen/generate.js --dry-run', {
    encoding: 'utf8',
  })

  assert.match(output, /Dry run mode: no files will be written/)
  assert.match(output, /Would generate TypeScript code/)

  const after = fs.readFileSync(keysPath, 'utf8')
  assert.strictEqual(after, before)
})
