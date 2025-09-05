import type { LocaleMessages } from '../types'

/**
 * English message definitions
 *
 * Note: All keys must match MESSAGE_KEYS exactly
 * Build-time validation will fail if there are inconsistencies
 */
export const enMessages: LocaleMessages = {
  // ========================================
  // Authentication (auth.*)
  // ========================================
  'auth.signin_required': 'User is not signed in. Authentication required.',
  'auth.signin_success': 'Successfully signed in.',
  'auth.user_ensured': 'User information synchronized successfully.',
  'auth.ensure_failed': 'Failed to synchronize user information.',

  // ========================================
  // Errors (error.*)
  // ========================================
  'error.user_not_found': 'User not found. Please sign in again.',
  'error.profile_retrieval_failed': 'Failed to retrieve profile information.',
  'error.profile_update_failed': 'Failed to update profile information.',
  'error.validation_failed': 'Validation error occurred.',
  'error.invalid_response_format': 'Invalid response format.',
  'error.unknown_error': 'An unexpected error occurred.',

  // ========================================
  // Success messages (success.*)
  // ========================================
  'success.profile_retrieved': 'Profile information retrieved successfully.',
  'success.profile_updated': 'Profile information updated successfully.',
  'success.user_ensured': 'User information synchronized successfully.',

  // ========================================
  // UI labels (ui.*)
  // ========================================
  'ui.profile_info': 'Profile Information',
  'ui.user_id': 'User ID',
  'ui.display_name': 'Display Name',
  'ui.email_address': 'Email Address',
  'ui.created_at': 'Created At',
  'ui.updated_at': 'Last Updated',
  'ui.auth_providers': 'Authentication Providers',
  'ui.avatar': 'Avatar',
  'ui.not_set': 'Not set',
  'ui.unknown': 'Unknown',
  'ui.dashboard': 'Dashboard',
  'ui.authenticated_user_page':
    'This is a page exclusive for authenticated users',
  'ui.loading': 'Loading...',
  'ui.executing': 'Executing...',
  'ui.last_execution': 'Last execution',

  // ========================================
  // Actions (action.*)
  // ========================================
  'action.auth_api_test': 'Authenticated API Test',
  'action.health_check_success': 'API Test Success',
  'action.response_data': 'Response Data',
  'action.error_occurred': 'An error occurred',
  'action.error_details': 'Error Details',

  // ========================================
  // Validation (validation.*)
  // ========================================
  'validation.field_required': '{{field}} is required.',
  'validation.invalid_email': '{{email}} is not a valid email address.',
  'validation.invalid_url': '{{url}} is not a valid URL.',
  'validation.string_too_short':
    '{{field}} must be at least {{minLength}} characters.',
  'validation.string_too_long':
    '{{field}} must be no more than {{maxLength}} characters.',
}
