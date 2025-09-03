#!/usr/bin/env node

import SwaggerParser from '@apidevtools/swagger-parser'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import yaml from 'js-yaml'
import path from 'node:path'

// 固定化されたバージョンで決定的な生成を保証
const OPENAPI_TYPESCRIPT_VERSION = '7.4.2'

// パス設定
const CONTRACT_PATH = 'packages/api-contracts/openapi.yaml'
// 新しい契約ベースアーキテクチャ：責務分離・移行容易性の向上
const OUTPUT_BASE = 'packages/api-contracts/codegen/ts/src/generated'

console.log('🔄 Generating TypeScript client from OpenAPI specification...')
console.log(`📋 Using openapi-typescript@${OPENAPI_TYPESCRIPT_VERSION}`)

// 出力ディレクトリを作成
if (!existsSync(OUTPUT_BASE)) {
  mkdirSync(OUTPUT_BASE, { recursive: true })
  console.log(`📁 Created output directory: ${OUTPUT_BASE}`)
}

/**
 * OpenAPI仕様からZodスキーマを動的生成
 */
function generateZodSchema(schema, schemaName, allSchemas) {
  if (!schema) return 'z.unknown()'

  // $refの解決
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    return `${refName}Schema`
  }

  // 基本型の処理
  switch (schema.type) {
    case 'string':
      let zodString = 'z.string()'
      if (schema.format === 'email') zodString += '.email()'
      if (schema.format === 'date-time') zodString += '.datetime()'
      if (schema.enum) {
        const enumValues = schema.enum.map(v => `'${v}'`).join(', ')
        zodString = `z.enum([${enumValues}])`
      }
      if (schema.nullable) zodString += '.nullable()'
      return zodString

    case 'integer':
    case 'number':
      let zodNumber = schema.type === 'integer' ? 'z.number().int()' : 'z.number()'
      if (schema.minimum !== undefined) zodNumber += `.min(${schema.minimum})`
      if (schema.maximum !== undefined) zodNumber += `.max(${schema.maximum})`
      if (schema.nullable) zodNumber += '.nullable()'
      return zodNumber

    case 'boolean':
      return schema.nullable ? 'z.boolean().nullable()' : 'z.boolean()'

    case 'array':
      const itemSchema = generateZodSchema(schema.items, null, allSchemas)
      return schema.nullable ? `z.array(${itemSchema}).nullable()` : `z.array(${itemSchema})`

    case 'object':
      if (schema.properties) {
        const properties = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required?.includes(key)
          let propSchema = generateZodSchema(prop, null, allSchemas)
          if (!isRequired && !prop.nullable) propSchema += '.optional()'
          return `  ${key}: ${propSchema}`
        }).join(',\n')
        
        let objectSchema = `z.object({\n${properties}\n})`
        if (schema.nullable) objectSchema += '.nullable()'
        return objectSchema
      }
      return schema.nullable ? 'z.object({}).nullable()' : 'z.object({})'

    default:
      return 'z.unknown()'
  }
}

/**
 * OpenAPIパスからAPIメソッドを生成
 */
function generateApiMethod(path, method, operation, allPaths) {
  const methodName = operation.operationId
  if (!methodName) return ''

  // パラメータの処理
  const pathParams = operation.parameters?.filter(p => p.in === 'path') || []
  const queryParams = operation.parameters?.filter(p => p.in === 'query') || []
  
  // 引数の組み立て
  const args = []
  let hasRequestBody = false
  let requestBodySchemaName = ''
  
  pathParams.forEach(param => {
    args.push(`${param.name}: string`)
  })
  
  if (operation.requestBody) {
    hasRequestBody = true
    const contentType = Object.keys(operation.requestBody.content)[0]
    const schema = operation.requestBody.content[contentType]?.schema
    if (schema?.$ref) {
      requestBodySchemaName = schema.$ref.split('/').pop()
      args.push(`data: schemas.${requestBodySchemaName}`)
    } else {
      // インライン型の場合は any を使用
      args.push('data: any')
    }
  }
  
  if (queryParams.length > 0) {
    const queryType = queryParams.map(p => {
      const required = p.required ? '' : '?'
      const type = p.schema.type === 'integer' ? 'number' : 'string'
      return `${p.name}${required}: ${type}`
    }).join('; ')
    args.push(`query?: { ${queryType} }`)
  }

  const argString = args.join(', ')

  // レスポンススキーマの決定
  const successResponse = operation.responses?.['200'] || operation.responses?.['201']
  let returnType = 'any'
  let parseSchema = 'response.data'
  
  if (successResponse?.content?.['application/json']?.schema) {
    const schema = successResponse.content['application/json'].schema
    if (schema.$ref) {
      const schemaName = schema.$ref.split('/').pop()
      parseSchema = `schemas.${schemaName}Schema.parse(response.data)`
      returnType = `schemas.${schemaName}`
    } else if (schema.type === 'array' && schema.items?.$ref) {
      const schemaName = schema.items.$ref.split('/').pop()
      parseSchema = `z.array(schemas.${schemaName}Schema).parse(response.data)`
      returnType = `schemas.${schemaName}[]`
    } else if (schema.type === 'object' && schema.properties) {
      // インライン型の場合は any のままにして response.data を返す
      parseSchema = 'response.data'
      returnType = 'any'
    }
  }

  // リクエストオブジェクトの構築
  const requestParts = []
  const paramsParts = []
  
  if (pathParams.length > 0) {
    const pathObj = pathParams.map(p => `${p.name}`).join(', ')
    paramsParts.push(`path: { ${pathObj} }`)
  }
  if (queryParams.length > 0) {
    paramsParts.push('query: query as any')
  }
  
  if (paramsParts.length > 0) {
    requestParts.push(`params: { ${paramsParts.join(', ')} }`)
  }
  if (hasRequestBody) {
    requestParts.push('body: validatedData')
  }

  const requestObj = requestParts.length > 0 ? `, {\n      ${requestParts.join(',\n      ')}\n    }` : ''

  // バリデーションコード
  let validationCode = ''
  if (hasRequestBody) {
    if (requestBodySchemaName) {
      validationCode = `    const validatedData = schemas.${requestBodySchemaName}Schema.parse(data)\n`
    } else {
      validationCode = `    const validatedData = data\n`
    }
  }

  return `
  async ${methodName}(${argString}): Promise<${returnType}> {
${validationCode}    const response = await client.${method.toUpperCase()}('${path}'${requestObj}) as any
    if (response.error) {
      throw new Error(\`API Error: \${JSON.stringify(response.error)}\`)
    }
    return ${parseSchema}
  },`
}

