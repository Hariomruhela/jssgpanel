import type { ApiEnvelope } from "@/types"
import { translate } from "@/lib/language"

const DEFAULT_BASE_URL = "https://jssgapi.vercel.app/api/v1"
const TOKEN_STORAGE_KEY = "jssg-api-token"

const ENV_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

export const API_BASE_URL = (ENV_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "")

export class ApiError extends Error {
  status: number
  /** The backend's own reason, kept so a 403 can explain the specific rule. */
  detail: string | null

  constructor(message: string, status: number, detail: string | null = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
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

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload
  if (!payload || typeof payload !== "object") return fallback
  const record = payload as Record<string, unknown>
  if (typeof record.message === "string" && record.message) return record.message
  if (typeof record.detail === "string" && record.detail) return record.detail
  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const first = record.detail[0] as { msg?: unknown } | undefined
    if (typeof first?.msg === "string" && first.msg) return first.msg
  }
  return fallback
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
    if (response.status === 401) {
      setStoredToken(null)
      if (typeof window !== "undefined") {
        try {
          const current = window.location.pathname
          if (current !== "/login") {
            window.location.assign("/login")
          }
        } catch {
          // ignore
        }
      }
    }
    const detail = extractMessage(payload, translate("Request failed ({status})", { status: response.status }))
    // A 403 always means the same thing to the admin - the role/permission check
    // refused it - so surface the standard wording and keep the backend reason as detail.
    if (response.status === 403) {
      throw new ApiError(translate("You do not have permission to perform this action."), 403, detail)
    }
    throw new ApiError(detail, response.status)
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
