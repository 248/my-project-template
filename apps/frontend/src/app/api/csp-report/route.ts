import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let report: unknown
    if (contentType.includes('application/reports+json')) {
      // W3C報告形式（配列の場合もある）
      report = await request.json()
    } else if (contentType.includes('application/csp-report')) {
      // 旧式のcsp-report形式
      report = await request
        .json()
        .catch(async () => ({ raw: await request.text() }))
    } else {
      // その他は素通しでテキストに落とす
      report = await request.text()
    }
    // eslint-disable-next-line no-console
    console.warn('CSP Report:', report)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to handle CSP report', e)
  }
  // レスポンスは内容無しでOK
  return new NextResponse(null, { status: 204 })
}
