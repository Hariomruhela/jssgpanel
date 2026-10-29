import type { ApiEnvelope } from "@/types"
import { translate } from "@/lib/language"

const DEFAULT_BASE_URL = "https://jssgapi-ten.vercel.app/api/v1"
const TOKEN_STORAGE_KEY = "jssg-api-token"

/** Fired once when the API rejects the current token (HTTP 401). */
export const AUTH_UNAUTHORIZED_EVENT = "jssg:auth-unauthorized"

const ENV_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

export const API_BASE_URL = (
  import.meta.env.DEV
    ? "/api/v1"
    : (ENV_BASE_URL || DEFAULT_BASE_URL)
).replace(/\/+$/, "")

export class ApiError extends Error {
  status: number
  /** The backend's own reason, kept so a 403 can explain the specific rule. */
  detail: string | null
  errorCode?: string | null

  constructor(
    message: string,
    status: number,
    detail: string | null = null,
    errorCode: string | null = null
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
    this.errorCode = errorCode
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // storage unavailable (private mode / disabled) - the session simply won't persist
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

export function normalizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== "string") return ""
  const trimmed = msg.trim()
  const lower = trimmed.toLowerCase()

  // Requirement 3: For duplicate phone numbers, display: "This phone number is already registered."
  if (
    (lower.includes("phone") || lower.includes("mobile")) &&
    (lower.includes("already") ||
      lower.includes("registered") ||
      lower.includes("exist") ||
      lower.includes("duplicate") ||
      lower.includes("unique"))
  ) {
    return "This phone number is already registered."
  }

  // Requirement 4: For duplicate emails, display: "This email is already registered."
  if (
    lower.includes("email") &&
    (lower.includes("already") ||
      lower.includes("registered") ||
      lower.includes("exist") ||
      lower.includes("duplicate") ||
      lower.includes("unique"))
  ) {
    return "This email is already registered."
  }

  return trimmed
}

export function getDefaultStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return translate("Invalid request. Please check your input.")
    case 401:
      return translate("Authentication failed. Please sign in again.")
    case 403:
      return translate("You do not have permission to perform this action.")
    case 404:
      return translate("The requested resource was not found.")
    case 409:
      return translate("A conflict occurred with an existing record.")
    case 422:
      return translate("Validation error. Please verify the entered data.")
    case 500:
      return translate("Server error occurred. Please try again later.")
    default:
      return translate("Request failed ({status})", { status })
  }
}

function isGenericError(msg: string): boolean {
  if (!msg) return true
  const lower = msg.trim().toLowerCase()
  return (
    lower === "something went wrong" ||
    lower === "something went wrong, please try again" ||
    lower === "internal server error" ||
    lower === "internal server error." ||
    lower === "an unexpected error occurred." ||
    lower.startsWith("internal server error [sql:")
  )
}

function formatValidationItem(item: unknown): string {
  if (typeof item === "string") {
    return normalizeErrorMessage(item)
  }
  if (item && typeof item === "object") {
    const obj = item as { loc?: unknown; msg?: unknown; type?: unknown }
    let msg = typeof obj.msg === "string" ? obj.msg.trim() : ""
    if (msg.startsWith("Value error, ")) {
      msg = msg.substring("Value error, ".length)
    }
    const normalized = normalizeErrorMessage(msg)
    if (
      normalized === "This phone number is already registered." ||
      normalized === "This email is already registered."
    ) {
      return normalized
    }
    const locArr = Array.isArray(obj.loc) ? obj.loc : []
    const fieldParts = locArr.filter(
      (part) => part !== "body" && part !== "query" && part !== "path"
    )
    if (fieldParts.length > 0 && msg) {
      return `${fieldParts.join(".")}: ${msg}`
    }
    return msg || JSON.stringify(item)
  }
  return String(item)
}

