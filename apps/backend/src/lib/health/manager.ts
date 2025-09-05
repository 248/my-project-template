import type { DetailedHealthCheck } from '@template/api-contracts-ts'
import type {
  HealthCheckService,
  HealthCheckContext,
  HealthCheckConfig,
  HealthCheckResult,
} from './types'

/**
 * ヘルスチェックマネージャー
 * 複数のヘルスチェックサービスを管理し、結果を統合する
 */
export class HealthCheckManager {
  private services: Map<string, HealthCheckService> = new Map()
  private startTime = Date.now()

  constructor(
    private config: HealthCheckConfig,
    private logger: (message: string, error?: unknown) => void,
    private cache?: {
      get: (key: string) => Promise<unknown>
      set: (key: string, value: unknown, ttl: number) => Promise<void>
    }
  ) {}

  /**
   * ヘルスチェックサービスを登録
   */
  registerService(service: HealthCheckService): void {
    this.services.set(service.name, service)
  }

  /**
   * 複数のヘルスチェックサービスを登録
   */
  registerServices(services: HealthCheckService[]): void {
    services.forEach(service => this.registerService(service))
  }

  /**
   * 全てのヘルスチェックを実行
   */
  async checkHealth(): Promise<DetailedHealthCheck> {
    const context = this.createContext()
    const startTime = performance.now()

    try {
      // 全サービスの健全性チェックを並列実行
      const serviceChecks = await this.executeServiceChecks(context)

      // 結果を統合
      const result = this.aggregateResults(serviceChecks)

      // システムメトリクス取得
      const systemMetrics = this.config.exposeSystemMetrics
        ? this.getSystemMetrics()
        : {
            memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
            cpu: { user: 0, system: 0 },
          }

      const response: DetailedHealthCheck = {
        status: result.overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        services: {
          api: result.services['api'] || {
            status: 'healthy' as const,
            message: 'API service is running',
            responseTime: 0,
          },
          database: result.services['database'] || undefined,
          redis: result.services['redis'] || undefined,
        },
        system: systemMetrics,
        version: process.env['npm_package_version'] || '0.1.0',
        environment: this.config.environment,
      }

      const checkDuration =
        Math.round((performance.now() - startTime) * 100) / 100
      this.logger(
        `Health check completed in ${checkDuration}ms - status: ${result.overallStatus}`
      )

      return response
    } catch (error) {
      this.logger('Health check execution failed', error)

      // eslint-disable-next-line @template/message-keys/require-message-key
      return this.createErrorResponse(error)
    }
  }

  /**
   * ServiceHealth型のタイプガード
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  private isServiceHealth(
    value: unknown
  ): value is import('@template/api-contracts-ts').ServiceHealth {
    if (value === null || typeof value !== 'object') {
      return false
    }

    if (!('status' in value)) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const statusValue = (value as Record<string, unknown>)['status']
    if (typeof statusValue !== 'string') {
      return false
    }

    return ['healthy', 'degraded', 'unhealthy'].includes(statusValue)
  }

  /**
   * コンテキストを作成
   */
  private createContext(): HealthCheckContext {
    return {
      config: this.config,
      logger: this.logger,
      getCache: this.cache?.get
        ? async (key: string) => {
            const result = await this.cache!.get(key)
            // キャッシュから取得した値がServiceHealth形式か確認
            if (this.isServiceHealth(result)) {
              return result
            }
            return null
          }
        : undefined,
      setCache: this.cache?.set
        ? async (
            key: string,
            value: import('@template/api-contracts-ts').ServiceHealth,
            ttl: number
          ) => {
            return this.cache!.set(key, value, ttl)
          }
        : undefined,
    }
  }

  /**
   * サービスチェックを並列実行
   */
  private async executeServiceChecks(
    context: HealthCheckContext
  ): Promise<HealthCheckResult> {
    const serviceEntries = Array.from(this.services.entries())
    const errors: string[] = []

    // タイムアウト設定付きでサービスチェックを実行
    const servicePromises = serviceEntries.map(async ([name, service]) => {
      try {
        const checkPromise = service.check(context)
        const timeoutPromise = this.createTimeoutPromise(
          name,
          this.config.timeout
        )

        const result = await Promise.race([checkPromise, timeoutPromise])
        return [name, result] as const
      } catch (error) {
        const errorMessage = `Service ${name} check failed: ${
          error instanceof Error ? error.message : String(error)
        }`
        errors.push(errorMessage)
        this.logger(errorMessage, error)

        return [
          name,
          {
            status: 'unhealthy' as const,
            message: errorMessage,
          },
        ] as const
      }
    })

    const serviceResults = await Promise.all(servicePromises)
    // ServiceHealth型を明示的に定義
    type ServiceResult = {
      status: 'healthy' | 'degraded' | 'unhealthy'
      message?: string
      responseTime?: number
    }
    const services: Record<string, ServiceResult> = {}

    for (const [name, result] of serviceResults) {
      services[name] = result
    }

    // 全体のステータスを決定
    const overallStatus = this.determineOverallStatus(services)

    return {
      overallStatus,
      services,
      errors,
    }
  }

  /**
   * タイムアウト用のPromiseを作成
   */
  private createTimeoutPromise(
    serviceName: string,
    timeout: number
  ): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Health check for ${serviceName} timed out after ${timeout}ms`
          )
        )
      }, timeout)
    })
  }

  /**
   * サービス結果から全体のステータスを決定
   */
  private determineOverallStatus(
    services: Record<
      string,
      {
        status: 'healthy' | 'degraded' | 'unhealthy'
        message?: string
        responseTime?: number
      }
    >
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const serviceEntries = Object.entries(services)
    const requiredServices = Array.from(this.services.values()).filter(
      s => s.required !== false
    )

    // 必須サービスが1つでも unhealthy なら全体も unhealthy
    for (const requiredService of requiredServices) {
      const result = services[requiredService.name]
      if (result && 'status' in result && result.status === 'unhealthy') {
        return 'unhealthy'
      }
    }

    // いずれかのサービスが degraded なら全体も degraded
    for (const [, result] of serviceEntries) {
      if (result && 'status' in result && result.status === 'degraded') {
        return 'degraded'
      }
    }

    // 全て healthy または一部のオプショナルサービスが unhealthy
    return 'healthy'
  }

  /**
   * 結果を統合
   */
  private aggregateResults(result: HealthCheckResult): HealthCheckResult {
    return result
  }

  /**
   * システムメトリクスを取得
   */
  private getSystemMetrics() {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      memory: {
        rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
    }
  }

  /**
   * エラー時のレスポンスを作成
   */
  private createErrorResponse(error: unknown): DetailedHealthCheck {
    const errorMessage =
      error instanceof Error ? error.message : 'Health check system error'

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        api: {
          status: 'unhealthy',
          message: `Health check system error: ${errorMessage}`,
        },
      },
      system: {
        memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
        cpu: { user: 0, system: 0 },
      },
      version: process.env['npm_package_version'] || '0.1.0',
      environment: this.config.environment,
    }
  }
}
