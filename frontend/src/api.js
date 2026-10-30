
const API_BASE = '/api'

export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token')

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('userId')
    window.location.assign('/')
    throw new Error('Your session expired. Please sign in again.')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`

    try {
      const data = await response.json()
      message =
        data.message ||
        data.detail ||
        data.error ||
        message
    } catch {
      // The server did not return a JSON error body.
    }

    throw new Error(message)
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''

  return contentType.includes('application/json')
    ? response.json()
    : null
}
