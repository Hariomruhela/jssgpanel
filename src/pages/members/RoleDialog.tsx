import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Info, Loader2 } from "lucide-react"
import { ApiError } from "@/lib/apiClient"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useData } from "@/lib/useData"
import { SearchableSelect } from "@/components/SearchableSelect"
import type { MemberRecord } from "@/types"
import { changeUserRole } from "@/services/api/users"
import { getGroupOptions, type GroupOption } from "@/services/api/groups"

/** The panel offers exactly these three login roles — nothing else may be picked. */
const ROLES: { name: string; description: string }[] = [
  { name: "SUPER_ADMIN", description: "Super administrator with full platform access" },
  { name: "GROUP_ADMIN", description: "Administrator for a single social group" },
  { name: "MEMBER", description: "Registered community member" },
]

const NO_GROUP_VALUE = "__no_group__"

interface RoleDialogProps {
  member: MemberRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function RoleDialog({ member, onOpenChange, onSaved }: RoleDialogProps) {
  // Keyed by member id by the parent, so the state starts from that member.
  const groups = useData(useCallback(() => getGroupOptions().catch(() => [] as GroupOption[]), []))

  const [roleName, setRoleName] = useState(member?.user?.role?.name ?? "MEMBER")
  const [groupId, setGroupId] = useState<string>(member?.group_id ?? NO_GROUP_VALUE)
  const [saving, setSaving] = useState(false)

  const user = member?.user ?? null
  const needsGroup = roleName === "GROUP_ADMIN"
  const unchanged =
    (member?.user?.role?.name ?? "") === roleName &&
    (!needsGroup || (member?.group_id ?? null) === (groupId === NO_GROUP_VALUE ? null : groupId))

  const save = async () => {
    if (!member || !user) return
    if (needsGroup && groupId === NO_GROUP_VALUE) {
      toast.error("Pick the group this Group Admin will run.")
      return
    }
    setSaving(true)
    try {
      await changeUserRole(user.id, roleName, needsGroup ? groupId : null)
      toast.success(`${member.full_name} is now ${roleName}`)
      onSaved()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message, { description: error.detail ?? undefined })
      } else {
        toast.error(error instanceof Error ? error.message : "Could not change the role.")
      }
    } finally {
      setSaving(false)
    }
  }

  const groupOptions = (groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))
  const selectedRole = ROLES.find((role) => role.name === roleName)

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        {member && (
          <>
            <DialogHeader>
              <DialogTitle>Change role · {member.full_name}</DialogTitle>
              <DialogDescription>
                The role decides what this member's login account can do in the panel and API.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!user && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  This member has no login account, so no role can be assigned. Link an account from
                  the member form first.
                </p>
              )}

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Role</p>
                <Select value={roleName} onValueChange={setRoleName} disabled={!user}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                )}
              </div>

              {needsGroup && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Group to administer <span className="text-destructive">*</span>
                  </p>
                  {groups.loading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <SearchableSelect
                      options={groupOptions}
                      value={groupId === NO_GROUP_VALUE ? "" : groupId}
                      onChange={setGroupId}
                      placeholder="Search and select a group…"
                      searchPlaceholder="Type a group name…"
                      emptyText="No group matched. Create it under Group Management first."
                      disabled={!user}
                    />
                  )}
                  {groups.error && (
                    <p className="text-xs text-destructive">
                      Could not load groups: {groups.error.message}
                    </p>
                  )}
                </div>
              )}

              <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Changing roles needs the Super Admin permission, and the account can never demote
                its own administrator role.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={
                  !user ||
                  saving ||
                  unchanged ||
                  (needsGroup && groupId === NO_GROUP_VALUE) ||
                  (needsGroup && (groups.data ?? []).length === 0)
                }
              >
                {saving && <Loader2 className="animate-spin" />}
                {saving ? "Saving…" : "Save role"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
