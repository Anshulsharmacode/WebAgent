const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ?? ''

export async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as TResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`)
  }

  return data
}
