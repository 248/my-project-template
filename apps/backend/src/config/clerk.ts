import { z } from 'zod'

// Clerk JWT認証設定のスキーマ定義
const clerkConfigSchema = z.object({
  // JWT発行者（Clerkドメイン）
  issuer: z.string().url('CLERK_JWT_ISSUER must be a valid URL'),

  // JWT受信者（API識別子）- optionalで設定
  audience: z.string().min(1, 'CLERK_JWT_AUD must not be empty').optional(),

  // JWKSエンドポイントURL（自動生成される）
  jwksUrl: z.string().url().optional(),
})

export type ClerkConfig = z.infer<typeof clerkConfigSchema>

/**
 * Clerk認証設定を作成
 * @returns バリデート済みのClerk設定
 */
export function createClerkConfig(): ClerkConfig {
  const issuer = process.env['CLERK_JWT_ISSUER']
  const audience = process.env['CLERK_JWT_AUD']

  if (!issuer) {
    throw new Error('CLERK_JWT_ISSUER environment variable is required')
  }

  const rawConfig = {
    issuer,
    ...(audience && { audience }),
    jwksUrl: `${issuer}/.well-known/jwks.json`,
  }

  const result = clerkConfigSchema.safeParse(rawConfig)

  if (!result.success) {
    throw new Error(`Invalid Clerk configuration: ${result.error.message}`)
  }

  return result.data
}
