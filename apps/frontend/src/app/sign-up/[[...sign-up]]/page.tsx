'use client'

import { SignUp } from '@clerk/nextjs'

// プレビュー環境でのCSP問題対応：静的最適化を防ぐ
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignUp />
      </div>
    </div>
  )
}
