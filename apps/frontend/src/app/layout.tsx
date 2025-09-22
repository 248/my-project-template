import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

import './globals.css'
import { ConditionalHeader } from '@/components/ConditionalHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project Template',
  description: 'A modern full-stack application template',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ミドルウェアから渡されたnonceを取得
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? undefined

  return (
    <html lang="ja">
      <body className={inter.className}>
        <ClerkProvider
          nonce={nonce}
          afterSignInUrl="/home"
          afterSignUpUrl="/home"
          publishableKey={process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']}
        >
          <div className="min-h-screen bg-gray-50">
            <ConditionalHeader />
            <main>{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
