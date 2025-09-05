import { z } from 'zod'

// 共通の型定義
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

// ページネーション
export interface PaginationParams {
  page?: number
  limit?: number
}

// NOTE: LegacyApiResponse と関連型は api/types.ts に移動されました

// Zodスキーマ例
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
})
