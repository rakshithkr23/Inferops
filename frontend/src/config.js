
// Base URL of the InferOps backend API.
// Set VITE_API_URL at build time (Docker build arg) to change it.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
