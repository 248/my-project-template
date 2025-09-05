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
  'ui.created_at': '作成日時',
  'ui.updated_at': '最終更新',
  'ui.auth_providers': '認証プロバイダー',
  'ui.avatar': 'アバター',
  'ui.not_set': '未設定',
  'ui.unknown': '不明',
  'ui.dashboard': 'ダッシュボード',
  'ui.authenticated_user_page': '認証済みユーザー専用のページです',
  'ui.loading': '読み込み中...',
  'ui.executing': '実行中...',
  'ui.last_execution': '最終実行',

  // ========================================
  // ボタン・アクション (action.*)
  // ========================================
  'action.auth_api_test': '認証付きAPIテスト',
  'action.health_check_success': 'APIテスト成功',
  'action.response_data': 'レスポンスデータ',
  'action.error_occurred': 'エラーが発生しました',
  'action.error_details': '詳細情報',

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
