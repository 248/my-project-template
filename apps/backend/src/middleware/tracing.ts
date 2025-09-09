import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_URL_FULL,
  ATTR_HTTP_ROUTE,
  ATTR_USER_AGENT_ORIGINAL,
  ATTR_URL_SCHEME,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from '@opentelemetry/semantic-conventions'
import { Context, Next } from 'hono'

/**
 * OpenTelemetryトレースミドルウェア
 * 各リクエストに対して自動的にスパンを作成し、
 * HTTPメタデータを記録する
 */
export function tracingMiddleware() {
  return async (c: Context, next: Next) => {
    const tracer = trace.getTracer('hono-server')

    const spanName = `${c.req.method} ${c.req.path}`

    await tracer.startActiveSpan(
      spanName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          [ATTR_HTTP_REQUEST_METHOD]: c.req.method,
          [ATTR_URL_FULL]: c.req.url,
          [ATTR_HTTP_ROUTE]: c.req.path,
          [ATTR_USER_AGENT_ORIGINAL]: c.req.header('user-agent') || '',
          [ATTR_URL_SCHEME]: new URL(c.req.url).protocol.slice(0, -1),
        },
      },
      async span => {
        try {
          await next()

          // レスポンス情報を記録
          span.setAttributes({
            [ATTR_HTTP_RESPONSE_STATUS_CODE]: c.res.status,
            'http.response.size':
              Number(c.res.headers.get('content-length')) || 0,
          })

          // ステータスコードに基づいてスパンのステータスを設定
          if (c.res.status >= 400) {
            span.recordException(new Error(`HTTP ${c.res.status}`))
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${c.res.status}`,
            })
          }
        } catch (error) {
          // エラー情報を記録
          span.recordException(
            error instanceof Error ? error : new Error(String(error))
          )
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          })
          throw error
        } finally {
          span.end()
        }
      }
    )
  }
}
