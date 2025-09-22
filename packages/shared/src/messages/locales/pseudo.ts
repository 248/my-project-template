import type { LocaleMessages } from '../types'

/**
 * 疑似ロケール（Pseudo-locale）メッセージ定義
 *
 * 目的:
 * - 外部化されていないハードコーディングメッセージの可視化
 * - E2Eテストでの取りこぼし検出
 * - 国際化対応の完全性確認
 *
 * 形式: [!! originalText !!] で囲み、視覚的に識別しやすくする
 */
export const pseudoMessages: LocaleMessages = {
  // ========================================
  // 認証関連 (auth.*)
  // ========================================
  'auth.signin_required':
    '[!! User is not signed in. Authentication required. !!]',
  'auth.signin_success': '[!! Successfully signed in. !!]',
  'auth.user_ensured': '[!! User information synchronized successfully. !!]',
  'auth.ensure_failed': '[!! Failed to synchronize user information. !!]',

  // ========================================
  // エラー関連 (error.*)
  // ========================================
  'error.user_not_found': '[!! User not found. Please sign in again. !!]',
  'error.profile_retrieval_failed':
    '[!! Failed to retrieve profile information. !!]',
  'error.profile_update_failed':
    '[!! Failed to update profile information. !!]',
  'error.validation_failed': '[!! Validation error occurred. !!]',
  'error.invalid_response_format': '[!! Invalid response format. !!]',
  'error.unknown_error': '[!! An unexpected error occurred. !!]',

  // ========================================
  // 成功メッセージ (success.*)
  // ========================================
  'success.profile_retrieved':
    '[!! Profile information retrieved successfully. !!]',
  'success.profile_updated':
    '[!! Profile information updated successfully. !!]',
  'success.user_ensured': '[!! User information synchronized successfully. !!]',

  // ========================================
  // UI表示関連 (ui.*)
  // ========================================
  'ui.profile_info': '[!! Profile Information !!]',
  'ui.user_id': '[!! User ID !!]',
  'ui.display_name': '[!! Display Name !!]',
  'ui.email_address': '[!! Email Address !!]',
  'ui.auth_provider_email': '[!! Email !!]',
  'ui.created_at': '[!! Created At !!]',
  'ui.updated_at': '[!! Last Updated !!]',
  'ui.auth_providers': '[!! Authentication Providers !!]',
  'ui.avatar': '[!! Avatar !!]',
  'ui.not_set': '[!! Not set !!]',
  'ui.unknown': '[!! Unknown !!]',
  'ui.language_label': '[!! Language !!]',
  'ui.ui_labels_test_title': '[!! UI Labels Test !!]',
  'ui.error_messages_test_title': '[!! Error Messages Test !!]',
  'ui.action_messages_test_title': '[!! Action Messages Test !!]',
  'ui.current_locale': '[!! Current Locale !!]',
  'ui.locale_storage_note':
    '[!! Stored in LocalStorage and used for all translations !!]',
  'ui.alt_user_avatar': '[!! User avatar !!]',
  'ui.http_status': '[!! HTTP Status !!]',
  'ui.details_dev': '[!! Details (dev) !!]',
  'ui.dashboard': '[!! Dashboard !!]',
  'ui.authenticated_user_page':
    '[!! This is a page exclusive for authenticated users !!]',
  'ui.loading': '[!! Loading... !!]',
  'ui.executing': '[!! Executing... !!]',
  'ui.last_execution': '[!! Last execution !!]',

  // ProjectInfo
  'ui.project_template_title': '[!! Project Template !!]',
  'ui.project_template_description':
    '[!! This project is a template for modern web application development. Build SaaS apps quickly with a full-stack TypeScript setup and built-in authentication. !!]',
  'ui.badge_fullstack': '[!! Fullstack !!]',
  'ui.badge_typescript': '[!! TypeScript !!]',
  'ui.badge_authentication_included': '[!! Auth included !!]',
  'ui.badge_production_ready': '[!! Production ready !!]',

  // TechStack
  'ui.tech_stack_title': '[!! Tech Stack !!]',
  'ui.tech_nextjs_desc': '[!! React framework !!]',
  'ui.tech_typescript_desc': '[!! Type-safe JavaScript !!]',
  'ui.tech_tailwind_desc': '[!! Utility-first CSS !!]',
  'ui.tech_hono_desc': '[!! Web API framework !!]',
  'ui.tech_clerk_desc': '[!! Authentication and user management !!]',
  'ui.tech_prisma_desc': '[!! Database ORM !!]',

  // QuickActions
  'ui.quick_actions_title': '[!! Quick Actions !!]',
  'ui.open_api_docs_desc': '[!! Check the backend API specifications !!]',
  'ui.open_github_desc': '[!! Browse the project repository !!]',
  'ui.view_docs_desc': '[!! View README and documentation !!]',
  'ui.template_info_desc': '[!! How to use this template !!]',
  'ui.template_info_modal':
    '[!! This project is a full-stack TypeScript template. !!]\n\n[!! Includes: !!]\n- [!! Next.js 15 (frontend) !!]\n- [!! Hono (backend API) !!]\n- [!! Clerk (authentication) !!]\n- [!! Prisma (database) !!]\n- [!! Tailwind CSS (styling) !!]',

  // Actions
  'action.open_api_docs': '[!! API Docs !!]',
  'action.open_github': '[!! GitHub Repository !!]',
  'action.view_docs': '[!! Project Docs !!]',
  'action.template_info': '[!! Template Info !!]',

  // Common
  'ui.app_title': '[!! Project Template !!]',
  'ui.authenticated_badge': '[!! Authenticated !!]',
  'ui.welcome_title': '[!! Welcome to Project Template !!]',
  'ui.welcome_stack_line':
    '[!! Next.js + Hono + TypeScript + Tailwind CSS + Clerk Auth !!]',
  'ui.badge_nextjs': '[!! Next.js !!]',
  'ui.badge_tailwind': '[!! Tailwind CSS !!]',
  'ui.badge_hono': '[!! Hono !!]',
  'ui.badge_clerk': '[!! Clerk !!]',
  'ui.sign_in_prompt': '[!! Sign in to access the application !!]',
  'ui.no_account_yet': "[!! Don't have an account yet? !!]",
  'action.sign_in': '[!! Sign In !!]',
  'action.sign_up': '[!! Sign Up !!]',
  'ui.system_health_check_title': '[!! System Health Check !!]',
  'ui.last_checked': '[!! Last Checked !!]',
  'ui.system_status': '[!! System Status !!]',
  'ui.uptime': '[!! Uptime !!]',
  'ui.service_status': '[!! Service Status !!]',
  'ui.system_metrics': '[!! System Metrics !!]',
  'ui.memory_usage': '[!! Memory Usage !!]',
  'ui.cpu_time': '[!! CPU Time !!]',
  'ui.cpu_user_label': '[!! User !!]',
  'ui.cpu_system_label': '[!! System !!]',
  'ui.version': '[!! Version !!]',
  'ui.environment': '[!! Environment !!]',
  'action.run_health_check': '[!! Run Health Check !!]',

  // ========================================
  // ボタン・アクション (action.*)
  // ========================================
  'action.auth_api_test': '[!! Authenticated API Test !!]',
  'action.health_check_success': '[!! API Test Success !!]',
  'action.response_data': '[!! Response Data !!]',
  'action.error_occurred': '[!! An error occurred !!]',
  'action.error_details': '[!! Error Details !!]',

  // ========================================
  // APIテスト (apitest.*)
  // ========================================
  'ui.apitest_panel_title': '[!! API Test !!]',
  'action.apitest_run_all_tests': '[!! Run All Tests !!]',
  'action.apitest_test_button': '[!! Test !!]',
  'ui.apitest_running_status': '[!! Running... !!]',
  'ui.apitest_success_status': '[!! Success !!]',
  'ui.apitest_error_status': '[!! Error !!]',
  'ui.apitest_response_details': '[!! Response Details !!]',
  'ui.apitest_root_health_name': '[!! Root Health Check !!]',
  'ui.apitest_root_health_description': '[!! Basic API server status check !!]',
  'ui.apitest_simple_health_name': '[!! Simple Health Check !!]',
  'ui.apitest_simple_health_description': '[!! Simple status check !!]',
  'ui.apitest_detailed_health_name': '[!! Detailed Health Check !!]',
  'ui.apitest_detailed_health_description':
    '[!! Detailed status check including DB and Redis connections !!]',
  'ui.apitest_ensure_user_name': '[!! Create/Update User !!]',
  'ui.apitest_ensure_user_description':
    '[!! Idempotent user creation and update !!]',
  'ui.apitest_get_profile_name': '[!! Get Profile !!]',
  'ui.apitest_get_profile_description':
    '[!! Retrieve current user information !!]',
  'ui.apitest_update_profile_name': '[!! Update Profile !!]',
  'ui.apitest_update_profile_description':
    '[!! Update user information (test data) !!]',
  'ui.apitest_test_user_prefix': '[!! Test User !!]',

  // ========================================
  // バリデーション (validation.*)
  // ========================================
  'validation.field_required': '[!! {{field}} is required. !!]',
  'validation.invalid_email': '[!! {{email}} is not a valid email address. !!]',
  'validation.invalid_url': '[!! {{url}} is not a valid URL. !!]',
  'validation.string_too_short':
    '[!! {{field}} must be at least {{minLength}} characters. !!]',
  'validation.string_too_long':
    '[!! {{field}} must be no more than {{maxLength}} characters. !!]',
}