export function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    const trimmed = payload.trim()
    if (!trimmed) return fallback
    try {
      const parsed = JSON.parse(trimmed)
      return extractMessage(parsed, fallback)
    } catch {
      return normalizeErrorMessage(trimmed)
    }
  }

  if (!payload || typeof payload !== "object") {
    return fallback
  }

  const record = payload as Record<string, unknown>
  let candidate = ""

  // Format 1: detail as string
  if (typeof record.detail === "string" && record.detail.trim()) {
    candidate = normalizeErrorMessage(record.detail.trim())
  }
  // Format 2: detail as array (FastAPI 422 RequestValidationError or Pydantic errors)
  else if (Array.isArray(record.detail) && record.detail.length > 0) {
    const formattedList = record.detail.map(formatValidationItem).filter(Boolean)
    const duplicateError = formattedList.find(
      (m) =>
        m === "This phone number is already registered." ||
        m === "This email is already registered."
    )
    if (duplicateError) {
      candidate = duplicateError
    } else {
      candidate = formattedList.join("; ")
    }
  }

  // Format 3: message as string
  if (!candidate || isGenericError(candidate)) {
    if (typeof record.message === "string" && record.message.trim()) {
      const normalizedMsg = normalizeErrorMessage(record.message.trim())
      if (!isGenericError(normalizedMsg) || !candidate) {
        candidate = normalizedMsg
      }
    }
  }

  // Format 4: other possible fields like error or errors
  if (!candidate || isGenericError(candidate)) {
    if (typeof record.error === "string" && record.error.trim()) {
      candidate = normalizeErrorMessage(record.error.trim())
    } else if (Array.isArray(record.errors) && record.errors.length > 0) {
      candidate = record.errors.map(formatValidationItem).filter(Boolean).join("; ")
    }
  }

  if (candidate && candidate.trim()) {
    if (!isGenericError(candidate)) {
      return candidate
    }
  }

  return fallback
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  if (!error) return fallback || translate("An unexpected error occurred.")
  if (error instanceof ApiError) {
    return normalizeErrorMessage(error.message)
  }
  if (error instanceof Error) {
    return normalizeErrorMessage(error.message)
  }
  if (typeof error === "string") {
    return normalizeErrorMessage(error)
  }
  return fallback || translate("An unexpected error occurred.")
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options
  const token = getStoredToken()
  const headers: Record<string, string> = { Accept: "application/json" }
  const formData = body instanceof FormData ? body : null
  // A multipart body carries its own boundary, so setting the JSON content type
  // would make the API reject the upload.
  if (body !== undefined && !formData) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`

  if (auth && !token) {
    throw new ApiError(translate("You are signed out. Sign in to the JSSG API to perform this action."), 401)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    })
  } catch {
    throw new ApiError(translate("Could not reach the JSSG API. Check your connection and try again."), 0)
  }

  const raw = await response.text()
  let payload: unknown = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = raw
    }
  }

  if (!response.ok) {
    // Only an authenticated request whose token is still the current one can expire the
    // session. Concurrent 401s share that token, so clearing it once makes the rest no-ops.
    if (response.status === 401 && token && getStoredToken() === token) {
      setStoredToken(null)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
      }
    }
    const defaultMsg = getDefaultStatusMessage(response.status)
    const specificMessage = extractMessage(payload, defaultMsg)
    const errorCode =
      payload &&
      typeof payload === "object" &&
      typeof (payload as Record<string, unknown>).error_code === "string"
        ? ((payload as Record<string, unknown>).error_code as string)
        : null

    throw new ApiError(specificMessage, response.status, specificMessage, errorCode)
  }

  if (payload && typeof payload === "object" && (payload as ApiEnvelope<unknown>).success === false) {
    const envelope = payload as ApiEnvelope<unknown>
    throw new ApiError(envelope.message || translate("The API reported a failure."), response.status)
  }

  return payload as T
}

export function unwrap<T>(payload: ApiEnvelope<T> | null | undefined): T {
  return (payload?.data ?? null) as T
}

export function unwrapList<T>(payload: ApiEnvelope<T[]> | null | undefined): T[] {
  return Array.isArray(payload?.data) ? payload.data : []
}

export function unwrapItem<T>(payload: unknown): T {
  if (Array.isArray(payload)) return payload[0] as T
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}
