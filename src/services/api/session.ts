import { apiRequest, getStoredToken, setStoredToken, unwrapItem } from "@/lib/apiClient"
import { translate } from "@/lib/language"
import type { AuthLoginResponse, UserAccount } from "@/types"

const USER_STORAGE_KEY = "jssg-api-user"

export function adminOnlyLoginMessage(): string {
  return translate("Only Admin users can login to the Admin Panel.")
}

export function adminOnlyAccessMessage(): string {
  return translate("Only Admin users can access the Admin Panel.")
}

export interface SignInCredentials {
  /** Phone number or email address — the API accepts either. */
  identifier: string
  password: string
}

/** Raised when the credentials are valid but the account may not use the Admin Panel. */
export class NotAdminError extends Error {
  constructor(message?: string) {
    super(message ?? adminOnlyLoginMessage())
    this.name = "NotAdminError"
  }
}

const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isPhoneIdentifier(identifier: string): boolean {
  const value = identifier.trim()
  return PHONE_PATTERN.test(value) && !EMAIL_PATTERN.test(value)
}

/**
 * Roles allowed into the Admin Panel: the platform-wide admin tier only. This
 * mirrors the backend's unrestricted (non-group-scoped) roles in
 * `app/core/scope.py`. `REGIONAL_ADMIN`/`GROUP_ADMIN` are deliberately excluded —
 * they only have member CRUD scoped to their own group, so they must not reach the
 * whole panel. `MEMBER` is rejected.
 *
 * The label is normalised (trimmed, case-folded) because production role rows were
 * imported from Excel/Google Sheets and some were stored as `"Admin\n"`; the
 * backend resolves the same label to the same canonical role.
 */
const ADMIN_PANEL_ROLES = new Set(["admin", "super_admin", "federation_admin"])

export function isAdminRole(user: Pick<UserAccount, "role"> | null | undefined): boolean {
  const role = user?.role?.name
  if (typeof role !== "string") return false
  return ADMIN_PANEL_ROLES.has(role.trim().toLowerCase())
}

export function isSignedIn(): boolean {
  return getStoredToken() !== null
}

export function getStoredUser(): UserAccount | null {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserAccount
    return parsed && typeof parsed === "object" && typeof parsed.id === "string" ? parsed : null
  } catch {
    return null
  }
}

function setStoredUser(user: UserAccount | null): void {
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // storage unavailable (private mode / disabled) - the session simply won't persist
  }
}

/** Clears the access token and the cached user. */
export function signOut(): void {
  setStoredToken(null)
  setStoredUser(null)
}

/**
 * `POST /auth/login`. Accepts a phone number or an email address and stores the returned
 * access token. The caller decides what to do with the role — see `signInAsAdmin`.
 */
export async function signIn(credentials: SignInCredentials): Promise<UserAccount> {
  const identifier = credentials.identifier.trim()
  if (!identifier || !credentials.password) {
    throw new Error(translate("Enter your phone number or email and your password."))
  }

  const body = isPhoneIdentifier(identifier)
    ? { phone_number: identifier, password: credentials.password }
    : { email: identifier, password: credentials.password }

  const response = await apiRequest<AuthLoginResponse>("/auth/login", { method: "POST", body })

  const accessToken = response?.tokens?.access_token
  if (!accessToken) {
    throw new Error(translate("The API did not return an access token for these credentials."))
  }
  const user = response?.user
  if (!user || typeof user.id !== "string") {
    throw new Error(translate("The API did not return an account for these credentials."))
  }

  setStoredToken(accessToken)
  setStoredUser(user)
  return user
}

/**
 * Admin Panel sign-in: authenticates against the API and enforces the admin role.
 * A non-admin account is signed out again so no token is left behind.
 */
export async function signInAsAdmin(credentials: SignInCredentials): Promise<UserAccount> {
  const user = await signIn(credentials)
  if (!isAdminRole(user)) {
    signOut()
    throw new NotAdminError()
  }
  return user
}

/** `GET /auth/me` — revalidates the stored token and refreshes the cached user. */
export async function getSignedInUser(): Promise<UserAccount> {
  const user = await apiRequest<UserAccount>("/auth/me", { auth: true }).then(unwrapItem<UserAccount>)
  if (!user || typeof user.id !== "string") {
    throw new Error(translate("The API did not return an account for this session."))
  }
  setStoredUser(user)
  return user
}
