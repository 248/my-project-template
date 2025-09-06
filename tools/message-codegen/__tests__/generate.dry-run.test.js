import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Message Code Generator - Dry Run', () => {
  it('dry run skips file generation and logs summary', () => {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8')
    )
    const keysPath = path.resolve(
      __dirname,
      '../../../',
      config.targets.typescript.output_path
    )

    const before = fs.readFileSync(keysPath, 'utf8')

    const output = execSync(
      'node tools/message-codegen/generate.js --dry-run',
      {
        encoding: 'utf8',
      }
    )

    expect(output).toMatch(/Dry run mode: no files will be written/)
    expect(output).toMatch(/Would generate TypeScript code/)

    const after = fs.readFileSync(keysPath, 'utf8')
    expect(after).toBe(before)
  })
})
