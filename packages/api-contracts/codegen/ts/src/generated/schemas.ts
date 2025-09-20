// Auto-generated Zod schemas from OpenAPI spec
// NOTE: Deterministic output — no timestamps for stable diffs

import { z } from 'zod'

export const HealthCheckSchema = z.object({
  message: z.string(),
  version: z.string(),
  status: z.string(),
  timestamp: z.string().datetime()
})

export const DetailedHealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  services: z.object({
  api: z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  responseTime: z.number().optional()
}),
  database: z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  responseTime: z.number().optional()
}).optional(),
  redis: z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  responseTime: z.number().optional()
}).optional()
}),
  system: z.object({
  memory: z.object({
  rss: z.number(),
  heapTotal: z.number(),
  heapUsed: z.number()
}),
  cpu: z.object({
  user: z.number(),
  system: z.number()
})
}),
  version: z.string(),
  environment: z.string()
})

export const ServiceHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  responseTime: z.number().optional()
})

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  email: z.string().email().nullable(),
  avatarUrl: z.string().nullable(),
  locale: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const UserUpdateDataSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  locale: z.enum(['ja', 'en']).optional()
})

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  code: z.enum(['auth.signin_required', 'auth.signin_success', 'auth.user_ensured', 'auth.ensure_failed', 'error.user_not_found', 'error.profile_retrieval_failed', 'error.profile_update_failed', 'error.validation_failed', 'error.invalid_response_format', 'error.unknown_error', 'success.profile_retrieved', 'success.profile_updated', 'success.user_ensured', 'ui.profile_info', 'ui.user_id', 'ui.display_name', 'ui.email_address', 'ui.created_at', 'ui.updated_at', 'ui.auth_providers', 'ui.avatar', 'ui.not_set', 'ui.unknown', 'ui.welcome_title', 'ui.welcome_stack_line', 'ui.badge_nextjs', 'ui.badge_tailwind', 'ui.badge_hono', 'ui.badge_clerk', 'ui.sign_in_prompt', 'ui.no_account_yet', 'ui.auth_provider_email', 'ui.language_label', 'ui.ui_labels_test_title', 'ui.error_messages_test_title', 'ui.action_messages_test_title', 'ui.current_locale', 'ui.locale_storage_note', 'ui.alt_user_avatar', 'ui.http_status', 'ui.details_dev', 'ui.dashboard', 'ui.authenticated_user_page', 'ui.loading', 'ui.executing', 'ui.last_execution', 'ui.project_template_title', 'ui.project_template_description', 'ui.badge_fullstack', 'ui.badge_typescript', 'ui.badge_authentication_included', 'ui.badge_production_ready', 'ui.tech_stack_title', 'ui.tech_nextjs_desc', 'ui.tech_typescript_desc', 'ui.tech_tailwind_desc', 'ui.tech_hono_desc', 'ui.tech_clerk_desc', 'ui.tech_prisma_desc', 'ui.quick_actions_title', 'ui.open_api_docs_desc', 'ui.open_github_desc', 'ui.view_docs_desc', 'ui.template_info_desc', 'ui.template_info_modal', 'ui.app_title', 'ui.authenticated_badge', 'ui.system_health_check_title', 'ui.last_checked', 'ui.system_status', 'ui.uptime', 'ui.service_status', 'ui.system_metrics', 'ui.memory_usage', 'ui.cpu_time', 'ui.version', 'ui.environment', 'ui.cpu_user_label', 'ui.cpu_system_label', 'ui.apitest_panel_title', 'ui.apitest_running_status', 'ui.apitest_success_status', 'ui.apitest_error_status', 'ui.apitest_response_details', 'ui.apitest_root_health_name', 'ui.apitest_root_health_description', 'ui.apitest_simple_health_name', 'ui.apitest_simple_health_description', 'ui.apitest_detailed_health_name', 'ui.apitest_detailed_health_description', 'ui.apitest_ensure_user_name', 'ui.apitest_ensure_user_description', 'ui.apitest_get_profile_name', 'ui.apitest_get_profile_description', 'ui.apitest_update_profile_name', 'ui.apitest_update_profile_description', 'ui.apitest_test_user_prefix', 'action.auth_api_test', 'action.health_check_success', 'action.response_data', 'action.error_occurred', 'action.error_details', 'action.sign_in', 'action.sign_up', 'action.open_api_docs', 'action.open_github', 'action.view_docs', 'action.template_info', 'action.apitest_run_all_tests', 'action.apitest_test_button', 'action.run_health_check', 'validation.field_required', 'validation.invalid_email', 'validation.invalid_url', 'validation.string_too_short', 'validation.string_too_long']),
  message: z.string().nullable(),
  data: z.object({}).nullable()
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
  updatedAt: z.string().datetime()
})
})
})

