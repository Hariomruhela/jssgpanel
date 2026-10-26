import { useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/FormField"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language"
import { setMemberStatus } from "@/services/api/members"
import type { MemberDetail, MemberRecord } from "@/types"

interface MemberApprovalDialogProps {
  member: MemberRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: (member: MemberDetail) => void
}

export function MemberApprovalDialog({ member, onOpenChange, onSaved }: MemberApprovalDialogProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  const approving = member?.membership_status !== "APPROVED"
  const trimmedReason = reason.trim()

  const submit = async () => {
    if (!member || (!approving && !trimmedReason)) return
    setBusy(true)
    try {
      const updated = await setMemberStatus(
        member.id,
        approving ? "APPROVED" : "REJECTED",
        approving ? undefined : trimmedReason
      )
      toast.success(
        approving
          ? t("{name} approved", { name: member.full_name })
          : t("{name} unapproved", { name: member.full_name })
      )
      onOpenChange(false)
      onSaved(updated)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("Could not update member approval."),
        { description: (error instanceof ApiError ? error.detail : null) ?? undefined }
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !busy && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        {member && (
          <>
            <DialogHeader>
              <DialogTitle>{approving ? t("Approve member") : t("Unapprove member")}</DialogTitle>
              <DialogDescription>
                {approving
                  ? t(
                      "Approve {name}? The member will be marked as approved in the directory.",
                      { name: member.full_name }
                    )
                  : t(
                      "Unapprove {name}? The member will be marked as rejected and removed from the approved count.",
                      { name: member.full_name }
                    )}
              </DialogDescription>
            </DialogHeader>

            {!approving && (
              <FormField
                label={t("Reason")}
                required
                hint={t("The API requires a reason when unapproving a member.")}
              >
                <Textarea
                  value={reason}
                  rows={3}
                  placeholder={t("Why is this member being unapproved?")}
                  onChange={(e) => setReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && submit()}
                />
              </FormField>
            )}

            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                {t("Cancel")}
              </Button>
              <Button
                variant={approving ? "default" : "destructive"}
                disabled={busy || (!approving && !trimmedReason)}
                onClick={submit}
              >
                {busy ? t("Saving…") : approving ? t("Approve") : t("Unapprove")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
