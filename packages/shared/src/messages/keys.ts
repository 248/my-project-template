/**
 * Generated Message Keys - DO NOT EDIT MANUALLY
 *
 * Generated from: contracts/messages/registry.yaml
 * Version: 1.0.0
 * Generated at: 2025-09-06T04:53:32.348Z
 *
 * Run 'pnpm gen:messages' to regenerate this file
 */

export const MESSAGE_KEYS = {
  'auth.signin_required': 'auth.signin_required',
  'auth.signin_success': 'auth.signin_success',
  'auth.user_ensured': 'auth.user_ensured',
  'auth.ensure_failed': 'auth.ensure_failed',
  'error.user_not_found': 'error.user_not_found',
  'error.profile_retrieval_failed': 'error.profile_retrieval_failed',
  'error.profile_update_failed': 'error.profile_update_failed',
  'error.validation_failed': 'error.validation_failed',
  'error.invalid_response_format': 'error.invalid_response_format',
  'error.unknown_error': 'error.unknown_error',
  'success.profile_retrieved': 'success.profile_retrieved',
  'success.profile_updated': 'success.profile_updated',
  'success.user_ensured': 'success.user_ensured',
  'ui.profile_info': 'ui.profile_info',
  'ui.user_id': 'ui.user_id',
  'ui.display_name': 'ui.display_name',
  'ui.email_address': 'ui.email_address',
  'ui.created_at': 'ui.created_at',
  'ui.updated_at': 'ui.updated_at',
  'ui.auth_providers': 'ui.auth_providers',
  'ui.avatar': 'ui.avatar',
  'ui.not_set': 'ui.not_set',
  'ui.unknown': 'ui.unknown',
  'ui.dashboard': 'ui.dashboard',
  'ui.authenticated_user_page': 'ui.authenticated_user_page',
  'ui.loading': 'ui.loading',
  'ui.executing': 'ui.executing',
  'ui.last_execution': 'ui.last_execution',
  'action.auth_api_test': 'action.auth_api_test',
  'action.health_check_success': 'action.health_check_success',
  'action.response_data': 'action.response_data',
  'action.error_occurred': 'action.error_occurred',
  'action.error_details': 'action.error_details',
  'validation.field_required': 'validation.field_required',
  'validation.invalid_email': 'validation.invalid_email',
  'validation.invalid_url': 'validation.invalid_url',
  'validation.string_too_short': 'validation.string_too_short',
  'validation.string_too_long': 'validation.string_too_long',
} as const

/**
 * Message key union type (auto-generated)
 */
export type MessageKey = keyof typeof MESSAGE_KEYS

/**
 * Namespace-specific key types (auto-generated)
 */
export type AuthMessageKey = Extract<MessageKey, `auth.${string}`>
export type ErrorMessageKey = Extract<MessageKey, `error.${string}`>
export type SuccessMessageKey = Extract<MessageKey, `success.${string}`>
export type UiMessageKey = Extract<MessageKey, `ui.${string}`>
export type ActionMessageKey = Extract<MessageKey, `action.${string}`>
export type ValidationMessageKey = Extract<MessageKey, `validation.${string}`>

/**
 * All message keys as array (for validation)
 */
export const ALL_MESSAGE_KEYS = Object.keys(MESSAGE_KEYS) as MessageKey[]

/**
 * Namespace-specific key arrays
 */
export const AUTH_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('auth.')
) as AuthMessageKey[]
export const ERROR_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('error.')
) as ErrorMessageKey[]
export const SUCCESS_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('success.')
) as SuccessMessageKey[]
export const UI_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('ui.')
) as UiMessageKey[]
export const ACTION_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('action.')
) as ActionMessageKey[]
export const VALIDATION_KEYS = ALL_MESSAGE_KEYS.filter(
  k => k && k.startsWith('validation.')
) as ValidationMessageKey[]

/**
 * Message metadata (generated from registry)
 */
export interface MessageMetadata {
  key: MessageKey
  namespace: string
  category: string
  description: string
  templateParams: string[]
  since: string
  deprecated: boolean
  apiUsage: boolean
  uiUsage: boolean
}

