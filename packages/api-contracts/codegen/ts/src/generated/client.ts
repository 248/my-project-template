// Auto-generated type-safe API client from OpenAPI spec
// Generated at: 2025-09-03T07:05:08.788Z

import createClient from 'openapi-fetch'
import type { paths } from './types'
import * as schemas from './schemas'
import { z } from 'zod'

// Create the base client
export const client = createClient<paths>({
  baseUrl: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000',
})

// Enhanced API client with validation and error handling
export const api = {
  async healthCheck(): Promise<schemas.HealthCheck> {
    const response = (await client.GET('/')) as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return schemas.HealthCheckSchema.parse(response.data)
  },
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

export function isApiSuccess<T>(
  response: any
): response is { success: true; data: T } {
  return response && response.success === true
}
