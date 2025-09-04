// OpenTelemetryを最初に初期化（他のimportより前に実行）
import { telemetrySDK } from '@/utils/telemetry'

import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { createLogger } from '@/utils/logger'
import { tracingMiddleware } from '@/middleware/tracing'
// API契約パッケージからOpenAPI生成型を使用
import { HealthCheckSchema } from '@template/api-contracts-ts'
import { healthApp } from '@/routes/health'

// ロガー設定
const log = createLogger('server')

// OpenAPI対応のHonoアプリを作成
const app = new OpenAPIHono()

// ミドルウェア設定
app.use('*', tracingMiddleware()) // OpenTelemetryトレーシング
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

// 共有されたヘルスチェックスキーマを使用

const healthCheckRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'ヘルスチェック',
  description: 'APIサーバーの状態確認',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthCheckSchema,
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

// ヘルスチェックルートをマウント
app.route('/', healthApp)

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

// OpenTelemetryを開始
telemetrySDK.start()
log.info('📊 OpenTelemetry telemetry started')

// サーバー起動
const port = Number(process.env['PORT']) || 8000
log.info(`🚀 Server is running on port ${port}`)
log.info(`📖 API Docs: http://localhost:${port}/api/docs`)
log.info(`🔍 OpenAPI Spec: http://localhost:${port}/api/openapi.json`)

log.info(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
