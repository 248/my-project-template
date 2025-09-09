import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

import { resolveLoggerService } from '@/container/container'

// Note: DIコンテナが初期化される前に使用される可能性があるため、
// 遅延評価でLoggerServiceを取得
const getLogger = () => resolveLoggerService().child({ name: 'telemetry' })

// デバッグモード設定（開発時のトラブルシューティング用）
if (process.env['NODE_ENV'] !== 'production' && process.env['OTEL_DEBUG']) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
}

// サービス情報の定義
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: process.env['SERVICE_NAME'] || 'template-backend',
  [SEMRESATTRS_SERVICE_VERSION]: process.env['SERVICE_VERSION'] || '1.0.0',
  environment: process.env['NODE_ENV'] || 'development',
})

// OTLP エクスポーター設定
const otlpEndpoint =
  process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318'

// トレースエクスポーター
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: {},
})

// メトリクスエクスポーター
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {},
})

// SDK初期化
export const telemetrySDK = new NodeSDK({
  resource,
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // 10秒ごとにエクスポート
  }),
  instrumentations: [
    // 自動インストルメンテーション
    getNodeAutoInstrumentations({
      // 最適化のため一部の重いインストルメンテーションを無効化
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
    }),
    // Pinoロガーのインストルメンテーション
    new PinoInstrumentation({
      logHook: (_span, logRecord) => {
        // トレースIDをログに自動追加
        logRecord['trace_id'] = _span?.spanContext().traceId
        logRecord['span_id'] = _span?.spanContext().spanId
      },
    }),
  ],
})

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  telemetrySDK
    .shutdown()
    .then(() => console.log('Telemetry terminated'))
    .catch(error => getLogger().error('Error terminating telemetry', { error }))
    .finally(() => process.exit(0))
})
