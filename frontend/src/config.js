
// Base URL of the InferOps backend API.
export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8002'

// Shared API request function.
// Automatically sends the HttpOnly authentication cookie.
export async function apiFetch(path, options = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
  })
}
