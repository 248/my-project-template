// 安全装置: 本番環境でAUTH_BYPASSが有効になっていないかチェック
if (process.env.AUTH_BYPASS === '1' && process.env.NODE_ENV === 'production') {
  throw new Error(
    '🚨 SECURITY ERROR: AUTH_BYPASS is enabled in production environment! ' +
      'This would disable all authentication checks. ' +
      'Please remove AUTH_BYPASS=1 from production environment variables.'
  )
}

if (
  process.env.NEXT_PUBLIC_AUTH_BYPASS === '1' &&
  process.env.NODE_ENV === 'production'
) {
  throw new Error(
    '🚨 SECURITY ERROR: NEXT_PUBLIC_AUTH_BYPASS is enabled in production environment! ' +
      'This would disable frontend authentication checks. ' +
      'Please remove NEXT_PUBLIC_AUTH_BYPASS=1 from production environment variables.'
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  typescript: {
    // 型チェックはCIで実行するため、ビルド時はスキップ
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLintチェックはCIで実行するため、ビルド時はスキップ
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
}

module.exports = nextConfig
