import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/FormField"
import { Input } from "@/components/ui/input"
import { apiRequest, getErrorMessage } from "@/lib/apiClient"
import { useLanguage } from "@/lib/language"

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!fullName.trim()) {
      nextErrors.fullName = t("Full name is required")
    } else if (fullName.trim().length < 3) {
      nextErrors.fullName = t("Full name must be at least 3 characters")
    }

    if (!email.trim()) {
      nextErrors.email = t("Email is required")
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        nextErrors.email = t("Enter a valid email address")
      }
    }

    if (!phone.trim()) {
      nextErrors.phone = t("Mobile number is required")
    } else {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
        nextErrors.phone = t("Enter a valid 10-digit mobile number")
      }
    }

    if (!password) {
      nextErrors.password = t("Password is required")
    } else if (password.length < 8) {
      nextErrors.password = t("Password must be at least 8 characters")
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("Confirm password is required")
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("Passwords do not match")
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: {
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone_number: phone.replace(/\D/g, ""),
          password,
          confirm_password: confirmPassword,
        },
      })
      toast.success(t("Account created"), {
        description: t("Signup successful! You can now log in"),
      })
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, t("Signup failed. Please try again.")))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[rgba(150,120,55,0.28)] shadow-[0_20px_60px_rgba(47,37,20,0.08)]">
      <CardHeader className="gap-2 pb-0">
        <CardTitle className="font-serif-display text-xl tracking-tight text-[#174824] dark:text-[#d7e6cf] sm:text-2xl">
          {t("Sign up")}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pt-4">
          <FormField label={t("Full name")} required>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                autoComplete="name"
                placeholder={t("e.g. Rahul Shah")}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }))
                }}
                className="pl-9"
                aria-invalid={!!errors.fullName}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive" role="alert">
                {errors.fullName}
              </p>
            )}
          </FormField>

          <FormField label={t("Email")} required>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className="pl-9"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </FormField>

          <FormField label={t("Mobile number")} required>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                autoComplete="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                className="pl-9"
                aria-invalid={!!errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive" role="alert">
                {errors.phone}
              </p>
            )}
          </FormField>

          <FormField
            label={t("Password")}
            required
            hint={t("At least 8 characters; a number and symbol are recommended")}
          >
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <FormField label={t("Confirm password")} required>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }}
                className="pl-9 pr-9"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={showConfirmPassword ? t("Hide password") : t("Show password")}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </FormField>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t("Creating account...") : t("Sign up")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("Already have an account?")}{" "}
            <Link
              to="/login"
              className="font-medium text-[#174824] underline-offset-4 hover:underline dark:text-[#d7e6cf]"
            >
              {t("Log in")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}