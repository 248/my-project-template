// Auto-generated Zod schemas from OpenAPI spec
// Generated at: 2025-09-05T06:18:54.334Z

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

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  email: z.string().email().nullable(),
  avatarUrl: z.string().nullable(),
  locale: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const UserUpdateDataSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  locale: z.enum(['ja', 'en']).optional(),
})

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  message: z.string().optional(),
  data: z.object({}).optional(),
})

export const UserResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  message: z.string().optional(),
  data: z.object({
    user: z.object({
      id: z.string(),
      displayName: z.string().nullable(),
      email: z.string().email().nullable(),
      avatarUrl: z.string().nullable(),
      locale: z.string().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
  }),
})

export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
})

// Export type definitions for enhanced type safety
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type DetailedHealthCheck = z.infer<typeof DetailedHealthCheckSchema>
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>
export type User = z.infer<typeof UserSchema>
export type UserUpdateData = z.infer<typeof UserUpdateDataSchema>
export type ApiResponse = z.infer<typeof ApiResponseSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
