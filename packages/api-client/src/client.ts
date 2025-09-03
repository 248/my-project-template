// API クライアントの基本実装
// TODO: OpenAPI 仕様ファイルから自動生成に置き換える

export interface ApiClient {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, data?: unknown) => Promise<T>
  put: <T>(path: string, data?: unknown) => Promise<T>
  delete: <T>(path: string) => Promise<T>
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`)
      return response.json() as Promise<T>
    },
    async post<T>(path: string, data?: unknown): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      })
      return response.json() as Promise<T>
    },
    async put<T>(path: string, data?: unknown): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      })
      return response.json() as Promise<T>
    },
    async delete<T>(path: string): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'DELETE',
      })
      return response.json() as Promise<T>
    },
  }
}