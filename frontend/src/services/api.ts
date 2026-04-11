export const API_URL = 'http://localhost:3001'

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error ?? `Error HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiFormData<T>(endpoint: string, body: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', body })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error ?? `Error HTTP ${res.status}`)
  }
  return res.json()
}
