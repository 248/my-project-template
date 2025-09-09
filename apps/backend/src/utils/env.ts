// 環境変数チェック用ユーティリティ
// transfer.mdの設計に基づく実装

export interface EnvironmentCheck {
  name: string
  ok: boolean
  note?: string
}

export function checkEnvironmentVariables(
  env: Record<string, unknown>, 
  requiredKeys: string[]
): EnvironmentCheck[] {
  return requiredKeys.map((key) => {
    const value = env[key]
    return {
      name: `env:${key}`,
      ok: typeof value === "string" && value.length > 0,
      note: value ? "set" : "missing",
    }
  })
}

// タイムアウト付きPromise実行
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs = 1200
): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    )
  ])
}