try {
  // 1. OpenAPI仕様を解析
  console.log('📋 Parsing OpenAPI specification...')
  const api = await SwaggerParser.dereference(CONTRACT_PATH)
  
  // 2. TypeScript型定義を生成
  console.log('📝 Generating TypeScript types...')
  execSync(
    `npx -y openapi-typescript@${OPENAPI_TYPESCRIPT_VERSION} ${CONTRACT_PATH} -o ${OUTPUT_BASE}/types.ts`,
    { stdio: 'inherit', cwd: process.cwd() }
  )

  // 3. 動的Zodスキーマを生成
  console.log('🔍 Generating Zod schemas from OpenAPI components...')
  
  const schemas = api.components?.schemas || {}
  let schemasContent = `// Auto-generated Zod schemas from OpenAPI spec
// Generated at: ${new Date().toISOString()}

import { z } from 'zod'

`

  // スキーマの順序を解決するための依存関係解析
  const schemaOrder = []
  const processed = new Set()

  function addSchemaDependencies(schemaName) {
    if (processed.has(schemaName)) return
    
    const schema = schemas[schemaName]
    if (!schema) return

    // 依存関係を先に処理
    if (schema.properties) {
      Object.values(schema.properties).forEach(prop => {
        if (prop.$ref) {
          const depName = prop.$ref.split('/').pop()
          if (schemas[depName] && !processed.has(depName)) {
            addSchemaDependencies(depName)
          }
        }
      })
    }

    schemaOrder.push(schemaName)
    processed.add(schemaName)
  }

  // すべてのスキーマの依存関係を解決
  Object.keys(schemas).forEach(schemaName => {
    addSchemaDependencies(schemaName)
  })

  // スキーマを定義順に生成
  schemaOrder.forEach(schemaName => {
    const schema = schemas[schemaName]
    const zodSchema = generateZodSchema(schema, schemaName, schemas)
    schemasContent += `export const ${schemaName}Schema = ${zodSchema}\n\n`
  })

  // 型定義をエクスポート
  schemasContent += '// Export type definitions for enhanced type safety\n'
  schemaOrder.forEach(schemaName => {
    schemasContent += `export type ${schemaName} = z.infer<typeof ${schemaName}Schema>\n`
  })

  writeFileSync(`${OUTPUT_BASE}/schemas.ts`, schemasContent)

  // 4. 動的APIクライアントを生成
  console.log('🌐 Generating API client from OpenAPI paths...')
  
  let clientContent = `// Auto-generated type-safe API client from OpenAPI spec
// Generated at: ${new Date().toISOString()}

import createClient from 'openapi-fetch'
import type { paths } from './types'
import * as schemas from './schemas'
import { z } from 'zod'

// Create the base client
export const client = createClient<paths>({
  baseUrl: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000',
})

// Enhanced API client with validation and error handling
export const api = {`

  // すべてのパスとオペレーションを処理
  const paths = api.paths || {}
  Object.entries(paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        const methodCode = generateApiMethod(path, method, operation, paths)
        clientContent += methodCode
      }
    })
  })

  clientContent += `
}

// Utility functions
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export function isApiError(response: any): response is { error: string } {
  return response && typeof response.error === 'string'
}

export function isApiSuccess<T>(response: any): response is { success: true; data: T } {
  return response && response.success === true
}
`

  writeFileSync(`${OUTPUT_BASE}/client.ts`, clientContent)

  console.log('✅ TypeScript client generated successfully!')
  console.log(`📍 Output: ${OUTPUT_BASE}/`)
  console.log('  - types.ts (TypeScript type definitions)')
  console.log('  - schemas.ts (Zod validation schemas)')
  console.log('  - client.ts (Type-safe API client)')
  console.log('🎯 Dynamic generation based on OpenAPI specification completed!')

} catch (error) {
  console.error('❌ Error generating TypeScript client:', error.message)
  process.exit(1)
}