export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  code: z.enum(['auth.signin_required', 'auth.signin_success', 'auth.user_ensured', 'auth.ensure_failed', 'error.user_not_found', 'error.profile_retrieval_failed', 'error.profile_update_failed', 'error.validation_failed', 'error.invalid_response_format', 'error.unknown_error', 'validation.field_required', 'validation.invalid_email', 'validation.invalid_url', 'validation.string_too_short', 'validation.string_too_long']),
  details: z.object({}).nullable()
})

export const ApiErrorSchema = z.unknown()

export const ApiSuccessSchema = z.unknown()

export const ValidationErrorDetailSchema = z.object({
  field: z.string(),
  code: z.enum(['validation.field_required', 'validation.invalid_email', 'validation.invalid_url', 'validation.string_too_short', 'validation.string_too_long']),
  message: z.string()
})

export const ValidationErrorSchema = z.unknown()

export const MessageCodeSchema = z.enum(['auth.signin_required', 'auth.signin_success', 'auth.user_ensured', 'auth.ensure_failed', 'error.user_not_found', 'error.profile_retrieval_failed', 'error.profile_update_failed', 'error.validation_failed', 'error.invalid_response_format', 'error.unknown_error', 'success.profile_retrieved', 'success.profile_updated', 'success.user_ensured', 'ui.profile_info', 'ui.user_id', 'ui.display_name', 'ui.email_address', 'ui.created_at', 'ui.updated_at', 'ui.auth_providers', 'ui.avatar', 'ui.not_set', 'ui.unknown', 'ui.welcome_title', 'ui.welcome_stack_line', 'ui.badge_nextjs', 'ui.badge_tailwind', 'ui.badge_hono', 'ui.badge_clerk', 'ui.sign_in_prompt', 'ui.no_account_yet', 'ui.auth_provider_email', 'ui.language_label', 'ui.ui_labels_test_title', 'ui.error_messages_test_title', 'ui.action_messages_test_title', 'ui.current_locale', 'ui.locale_storage_note', 'ui.alt_user_avatar', 'ui.http_status', 'ui.details_dev', 'ui.dashboard', 'ui.authenticated_user_page', 'ui.loading', 'ui.executing', 'ui.last_execution', 'ui.project_template_title', 'ui.project_template_description', 'ui.badge_fullstack', 'ui.badge_typescript', 'ui.badge_authentication_included', 'ui.badge_production_ready', 'ui.tech_stack_title', 'ui.tech_nextjs_desc', 'ui.tech_typescript_desc', 'ui.tech_tailwind_desc', 'ui.tech_hono_desc', 'ui.tech_clerk_desc', 'ui.tech_prisma_desc', 'ui.quick_actions_title', 'ui.open_api_docs_desc', 'ui.open_github_desc', 'ui.view_docs_desc', 'ui.template_info_desc', 'ui.template_info_modal', 'ui.app_title', 'ui.authenticated_badge', 'ui.system_health_check_title', 'ui.last_checked', 'ui.system_status', 'ui.uptime', 'ui.service_status', 'ui.system_metrics', 'ui.memory_usage', 'ui.cpu_time', 'ui.version', 'ui.environment', 'ui.cpu_user_label', 'ui.cpu_system_label', 'ui.apitest_panel_title', 'ui.apitest_running_status', 'ui.apitest_success_status', 'ui.apitest_error_status', 'ui.apitest_response_details', 'ui.apitest_root_health_name', 'ui.apitest_root_health_description', 'ui.apitest_simple_health_name', 'ui.apitest_simple_health_description', 'ui.apitest_detailed_health_name', 'ui.apitest_detailed_health_description', 'ui.apitest_ensure_user_name', 'ui.apitest_ensure_user_description', 'ui.apitest_get_profile_name', 'ui.apitest_get_profile_description', 'ui.apitest_update_profile_name', 'ui.apitest_update_profile_description', 'ui.apitest_test_user_prefix', 'action.auth_api_test', 'action.health_check_success', 'action.response_data', 'action.error_occurred', 'action.error_details', 'action.sign_in', 'action.sign_up', 'action.open_api_docs', 'action.open_github', 'action.view_docs', 'action.template_info', 'action.apitest_run_all_tests', 'action.apitest_test_button', 'action.run_health_check', 'validation.field_required', 'validation.invalid_email', 'validation.invalid_url', 'validation.string_too_short', 'validation.string_too_long'])

// Export type definitions for enhanced type safety
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type DetailedHealthCheck = z.infer<typeof DetailedHealthCheckSchema>
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>
export type User = z.infer<typeof UserSchema>
export type UserUpdateData = z.infer<typeof UserUpdateDataSchema>
export type ApiResponse = z.infer<typeof ApiResponseSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>
export type ValidationErrorDetail = z.infer<typeof ValidationErrorDetailSchema>
export type ValidationError = z.infer<typeof ValidationErrorSchema>
export type MessageCode = z.infer<typeof MessageCodeSchema>
