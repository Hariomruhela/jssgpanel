import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/apiClient"
import { useLanguage } from "@/lib/language"
import { NotAdminError, isGroupAdminRole, isPhoneIdentifier } from "@/services/api/session"
import { LotusIcon } from "@/components/LotusIcon"

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
      const target = isGroupAdminRole(user)
        ? "/admin/advertisements"
        : requestedPath?.startsWith("/admin")
          ? requestedPath
          : "/admin/dashboard"
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
    <div className="relative w-full rounded-2xl border border-[#EFE8DC] bg-white p-7 sm:p-8 shadow-[0_8px_30px_rgba(43,30,22,0.05)]">
      {/* Hand Icon at top of Card */}
      <div className="flex justify-center mb-2">
        <img
          src="/hand_icon.png"
          alt="Ahimsa Hand"
          className="h-10 w-auto object-contain select-none"
        />
      </div>

      {/* Card Header text */}
      <div className="text-center mb-5">
        <h2 className="font-serif-display text-2xl font-bold tracking-tight text-[#2B1E16]">
          {t("Welcome Back")}
        </h2>
        <p className="mt-1 text-xs text-[#8C7C6D]">
          {t("Sign in to access the JSSG Jain Community Admin Panel")}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Phone number or email input */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-semibold text-[#2B1E16]">
            {t("Phone number or email")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            {isPhone ? (
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89887]" />
            ) : (
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89887]" />
            )}
            <Input
              id="identifier"
              type="text"
              inputMode={isPhone ? "tel" : "email"}
              autoComplete="username"
              placeholder={t("Enter your phone number or email")}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }))
              }}
              className="h-10 pl-9 rounded-lg border-[#E5DDD0] bg-white text-xs placeholder:text-[#B5A899] focus-visible:border-[#8C6D46] focus-visible:ring-1 focus-visible:ring-[#8C6D46]"
              aria-invalid={!!errors.identifier}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-destructive" role="alert">
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-[#2B1E16]">
            {t("Password")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89887]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("Enter your password")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              className="h-10 pl-9 pr-9 rounded-lg border-[#E5DDD0] bg-white text-xs placeholder:text-[#B5A899] focus-visible:border-[#8C6D46] focus-visible:ring-1 focus-visible:ring-[#8C6D46]"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#A89887] transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none"
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
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              className="border-[#D0C5B4] data-[state=checked]:bg-[#422E22] data-[state=checked]:border-[#422E22]"
            />
            <Label htmlFor="remember" className="cursor-pointer text-xs text-[#6B5A4B]">
              {t("Remember me")}
            </Label>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-[#6B5A4B] underline-offset-4 hover:underline hover:text-[#2B1E16]"
            onClick={() =>
              toast.info(t("Password reset"), {
                description: t("Password reset will be available soon"),
              })
            }
          >
            {t("Forgot password?")}
          </button>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-10 mt-3 rounded-lg bg-[#422E22] text-white hover:bg-[#2D1F17] shadow-sm shadow-[#422E22]/20 font-medium transition-all"
          disabled={loading}
        >
          <span>{loading ? t("Logging in...") : t("Log In")}</span>
          <ArrowRight className="size-4 ml-1.5" />
        </Button>

        {/* Don't have an account? */}
        <p className="pt-2 text-center text-xs text-[#8C7C6D]">
          {t("Don't have an account?")}{" "}
          <Link
            to="/signup"
            className="font-semibold text-[#B88B4A] hover:text-[#422E22] underline-offset-4 hover:underline"
          >
            {t("Contact Admin")}
          </Link>
        </p>

        {/* Lotus Divider with Horizontal Accents (matches screenshot) */}
        <div className="pt-4 flex items-center justify-center gap-3 text-[#C5A059]">
          <span className="h-px w-10 bg-[#C5A059]/40" />
          <LotusIcon className="size-4 text-[#C5A059]" />
          <span className="h-px w-10 bg-[#C5A059]/40" />
        </div>
      </form>
    </div>
  )
}
