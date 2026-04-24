/**
 * Centralised API error handling utilities.
 *
 * Every backend error now has the shape:
 *   { error: "Human message", code: "snake_code", details: { field: ["msg"] } }
 *
 * These helpers extract the right thing to show the user.
 */
import toast from 'react-hot-toast'

/**
 * Extract a single human-readable message from an Axios error.
 * Falls back gracefully through every possible shape.
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback

  // Network / no response
  if (!err.response) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Network error. Please check your internet connection.'
    }
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.'
    }
    return fallback
  }

  const { status, data } = err.response

  // Our normalised backend shape
  if (data?.error) return data.error

  // DRF default shapes (before our handler kicks in)
  if (data?.detail) return data.detail
  if (data?.non_field_errors?.[0]) return data.non_field_errors[0]

  // HTTP status fallbacks
  const STATUS_MESSAGES = {
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to do that.',
    404: 'The requested resource was not found.',
    402: 'Payment required. Please upgrade your plan.',
    409: 'A conflict occurred. Please refresh and try again.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please slow down.',
    500: 'Server error. Please try again later.',
    502: 'Payment gateway error. Please try again.',
    503: 'Service temporarily unavailable. Please try again shortly.',
  }

  return STATUS_MESSAGES[status] || fallback
}

/**
 * Extract field-level validation errors from an Axios error.
 * Returns { fieldName: "first error message" } or {}
 *
 * Usage in forms:
 *   const fieldErrors = getFieldErrors(err)
 *   // fieldErrors.email → "This email is already taken."
 */
export function getFieldErrors(err) {
  if (!err?.response?.data) return {}
  const data = err.response.data

  // Our normalised shape: { details: { field: ["msg", ...] } }
  if (data.details && typeof data.details === 'object') {
    return Object.fromEntries(
      Object.entries(data.details).map(([k, v]) => [
        k,
        Array.isArray(v) ? v[0] : String(v),
      ])
    )
  }

  // DRF default shape: { field: ["msg"] }
  const result = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'error' || key === 'code' || key === 'detail') continue
    result[key] = Array.isArray(value) ? value[0] : String(value)
  }
  return result
}

/**
 * Show all field errors as individual toasts.
 * Useful for forms where you want per-field feedback.
 */
export function toastFieldErrors(err) {
  const fields = getFieldErrors(err)
  const entries = Object.entries(fields)
  if (entries.length === 0) {
    toast.error(getErrorMessage(err))
    return
  }
  entries.forEach(([field, msg]) => {
    const label = field === 'non_field_errors' ? '' : `${field}: `
    toast.error(`${label}${msg}`)
  })
}

/**
 * One-liner: show a toast for any error.
 * Use this when you don't need field-level handling.
 */
export function toastError(err, fallback) {
  toast.error(getErrorMessage(err, fallback))
}
