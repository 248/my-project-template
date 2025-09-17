import type { LocaleMessages } from '../types'

/**
 * 日本語メッセージ定義
 *
 * 注意: 全てのキーが MESSAGE_KEYS と一致している必要があります
 * ビルド時チェックで不整合がある場合はエラーになります
 */
export const jaMessages: LocaleMessages = {
  // ========================================
  // 認証関連 (auth.*)
  // ========================================
  'auth.signin_required': 'ユーザーがサインインしていません。認証が必要です。',
  'auth.signin_success': 'サインインが完了しました。',
  'auth.user_ensured': 'ユーザー情報を正常に同期しました。',
  'auth.ensure_failed': 'ユーザー情報の同期に失敗しました。',

  // ========================================
  // エラー関連 (error.*)
  // ========================================
  'error.user_not_found':
    'ユーザーが見つかりません。再度サインインしてください。',
  'error.profile_retrieval_failed': 'プロフィール情報の取得に失敗しました。',
  'error.profile_update_failed': 'プロフィール情報の更新に失敗しました。',
  'error.validation_failed': 'バリデーションエラーが発生しました。',
  'error.invalid_response_format': '無効なレスポンス形式です。',
  'error.unknown_error': '予期しないエラーが発生しました。',

  // ========================================
  // 成功メッセージ (success.*)
  // ========================================
  'success.profile_retrieved': 'プロフィール情報を取得しました。',
  'success.profile_updated': 'プロフィール情報を更新しました。',
  'success.user_ensured': 'ユーザー情報を同期しました。',

  // ========================================
  // UI表示関連 (ui.*)
  // ========================================
  'ui.profile_info': 'プロフィール情報',
  'ui.user_id': 'ユーザーID',
  'ui.display_name': '表示名',
  'ui.email_address': 'メールアドレス',
  'ui.auth_provider_email': 'Email',
  'ui.created_at': '作成日時',
  'ui.updated_at': '最終更新',
  'ui.auth_providers': '認証プロバイダー',
  'ui.avatar': 'アバター',
  'ui.not_set': '未設定',
  'ui.unknown': '不明',
  'ui.language_label': '言語',
  'ui.ui_labels_test_title': 'UIラベルのテスト',
  'ui.error_messages_test_title': 'エラーメッセージのテスト',
  'ui.action_messages_test_title': 'アクションメッセージのテスト',
  'ui.current_locale': '現在のロケール',
  'ui.locale_storage_note': 'ローカルストレージに保存され、翻訳に使用されます',
  'ui.alt_user_avatar': 'ユーザーのアバター',
  'ui.http_status': 'HTTPステータス',
  'ui.details_dev': '詳細（開発）',
  'ui.dashboard': 'ダッシュボード',
  'ui.authenticated_user_page': '認証済みユーザー専用のページです',
  'ui.loading': '読み込み中...',
  'ui.executing': '実行中...',
  'ui.last_execution': '最終実行',

  // ProjectInfo
  'ui.project_template_title': 'プロジェクトテンプレート',
  'ui.project_template_description':
    'このプロジェクトは、モダンな Web アプリケーション開発のためのテンプレートです。フルスタック TypeScript 環境で、認証機能付きの SaaS アプリケーションを素早く構築できます。',
  'ui.badge_fullstack': 'フルスタック',
  'ui.badge_typescript': 'TypeScript',
  'ui.badge_authentication_included': '認証機能付き',
  'ui.badge_production_ready': '本番対応',

  // TechStack
  'ui.tech_stack_title': '技術スタック',
  'ui.tech_nextjs_desc': 'React フレームワーク',
  'ui.tech_typescript_desc': '型安全な JavaScript',
  'ui.tech_tailwind_desc': 'ユーティリティファースト CSS',
  'ui.tech_hono_desc': 'Web API フレームワーク',
  'ui.tech_clerk_desc': '認証・ユーザー管理',
  'ui.tech_prisma_desc': 'データベース ORM',

  // QuickActions
  'ui.quick_actions_title': 'クイックアクション',
  'ui.open_api_docs_desc': 'バックエンド API の仕様を確認',
  'ui.open_github_desc': 'プロジェクトのソースコードを確認',
  'ui.view_docs_desc': 'README とドキュメントを確認',
  'ui.template_info_desc': 'このテンプレートの使い方',
  'ui.template_info_modal':
    'このプロジェクトはフルスタックTypeScriptテンプレートです。\n\n含まれる技術:\n- Next.js 15 (フロントエンド)\n- Hono (バックエンドAPI)\n- Clerk (認証)\n- Prisma (データベース)\n- Tailwind CSS (スタイリング)',

  // Actions
  'action.open_api_docs': 'API ドキュメント',
  'action.open_github': 'GitHub リポジトリ',
  'action.view_docs': 'プロジェクト構成',
  'action.template_info': 'テンプレート情報',

  // Common
  'ui.app_title': 'Project Template',
  'ui.authenticated_badge': '認証済み',
  'ui.welcome_title': 'プロジェクトテンプレートへようこそ',
  'ui.welcome_stack_line':
    'Next.js + Hono + TypeScript + Tailwind CSS + Clerk認証',
  'ui.badge_nextjs': 'Next.js',
  'ui.badge_tailwind': 'Tailwind CSS',
  'ui.badge_hono': 'Hono',
  'ui.badge_clerk': 'Clerk',
  'ui.sign_in_prompt': 'サインインしてアプリケーションにアクセス',
  'ui.no_account_yet': 'まだアカウントをお持ちでない場合は',
  'action.sign_in': 'サインイン',
  'action.sign_up': 'サインアップ',
  'ui.system_health_check_title': 'システムヘルスチェック',
  'ui.last_checked': '最終確認',
  'ui.system_status': 'システムステータス',
  'ui.uptime': '稼働時間',
  'ui.service_status': 'サービス状態',
  'ui.system_metrics': 'システムメトリクス',
  'ui.memory_usage': 'メモリ使用量',
  'ui.cpu_time': 'CPU時間',
  'ui.cpu_user_label': 'User',
  'ui.cpu_system_label': 'System',
  'ui.version': 'バージョン',
  'ui.environment': '環境',
  'action.run_health_check': 'ヘルスチェック実行',

  // ========================================
  // ボタン・アクション (action.*)
  // ========================================
  'action.auth_api_test': '認証付きAPIテスト',
  'action.health_check_success': 'APIテスト成功',
  'action.response_data': 'レスポンスデータ',
  'action.error_occurred': 'エラーが発生しました',
  'action.error_details': '詳細情報',

  // ========================================
  // APIテスト (apitest.*)
  // ========================================
  'ui.apitest_panel_title': 'API テスト',
  'action.apitest_run_all_tests': '全テスト実行',
  'action.apitest_test_button': 'テスト',
  'ui.apitest_running_status': '実行中...',
  'ui.apitest_success_status': '成功',
  'ui.apitest_error_status': 'エラー',
  'ui.apitest_response_details': 'レスポンス詳細',
  'ui.apitest_root_health_name': 'ルートヘルスチェック',
  'ui.apitest_root_health_description': '基本的なAPIサーバー状態確認',
  'ui.apitest_simple_health_name': 'シンプルヘルスチェック',
  'ui.apitest_simple_health_description': 'シンプルな状態確認',
  'ui.apitest_detailed_health_name': '詳細ヘルスチェック',
  'ui.apitest_detailed_health_description': 'DB・Redis接続を含む詳細な状態確認',
  'ui.apitest_ensure_user_name': 'ユーザー作成/更新',
  'ui.apitest_ensure_user_description': 'ユーザーの冪等作成・更新',
  'ui.apitest_get_profile_name': 'プロフィール取得',
  'ui.apitest_get_profile_description': '現在のユーザー情報を取得',
  'ui.apitest_update_profile_name': 'プロフィール更新',
  'ui.apitest_update_profile_description': 'ユーザー情報を更新（テストデータ）',
  'ui.apitest_test_user_prefix': 'テストユーザー',

  // ========================================
  // バリデーション (validation.*)
  // ========================================
  'validation.field_required': '{{field}}は必須項目です。',
  'validation.invalid_email': '{{email}}は有効なメールアドレスではありません。',
  'validation.invalid_url': '{{url}}は有効なURLではありません。',
  'validation.string_too_short':
    '{{field}}は{{minLength}}文字以上で入力してください。',
  'validation.string_too_long':
    '{{field}}は{{maxLength}}文字以内で入力してください。',
}
