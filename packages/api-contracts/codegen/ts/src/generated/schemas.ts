// Auto-generated Zod schemas from OpenAPI spec
// Generated at: 2025-09-03T07:05:08.787Z

import { z } from 'zod'

export const HealthCheckSchema = z.object({
  message: z.string(),
  version: z.string(),
  status: z.string(),
  timestamp: z.string().datetime(),
})

// Export type definitions for enhanced type safety
export type HealthCheck = z.infer<typeof HealthCheckSchema>
