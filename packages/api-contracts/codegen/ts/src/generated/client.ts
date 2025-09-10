// Auto-generated type-safe API client from OpenAPI spec
// Generated at: 2025-09-10T00:09:45.744Z

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
  async healthCheck(): Promise<any> {
    const response = await client.GET('/') as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return response.data
  },
  async getDetailedHealth(): Promise<any> {
    const response = await client.GET('/api/health') as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return response.data
  },
  async ensureUser(): Promise<any> {
    const response = await client.POST('/api/auth/users/ensure') as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return response.data
  },
  async getUserProfile(): Promise<any> {
    const response = await client.GET('/api/users/me') as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return response.data
  },
  async updateUserProfile(data: any): Promise<any> {
    const validatedData = data
    const response = await client.PUT('/api/users/me', {
      body: validatedData
    }) as any
    if (response.error) {
      throw new Error(`API Error: ${JSON.stringify(response.error)}`)
    }
    return response.data
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

export function isApiSuccess<T>(response: any): response is { success: true; data: T } {
  return response && response.success === true
}
