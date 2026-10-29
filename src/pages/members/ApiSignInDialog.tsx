import { useState } from "react"
import { toast } from "sonner"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormField } from "@/components/FormField"
import { Input } from "@/components/ui/input"
import { NotAdminError, isPhoneIdentifier } from "@/services/api/session"
import { getErrorMessage } from "@/lib/apiClient"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"

interface ApiSignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignedIn: () => void
}

export function ApiSignInDialog({ open, onOpenChange, onSignedIn }: ApiSignInDialogProps) {
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const isPhone = isPhoneIdentifier(identifier)

  const submit = async () => {
    if (!identifier.trim() || !password) return
    setBusy(true)
    try {
      const user = await signIn({ identifier, password })
      toast.success(t("Signed in as {name}", { name: user.full_name }))
      setPassword("")
      onOpenChange(false)
      onSignedIn()
    } catch (error) {
      if (error instanceof NotAdminError) {
        toast.error(error.message)
      } else {
        toast.error(getErrorMessage(error, t("Could not sign in.")))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Sign in to the JSSG API")}</DialogTitle>
          <DialogDescription>
            {t("Member management needs an admin account. Reading members works without a session.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label={t("Phone number or email")} required>
            <Input
              type="text"
              inputMode={isPhone ? "tel" : "email"}
              value={identifier}
              autoComplete="username"
              placeholder="9876543210 or admin@jssg.in"
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </FormField>
          <FormField label={t("Password")} required>
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={busy || !identifier.trim() || !password}>
            <KeyRound />
            {busy ? t("Signing in…") : t("Sign in")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
