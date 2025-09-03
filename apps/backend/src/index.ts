import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

import { createLogger } from '@/utils/logger'

// ロガー設定
const log = createLogger('server')

// OpenAPI対応のHonoアプリを作成
const app = new OpenAPIHono()

// ミドルウェア設定
app.use('*', honoLogger())
app.use('*', timing())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

// CORS設定
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3005'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

// ヘルスチェックルート
const healthCheckSchema = z.object({
  message: z.string(),
  version: z.string(),
  status: z.string(),
  timestamp: z.string(),
})

const healthCheckRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'ヘルスチェック',
  description: 'APIサーバーの状態確認',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: healthCheckSchema,
        },
      },
      description: 'サーバー正常',
    },
  },
})

app.openapi(healthCheckRoute, c => {
  return c.json({
    message: 'Project Template API Server',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.3',
  info: {
    version: '0.1.0',
    title: 'Project Template API',
    description: 'A template API built with Hono and OpenAPI',
  },
  servers: [
    {
      url: `http://localhost:${Number(process.env['PORT']) || 8000}`,
      description: '開発環境',
    },
  ],
})

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

// サーバー起動
const port = Number(process.env['PORT']) || 8000
console.log(`🚀 Server is running on port ${port}`)
console.log(`📖 API Docs: http://localhost:${port}/api/docs`)
console.log(`🔍 OpenAPI Spec: http://localhost:${port}/api/openapi.json`)

log.info(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
