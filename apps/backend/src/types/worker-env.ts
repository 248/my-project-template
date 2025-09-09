// Cloudflare Workers環境変数の型定義

export interface WorkerEnv {
  // DB設定
  DATABASE_URL: string
  DB_DRIVER: string
  
  // Redis設定
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  
  // 認証設定
  CLERK_SECRET_KEY: string
  CLERK_JWT_ISSUER: string
  
  // 環境識別
  NODE_ENV: string
  ENV_NAME: string
}