import { useCallback } from "react"
import { Settings2, ShieldCheck, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useData } from "@/lib/useData"
import { useLanguage } from "@/lib/language"
import { initials } from "@/lib/format"
import type { GroupAdmin, GroupMember, MemberRecord } from "@/types"
import { getGroupMembers } from "@/services/api/groups"
import { getMembers } from "@/services/api/members"

/** A member row shown under a group: name plus a secondary contact detail. */
export interface GroupDirectoryMember {
  id: string
  name: string
  subtitle: string
  photo: string | null
}

interface GroupMembersInlineProps {
  /** Set when the row is a real `social_groups` row. */
  groupId?: string
  /** Set for a directory-only row: the free-text group name members carry. */
  groupName?: string
  /** The group's admins, shown so the group's leadership is visible here. */
  admins?: GroupAdmin[]
  /** Bump to refetch the member list (e.g. after the dialog changes membership). */
  reloadKey?: number
  /**
   * Opens the add/remove members dialog. For a directory-only row the caller
   * materializes the group first (the free-text name shown here becomes a real
   * `social_groups` row), so the inline never creates groups on its own.
   */
  onManage?: () => void
}

function fromGroupMember(member: GroupMember): GroupDirectoryMember {
  const phone = member.contact_phone || (member as any).phone_number || ""
  return {
    id: member.id,
    name: member.full_name,
    subtitle: phone.trim(),
    photo: member.profile_photo_url || null,
  }
}

function fromMember(member: MemberRecord): GroupDirectoryMember {
  const name =
    member.full_name || [member.first_name, member.last_name].filter(Boolean).join(" ")
  const phone = member.phone_number || member.contact_phone || member.spouse_mobile || ""
  return {
    id: member.id,
    name,
    subtitle: phone.trim(),
    photo: member.profile_photo_url || member.member_photo_link || null,
  }
}

/** Members attached to a group, shown inline under its row in the directory. */
export function GroupMembersInline({
  groupId,
  groupName,
  admins = [],
  reloadKey = 0,
  onManage,
}: GroupMembersInlineProps) {
  const { t, h } = useLanguage()
  const load = useCallback(async () => {
    if (groupId) {
      const { members, total } = await getGroupMembers(groupId, { pageSize: 100 })
      return { members: members.map(fromGroupMember), total }
    }
    const { members, total } = await getMembers({ groupName: groupName ?? "", pageSize: 100 })
    return { members: members.map(fromMember), total }
  }, [groupId, groupName])
  const data = useData(load, reloadKey)
  const list = data.data?.members ?? []
  const total = data.data?.total ?? list.length

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("Members")}
          </h4>
          {data.data && (
            <span className="text-xs text-muted-foreground">{t("{n} members", { n: total })}</span>
          )}
        </div>
        {onManage && (
          <Button variant="outline" size="sm" onClick={onManage}>
            <Settings2 />
            {t("Manage members")}
          </Button>
        )}
      </div>

      {(() => {
        const fromGroup: any[] = admins ?? []
        if (fromGroup.length === 0) return null
        return (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              {t("Group admins")}
            </span>
            <span>{fromGroup.map((admin: any) => h(admin.full_name)).join(", ")}</span>
          </div>
        )
      })()}

      {!groupId && (
        <p className="text-xs text-muted-foreground">
          {t(
            "These members carry this group name as free text. Managing them creates the group automatically."
          )}
        </p>
      )}

      {data.loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          {data.error.message}
        </p>
      ) : list.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("No members in this group yet")}</p>
          {onManage && (
            <Button variant="ghost" size="sm" onClick={onManage}>
              <UserPlus />
              {t("Add members")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2.5 rounded-lg border bg-background/60 px-3 py-2"
            >
              <Avatar size="sm">
                {member.photo && <AvatarImage src={member.photo} alt={member.name} />}
                <AvatarFallback>{initials(member.name) || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{h(member.name)}</p>
                <p className="truncate text-xs text-muted-foreground">{member.subtitle || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
