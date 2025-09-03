import { Context, Next } from 'hono'
import { trace } from '@opentelemetry/api'

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
        kind: 1, // SpanKind.SERVER
        attributes: {
          'http.method': c.req.method,
          'http.url': c.req.url,
          'http.route': c.req.path,
          'http.user_agent': c.req.header('user-agent') || '',
          'http.scheme': new URL(c.req.url).protocol.slice(0, -1),
        },
      },
      async span => {
        try {
          await next()

          // レスポンス情報を記録
          span.setAttributes({
            'http.status_code': c.res.status,
            'http.response.size': c.res.headers.get('content-length') || 0,
          })

          // ステータスコードに基づいてスパンのステータスを設定
          if (c.res.status >= 400) {
            span.recordException(new Error(`HTTP ${c.res.status}`))
            span.setStatus({
              code: 2, // SpanStatusCode.ERROR
              message: `HTTP ${c.res.status}`,
            })
          }
        } catch (error) {
          // エラー情報を記録
          span.recordException(
            error instanceof Error ? error : new Error(String(error))
          )
          span.setStatus({
            code: 2, // SpanStatusCode.ERROR
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
