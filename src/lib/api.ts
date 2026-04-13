// src/lib/api.ts
// Cliente HTTP simples usando fetch nativo — sem dependência de axios

const BASE = '/api'

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    localStorage.clear()
    window.location.href = '/'
    throw new Error('Não autorizado')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { response: { data, status: res.status } }
  return { data }
}

const api = {
  get: (url: string, options?: { params?: Record<string, string | undefined> }) => {
    let fullUrl = BASE + url
    if (options?.params) {
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(options.params).filter(([, v]) => v !== undefined)) as Record<string, string>
      ).toString()
      if (q) fullUrl += '?' + q
    }
    return fetch(fullUrl, { headers: getHeaders() }).then(handleResponse)
  },
  post: (url: string, body?: unknown) =>
    fetch(BASE + url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put: (url: string, body?: unknown) =>
    fetch(BASE + url, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (url: string) =>
    fetch(BASE + url, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
}

export default api
