import { getAuth } from 'firebase/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getAuthToken() {
  const user = getAuth().currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

export async function fetchAPI(endpoint, body = null, options = {}) {
  const token = await getAuthToken()
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'POST',
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }

  return res.json()
}

export async function uploadResume(file, candidateId = null) {
  const form = new FormData()
  form.append('file', file)

  if (candidateId) {
    form.append('candidateId', candidateId)
    return fetchAPI('/resume/parse-and-apply', form)
  }
  return fetchAPI('/resume/parse', form)
}
