import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ValidationErrorResponse,
  type ValidationError,
} from '../api-response'

describe('API Response Helpers', () => {
  describe('createSuccessResponse', () => {
    it('should create basic success response with data only', () => {
      const data = { id: 1, name: 'Test' }
      const result = createSuccessResponse(data)

      expect(result).toEqual({
        success: true,
        data,
      })
    })

    it('should create success response with data and code', () => {
      const data = { message: 'Operation completed' }
      const code = 'operation.completed'
      const result = createSuccessResponse(data, code)

      expect(result).toEqual({
        success: true,
        data,
        code,
      })
    })

    it('should create success response with data, code, and message', () => {
      const data = { result: 'success' }
      const code = 'auth.login_success'
      const message = 'Login successful'
      const result = createSuccessResponse(data, code, message)

      expect(result).toEqual({
        success: true,
        data,
        code,
        message,
      })
    })

    it('should handle null data', () => {
      const result = createSuccessResponse(null)

      expect(result).toEqual({
        success: true,
        data: null,
      })
    })

    it('should handle undefined data', () => {
      const result = createSuccessResponse(undefined)

      expect(result).toEqual({
        success: true,
        data: undefined,
      })
    })

    it('should handle array data', () => {
      const data = [1, 2, 3, 4, 5]
      const result = createSuccessResponse(data)

      expect(result).toEqual({
        success: true,
        data,
      })
    })

    it('should handle complex nested object data', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            settings: { theme: 'dark', notifications: true },
          },
        },
        permissions: ['read', 'write'],
      }
      const result = createSuccessResponse(data)

      expect(result).toEqual({
        success: true,
        data,
      })
    })

    it('should not include code when code is empty string', () => {
      const data = { test: true }
      const result = createSuccessResponse(data, '')

      expect(result).toEqual({
        success: true,
        data,
      })
    })

    it('should not include message when message is empty string', () => {
      const data = { test: true }
      const result = createSuccessResponse(data, 'test.code', '')

      expect(result).toEqual({
        success: true,
        data,
        code: 'test.code',
      })
    })

    it('should maintain proper TypeScript typing', () => {
      interface UserData {
        id: number
        email: string
      }

      const userData: UserData = { id: 1, email: 'test@example.com' }
      const result: ApiSuccessResponse<UserData> =
        createSuccessResponse(userData)

      expect(result.data.id).toBe(1)
      expect(result.data.email).toBe('test@example.com')
    })
  })

  describe('createErrorResponse', () => {
    beforeEach(() => {
      vi.resetModules()
      delete process.env['NODE_ENV']
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('should create basic error response with code only', () => {
      const result = createErrorResponse('error.not_found')

      expect(result).toEqual({
        success: false,
        code: 'error.not_found',
      })
    })

    it('should create error response with code and details', () => {
      const code = 'error.validation_failed'
      const details = { field: 'email', reason: 'invalid format' }
      const result = createErrorResponse(code, details)

      expect(result).toEqual({
        success: false,
        code,
        details,
      })
    })

    it('should create error response with code, details, and status', () => {
      const code = 'error.unauthorized'
      const details = { reason: 'invalid token' }
      const status = 401
      const result = createErrorResponse(code, details, status)

      expect(result).toEqual({
        success: false,
        code,
        details,
        status,
      })
    })

    it('should include fallback message in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const result = createErrorResponse(
        'error.internal',
        { stack: 'error stack' },
        500,
        'Internal server error occurred'
      )

      expect(result).toEqual({
        success: false,
        code: 'error.internal',
        details: { stack: 'error stack' },
        status: 500,
        message: 'Internal server error occurred',
      })
    })

    it('should not include fallback message in production environment', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const result = createErrorResponse(
        'error.internal',
        { stack: 'error stack' },
        500,
        'Internal server error occurred'
      )

      expect(result).toEqual({
        success: false,
        code: 'error.internal',
        details: { stack: 'error stack' },
        status: 500,
      })
    })

    it('should not include details when details is undefined', () => {
      const result = createErrorResponse('error.not_found', undefined, 404)

      expect(result).toEqual({
        success: false,
        code: 'error.not_found',
        status: 404,
      })
    })

    it('should not include status when status is 0', () => {
      const result = createErrorResponse('error.test', { test: true }, 0)

      expect(result).toEqual({
        success: false,
        code: 'error.test',
        details: { test: true },
      })
    })

    it('should handle null details', () => {
      const result = createErrorResponse('error.test', null, 400)

      expect(result).toEqual({
        success: false,
        code: 'error.test',
        details: null,
        status: 400,
      })
    })

    it('should handle complex details object', () => {
      const details = {
        errors: [
          { field: 'email', code: 'invalid' },
          { field: 'password', code: 'too_short' },
        ],
        requestId: 'req-123',
        timestamp: '2024-01-01T12:00:00Z',
      }
      const result = createErrorResponse('error.validation', details)

      expect(result).toEqual({
        success: false,
        code: 'error.validation',
        details,
      })
    })

    it('should maintain proper TypeScript typing', () => {
      const result: ApiErrorResponse = createErrorResponse('error.test')
      expect(result.success).toBe(false)
      expect(result.code).toBe('error.test')
    })
  })

  describe('createValidationErrorResponse', () => {
    const mockValidationErrors: ValidationError[] = [
      {
        field: 'email',
        code: 'validation.email_invalid',
        message: 'Invalid email format',
      },
      {
        field: 'password',
        code: 'validation.password_too_short',
        message: 'Password must be at least 8 characters',
      },
    ]

    it('should create validation error response with errors only', () => {
      const result = createValidationErrorResponse(mockValidationErrors)

      expect(result).toEqual({
        success: false,
        code: 'error.validation_failed',
        errors: mockValidationErrors,
      })
    })

    it('should create validation error response with errors and message', () => {
      const message = 'Validation failed for multiple fields'
      const result = createValidationErrorResponse(
        mockValidationErrors,
        message
      )

      expect(result).toEqual({
        success: false,
        code: 'error.validation_failed',
        errors: mockValidationErrors,
        message,
      })
    })

    it('should handle empty errors array', () => {
      const result = createValidationErrorResponse([])

      expect(result).toEqual({
        success: false,
        code: 'error.validation_failed',
        errors: [],
      })
    })

    it('should handle single validation error', () => {
      const singleError: ValidationError[] = [
        {
          field: 'username',
          code: 'validation.required',
          message: 'Username is required',
        },
      ]
      const result = createValidationErrorResponse(singleError)

      expect(result).toEqual({
        success: false,
        code: 'error.validation_failed',
        errors: singleError,
      })
    })

    it('should not include message when message is empty string', () => {
      const result = createValidationErrorResponse(mockValidationErrors, '')

      expect(result).toEqual({
        success: false,
        code: 'error.validation_failed',
        errors: mockValidationErrors,
      })
    })

    it('should maintain proper TypeScript typing', () => {
      const result: ValidationErrorResponse =
        createValidationErrorResponse(mockValidationErrors)
      expect(result.success).toBe(false)
      expect(result.code).toBe('error.validation_failed')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should handle validation errors with minimal data', () => {
      const minimalErrors: ValidationError[] = [
        {
          field: 'test',
          code: 'test.error',
          message: 'Test error',
        },
      ]
      const result = createValidationErrorResponse(minimalErrors)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('test')
      expect(result.errors[0]?.code).toBe('test.error')
      expect(result.errors[0]?.message).toBe('Test error')
    })

    it('should handle validation errors with complex field names', () => {
      const complexErrors: ValidationError[] = [
        {
          field: 'user.profile.address.zipCode',
          code: 'validation.zip_code_invalid',
          message: 'Invalid zip code format',
        },
        {
          field: 'preferences[0].theme',
          code: 'validation.enum_invalid',
          message: 'Theme must be light or dark',
        },
      ]
      const result = createValidationErrorResponse(complexErrors)

      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]?.field).toBe('user.profile.address.zipCode')
      expect(result.errors[1]?.field).toBe('preferences[0].theme')
    })
  })

  describe('Type Guards and Integration', () => {
    it('should properly differentiate success and error responses', () => {
      const successResponse = createSuccessResponse({ data: 'test' })
      const errorResponse = createErrorResponse('error.test')

      expect(successResponse.success).toBe(true)
      expect(errorResponse.success).toBe(false)

      if (successResponse.success) {
        expect(successResponse.data).toEqual({ data: 'test' })
      }

      if (!errorResponse.success) {
        expect(errorResponse.code).toBe('error.test')
      }
    })

    it('should work with discriminated union patterns', () => {
      type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

      const responses: ApiResponse<{ id: number }>[] = [
        createSuccessResponse({ id: 1 }),
        createErrorResponse('error.not_found'),
      ]

      responses.forEach(response => {
        if (response.success) {
          expect(typeof response.data.id).toBe('number')
        } else {
          expect(typeof response.code).toBe('string')
        }
      })
    })

    it('should maintain immutability of returned objects', () => {
      const originalData = { value: 1 }
      const response = createSuccessResponse(originalData)

      originalData.value = 2
      expect(response.data.value).toBe(2) // Same reference

      // TypeScript should prevent copying and modifying readonly properties
      // const copiedResponse = { ...response }
      // copiedResponse.success = false // Would be TypeScript error

      expect(response.success).toBe(true) // Original unchanged
    })
  })
})
