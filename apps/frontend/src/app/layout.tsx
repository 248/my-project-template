import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

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
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Project Template
                    </h1>
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