export const MESSAGE_METADATA: Record<MessageKey, MessageMetadata> = {
  'auth.signin_required': {
    key: 'auth.signin_required',
    namespace: 'auth',
    category: 'error',
    description: 'User authentication required',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'auth.signin_success': {
    key: 'auth.signin_success',
    namespace: 'auth',
    category: 'success',
    description: 'User signed in successfully',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'auth.user_ensured': {
    key: 'auth.user_ensured',
    namespace: 'auth',
    category: 'success',
    description: 'User information synchronized',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: false,
  },
  'auth.ensure_failed': {
    key: 'auth.ensure_failed',
    namespace: 'auth',
    category: 'error',
    description: 'Failed to synchronize user information',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: false,
  },
  'error.user_not_found': {
    key: 'error.user_not_found',
    namespace: 'error',
    category: 'client_error',
    description: 'User record not found in database',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'error.profile_retrieval_failed': {
    key: 'error.profile_retrieval_failed',
    namespace: 'error',
    category: 'server_error',
    description: 'Failed to retrieve user profile',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'error.profile_update_failed': {
    key: 'error.profile_update_failed',
    namespace: 'error',
    category: 'server_error',
    description: 'Failed to update user profile',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'error.validation_failed': {
    key: 'error.validation_failed',
    namespace: 'error',
    category: 'client_error',
    description: 'Request validation failed',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'error.invalid_response_format': {
    key: 'error.invalid_response_format',
    namespace: 'error',
    category: 'server_error',
    description: 'Server returned invalid response format',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'error.unknown_error': {
    key: 'error.unknown_error',
    namespace: 'error',
    category: 'server_error',
    description: 'An unexpected error occurred',
    templateParams: ['details'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'success.profile_retrieved': {
    key: 'success.profile_retrieved',
    namespace: 'success',
    category: 'info',
    description: 'Profile information retrieved successfully',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: false,
  },
  'success.profile_updated': {
    key: 'success.profile_updated',
    namespace: 'success',
    category: 'info',
    description: 'Profile information updated successfully',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'success.user_ensured': {
    key: 'success.user_ensured',
    namespace: 'success',
    category: 'info',
    description: 'User information synchronized successfully',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: false,
  },
  'ui.profile_info': {
    key: 'ui.profile_info',
    namespace: 'ui',
    category: 'label',
    description: 'Profile information section title',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.user_id': {
    key: 'ui.user_id',
    namespace: 'ui',
    category: 'label',
    description: 'User ID field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.display_name': {
    key: 'ui.display_name',
    namespace: 'ui',
    category: 'label',
    description: 'Display name field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.email_address': {
    key: 'ui.email_address',
    namespace: 'ui',
    category: 'label',
    description: 'Email address field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.created_at': {
    key: 'ui.created_at',
    namespace: 'ui',
    category: 'label',
    description: 'Created date field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.updated_at': {
    key: 'ui.updated_at',
    namespace: 'ui',
    category: 'label',
    description: 'Updated date field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.auth_providers': {
    key: 'ui.auth_providers',
    namespace: 'ui',
    category: 'label',
    description: 'Authentication providers field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.avatar': {
    key: 'ui.avatar',
    namespace: 'ui',
    category: 'label',
    description: 'Avatar field label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.not_set': {
    key: 'ui.not_set',
    namespace: 'ui',
    category: 'status',
    description: 'Field value not set indicator',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.unknown': {
    key: 'ui.unknown',
    namespace: 'ui',
    category: 'status',
    description: 'Unknown value indicator',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.dashboard': {
    key: 'ui.dashboard',
    namespace: 'ui',
    category: 'label',
    description: 'Dashboard page title',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.authenticated_user_page': {
    key: 'ui.authenticated_user_page',
    namespace: 'ui',
    category: 'info',
    description: 'Page description for authenticated users only',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.loading': {
    key: 'ui.loading',
    namespace: 'ui',
    category: 'status',
    description: 'Loading state indicator',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.executing': {
    key: 'ui.executing',
    namespace: 'ui',
    category: 'status',
    description: 'Executing state indicator',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'ui.last_execution': {
    key: 'ui.last_execution',
    namespace: 'ui',
    category: 'label',
    description: 'Last execution time label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'action.auth_api_test': {
    key: 'action.auth_api_test',
    namespace: 'action',
    category: 'button',
    description: 'Authenticated API test button label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'action.health_check_success': {
    key: 'action.health_check_success',
    namespace: 'action',
    category: 'status',
    description: 'Health check success message',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'action.response_data': {
    key: 'action.response_data',
    namespace: 'action',
    category: 'label',
    description: 'Response data section label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'action.error_occurred': {
    key: 'action.error_occurred',
    namespace: 'action',
    category: 'error',
    description: 'Error occurred message',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'action.error_details': {
    key: 'action.error_details',
    namespace: 'action',
    category: 'label',
    description: 'Error details section label',
    templateParams: [],
    since: '1.0.0',
    deprecated: false,
    apiUsage: false,
    uiUsage: true,
  },
  'validation.field_required': {
    key: 'validation.field_required',
    namespace: 'validation',
    category: 'client_error',
    description: 'Required field validation error',
    templateParams: ['field'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'validation.invalid_email': {
    key: 'validation.invalid_email',
    namespace: 'validation',
    category: 'client_error',
    description: 'Invalid email format validation error',
    templateParams: ['email'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'validation.invalid_url': {
    key: 'validation.invalid_url',
    namespace: 'validation',
    category: 'client_error',
    description: 'Invalid URL format validation error',
    templateParams: ['url'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'validation.string_too_short': {
    key: 'validation.string_too_short',
    namespace: 'validation',
    category: 'client_error',
    description: 'String too short validation error',
    templateParams: ['field', 'minLength'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
  'validation.string_too_long': {
    key: 'validation.string_too_long',
    namespace: 'validation',
    category: 'client_error',
    description: 'String too long validation error',
    templateParams: ['field', 'maxLength'],
    since: '1.0.0',
    deprecated: false,
    apiUsage: true,
    uiUsage: true,
  },
}

/**
 * API-specific keys (for backend usage)
 */
export const API_MESSAGE_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].apiUsage
) as MessageKey[]

/**
 * UI-specific keys (for frontend usage)
 */
export const UI_MESSAGE_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].uiUsage
) as MessageKey[]

/**
 * Keys with template parameters
 */
export const TEMPLATED_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].templateParams.length > 0
) as MessageKey[]

/**
 * Deprecated keys (for migration warnings)
 */
export const DEPRECATED_KEYS = ALL_MESSAGE_KEYS.filter(
  key => MESSAGE_METADATA[key].deprecated
) as MessageKey[]
