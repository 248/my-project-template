/**
 * API設定ユーティリティ
 * 共通のAPI設定ロジックを提供
 */

/**
 * APIベースURLを取得
 * 環境変数が設定されていない場合はエラーを投げる
 */
export function getApiBaseUrl(): string {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL']

  if (!baseUrl) {
    throw new Error(
      '🚨 NEXT_PUBLIC_API_BASE_URL環境変数が設定されていません。' +
        '\n開発環境: http://localhost:8787' +
        '\n本番環境: https://your-workers-api.workers.dev' +
        '\n.env.localファイルまたはVercel環境変数で設定してください。'
    )
  }

  return baseUrl
}
