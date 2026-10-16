import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { isAdminRole, signInAsAdmin, signOut as clearSession, getSignedInUser, getStoredUser, isSignedIn, adminOnlyAccessMessage } from "@/services/api/session"
import type { UserAccount } from "@/types"

type AuthStatus = "loading" | "authenticated" | "anonymous"

interface AuthContextValue {
  user: UserAccount | null
  status: AuthStatus
  isAdmin: boolean
  signIn: (credentials: { identifier: string; password: string }) => Promise<UserAccount>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Single owner of the admin session. The token lives in `lib/apiClient` and the cached user in
 * `services/api/session`; this provider only hydrates them into React state and keeps them in
 * sync, so there is a single auth system for the whole app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn()) {
      // no token: drop any cached user so a stale role can never render the panel
      clearSession()
      setUser(null)
      setStatus("anonymous")
      return
    }

    // render immediately from the cached user, then confirm with the API
    setUser(getStoredUser())
    setStatus("loading")

    // a non-admin token is kept here so <RequireAdmin> can explain why access is refused
    getSignedInUser()
      .then((account) => {
        if (!mounted.current) return
        setUser(account)
        setStatus("authenticated")
      })
      .catch(() => {
        if (!mounted.current) return
        clearSession()
        setUser(null)
        setStatus("anonymous")
      })
  }, [])

  const signIn = useCallback(async (credentials: { identifier: string; password: string }) => {
    const account = await signInAsAdmin(credentials)
    if (mounted.current) {
      setUser(account)
      setStatus("authenticated")
    }
    return account
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
    setStatus("anonymous")
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAdmin: isAdminRole(user), signIn, signOut }),
    [user, status, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.")
  return context
}

function GuardFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

/**
 * Gate for `/admin` and `/admin/*`. Unauthenticated visitors go to the login page; an
 * authenticated non-admin is signed out and told why.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, isAdmin, signOut } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      toast.error(adminOnlyAccessMessage())
      signOut()
    }
  }, [status, isAdmin, signOut])

  if (status === "loading") return <GuardFallback />

  if (status === "anonymous" || !isAdmin) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
