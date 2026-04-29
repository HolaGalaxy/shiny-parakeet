const API_BASE = '/api'

type Json = Record<string, unknown>

async function request<T>(
  path: string,
  init: RequestInit & { json?: Json } = {},
): Promise<{ res: Response; data: T }> {
  const { json, headers, ...rest } = init
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = (await res.json()) as T
  if (!res.ok) {
    throw Object.assign(new Error('Request failed'), { res, data })
  }
  return { res, data }
}

export const api = {
  post: <T>(path: string, json: Json, init?: Omit<RequestInit, 'body'>) =>
    request<T>(path, { method: 'POST', json, ...init }),
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: 'GET', ...init }),
}
