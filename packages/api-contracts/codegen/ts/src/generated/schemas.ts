// Auto-generated Zod schemas from OpenAPI spec
// Generated at: 2025-09-04T00:02:59.692Z

import { z } from 'zod'

export const HealthCheckSchema = z.object({
  message: z.string(),
  version: z.string(),
  status: z.string(),
  timestamp: z.string().datetime(),
})

export const DetailedHealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  services: z.object({
    api: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      message: z.string().optional(),
      responseTime: z.number().optional(),
    }),
    database: z
      .object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        message: z.string().optional(),
        responseTime: z.number().optional(),
      })
      .optional(),
    redis: z
      .object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        message: z.string().optional(),
        responseTime: z.number().optional(),
      })
      .optional(),
  }),
  system: z.object({
    memory: z.object({
      rss: z.number(),
      heapTotal: z.number(),
      heapUsed: z.number(),
    }),
    cpu: z.object({
      user: z.number(),
      system: z.number(),
    }),
  }),
  version: z.string(),
  environment: z.string(),
})

export const ServiceHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  responseTime: z.number().optional(),
})

// Export type definitions for enhanced type safety
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type DetailedHealthCheck = z.infer<typeof DetailedHealthCheckSchema>
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>
