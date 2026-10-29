import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/FormField"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/apiClient"
import { useLanguage } from "@/lib/language"
import { NotAdminError, isPhoneIdentifier } from "@/services/api/session"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const { t } = useLanguage()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})

  const requestedPath = (location.state as { from?: string } | null)?.from
  const isPhone = isPhoneIdentifier(identifier)

  const validate = () => {
    const nextErrors: { identifier?: string; password?: string } = {}
    const value = identifier.trim()
    if (!value) {
      nextErrors.identifier = t("Phone number or email is required")
    } else if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      nextErrors.identifier = t("Enter a valid phone number or email")
    }
    if (!password) {
      nextErrors.password = t("Password is required")
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const user = await signIn({ identifier, password })
      setPassword("")
      toast.success(t("Logged in successfully"), {
        description: t("Signed in as {name}", { name: user.full_name }),
      })
      // the panel is only reachable under /admin, so never bounce back to a rejected path
      const target = requestedPath?.startsWith("/admin") ? requestedPath : "/admin/dashboard"
      navigate(target, { replace: true })
    } catch (error) {
      if (error instanceof NotAdminError) {
        toast.error(error.message)
      } else {
        toast.error(getErrorMessage(error, t("Could not reach the JSSG API.")))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[rgba(150,120,55,0.28)] shadow-[0_20px_60px_rgba(47,37,20,0.08)]">
      <CardHeader className="gap-2 pb-0">
        <CardTitle className="font-serif-display text-xl tracking-tight text-[#174824] dark:text-[#d7e6cf] sm:text-2xl">
          {t("Log in")}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pt-4">
          <FormField label={t("Phone number or email")} required>
            <div className="relative">
              {isPhone ? (
                <KeyRound className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              ) : (
                <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                type="text"
                inputMode={isPhone ? "tel" : "email"}
                autoComplete="username"
                placeholder="9876543210 or admin@jssg.in"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }))
                }}
                className="pl-9"
                aria-invalid={!!errors.identifier}
              />
            </div>
            {errors.identifier && (
              <p className="text-xs text-destructive" role="alert">
                {errors.identifier}
              </p>
            )}
          </FormField>

          <FormField label={t("Password")} required>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                className="pl-9 pr-9"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={showPassword ? t("Hide password") : t("Show password")}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {errors.password}
              </p>
            )}
          </FormField>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
                {t("Remember me")}
              </Label>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-[#174824] underline-offset-4 hover:underline dark:text-[#d7e6cf]"
              onClick={() =>
                toast.info(t("Password reset"), {
                  description: t("Password reset will be available soon"),
                })
              }
            >
              {t("Forgot password?")}
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t("Logging in...") : t("Log in")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("Don't have an account?")}{" "}
            <Link
              to="/signup"
              className="font-medium text-[#174824] underline-offset-4 hover:underline dark:text-[#d7e6cf]"
            >
              {t("Sign up")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
