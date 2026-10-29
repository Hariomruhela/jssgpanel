import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Search, ShieldCheck, ShieldPlus, UserPlus, X } from "lucide-react"
import { getErrorMessage } from "@/lib/apiClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useData } from "@/lib/useData"
import { useLanguage } from "@/lib/language"
import { initials } from "@/lib/format"
import type { GroupAdmin, GroupMember, GroupRecord, MemberRecord } from "@/types"
import {
  addGroupAdmin,
  addGroupMember,
  getGroupMembers,
  removeGroupAdmin,
  removeGroupMember,
} from "@/services/api/groups"
import { getMembers, getMember } from "@/services/api/members"

interface GroupMembersDialogProps {
  group: GroupRecord | null
  onOpenChange: (open: boolean) => void
  /** Called after any add/remove so the page can reload its group list. */
  onChanged: () => void
}

function describeError(error: unknown, fallback: string): { message: string; description?: string } {
  return { message: getErrorMessage(error, fallback) }
}

function memberPhoto(member: GroupMember | MemberRecord): string | null {
  return member.profile_photo_url || ("member_photo_link" in member ? member.member_photo_link : null) || null
}

function memberSubtitle(member: GroupMember | MemberRecord): string {
  const phone =
    ("phone_number" in member && member.phone_number) ||
    ("contact_phone" in member && member.contact_phone) ||
    null
  if (typeof phone === "string" && phone.trim()) {
    return phone.trim()
  }
  return "—"
}

export function GroupMembersDialog({ group, onOpenChange, onChanged }: GroupMembersDialogProps) {
  const { h } = useLanguage()
  const groupId = group?.id ?? ""
  const [version, setVersion] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adminBusyId, setAdminBusyId] = useState<string | null>(null)
  const [memberAdminBusyId, setMemberAdminBusyId] = useState<string | null>(null)
  // The dialog remounts per group (the parent keys it), so this starts from the
  // group's admins and is kept in sync as admins are added or removed.
  const [admins, setAdmins] = useState<GroupAdmin[]>(() => group?.admins ?? [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addingBulk, setAddingBulk] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")

  const members = useData(
    useCallback(() => getGroupMembers(groupId, { pageSize: 100 }), [groupId]),
    version
  )
  // The whole directory is listed, not only search hits: typing narrows it.
  const directory = useData(
    useCallback(() => getMembers({ query, pageSize: 100 }), [query]),
    version
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput.trim())
      // A new search shows a different list, so drop selections that scrolled out.
      setSelected(new Set())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const refresh = () => {
    setVersion((v) => v + 1)
    onChanged()
  }

  const inGroup = new Set((members.data?.members ?? []).map((m) => m.id))

  const addSelected = async () => {
    if (!group || selected.size === 0) return
    setAddingBulk(true)
    try {
      const results = await Promise.allSettled(
        [...selected].map((id) => addGroupMember(group.id, id))
      )
      const added = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - added
      if (added > 0) {
        toast.success(`${added} member${added === 1 ? "" : "s"} added to ${group.name}`)
      }
      if (failed > 0) {
        toast.error(`${failed} member${failed === 1 ? "" : "s"} could not be added.`)
      }
      setSelected(new Set())
      refresh()
    } catch (error) {
      const { message, description } = describeError(error, "Could not add the members.")
      toast.error(message, { description })
    } finally {
      setAddingBulk(false)
    }
  }

  const remove = async (member: { id: string; full_name: string }) => {
    if (!group) return
    setBusyId(member.id)
    try {
      await removeGroupMember(group.id, member.id)
      toast.success(`${member.full_name} removed from ${group.name}`)
      refresh()
    } catch (error) {
      const { message, description } = describeError(error, "Could not remove the member.")
      toast.error(message, { description })
    } finally {
      setBusyId(null)
    }
  }

  const isAdmin = (member: GroupMember | MemberRecord) => {
    const userId = (member as any).user_id
    if (userId) {
      return effectiveAdmins.some((admin: any) => admin.id === userId)
    }
    return effectiveAdmins.some((admin: any) => admin.id === (member as any).id)
  }

  const makeAdmin = async (member: GroupMember | MemberRecord) => {
    if (!group) return
    setMemberAdminBusyId(member.id)
    try {
      // The member list may omit `user_id`; the member detail always carries it.
      const userId = member.user_id ?? (await getMember(member.id)).user_id
      if (!userId) {
        toast.error(`${member.full_name} has no linked login account to make an admin.`)
        return
      }
      await addGroupAdmin(group.id, userId)
      toast.success(`${member.full_name} is now a group admin`)
      setAdmins((prev) =>
        prev.some((admin) => admin.id === userId)
          ? prev
          : [
              ...prev,
              { id: userId, full_name: member.full_name, email: null, phone_number: null, is_active: true },
            ]
      )
      refresh()
    } catch (error) {
      const { message, description } = describeError(error, "Could not make the member an admin.")
      toast.error(message, { description })
    } finally {
      setMemberAdminBusyId(null)
    }
  }

  const revokeAdmin = async (admin: GroupAdmin) => {
    if (!group) return
    setAdminBusyId(admin.id)
    try {
      await removeGroupAdmin(group.id, admin.id)
      toast.success(`${admin.full_name} is no longer a group admin`)
      setAdmins((prev) => prev.filter((item) => item.id !== admin.id))
      refresh()
    } catch (error) {
      const { message, description } = describeError(error, "Could not remove the group admin.")
      toast.error(message, { description })
    } finally {
      setAdminBusyId(null)
    }
  }

  const groupMembers = members.data?.members ?? []
  const directoryMembers = directory.data?.members ?? []
  // While searching, show only directory matches. Otherwise show the directory
  // plus any group members the directory page did not include, so the whole
  // membership is managed from one list.
  const listedMembers: Array<GroupMember | MemberRecord> = query
    ? directoryMembers
    : [
        ...directoryMembers,
        ...groupMembers.filter((gm) => !directoryMembers.some((dm) => dm.id === gm.id)),
      ]

  const effectiveAdmins = useMemo(() => {
    const fromGroup: any[] = ((group as any)?.admins ?? admins ?? []) as any[]
    const map = new Map<string, any>()
    for (const a of fromGroup) {
      if (a?.id) {
        map.set(a.id, { ...a })
      }
    }
    return Array.from(map.values())
  }, [group, admins])

  const selectable = listedMembers.filter((member) => !inGroup.has(member.id))
  const allSelected = selectable.length > 0 && selectable.every((member) => selected.has(member.id))

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const member of selectable) {
        if (allSelected) next.delete(member.id)
        else next.add(member.id)
      }
      return next
    })
  }

  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] sm:max-w-2xl">
        {group && (
          <>
            <DialogHeader>
              <DialogTitle>Members · {group.name}</DialogTitle>
              <DialogDescription>
                Add members to this group, manage its admins, or remove members already in it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 overflow-y-auto pr-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Group admins
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {effectiveAdmins.length} admin{effectiveAdmins.length === 1 ? "" : "s"}
                  </span>
                </div>

                {effectiveAdmins.length === 0 ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    No group admins yet — make a member an admin from the list below.
                  </p>
                ) : (
                  <ul className="divide-y rounded-xl border">
                    {effectiveAdmins.map((admin) => (
                        <li key={admin.id} className="flex items-center gap-2.5 px-3 py-2">
                          <Avatar size="sm">
                            <AvatarFallback>{initials(admin.full_name) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate font-medium">{h(admin.full_name)}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {admin.phone_number || admin.email || "—"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:text-destructive"
                            disabled={adminBusyId === admin.id}
                            onClick={() => revokeAdmin(admin)}
                            aria-label={`Remove ${admin.full_name} as admin`}
                            title="Remove as group admin"
                          >
                            {adminBusyId === admin.id ? <Loader2 className="animate-spin" /> : <X />}
                          </Button>
                        </li>
                      ))}
                    </ul>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Members
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {members.data ? `${members.data.total} member${members.data.total === 1 ? "" : "s"}` : "…"}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search name, phone, email, membership no…"
                    className="pl-8"
                  />
                </div>

                {members.loading || directory.loading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : members.error || directory.error ? (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                    {(members.error ?? directory.error)?.message}
                  </p>
                ) : listedMembers.length === 0 ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {query ? `No members matched “${query}”.` : "No members in this group yet."}
                  </p>
                ) : (
                  <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
                    {listedMembers.map((member) => (
                      <li key={member.id} className="flex items-center gap-2.5 px-3 py-2">
                        <Avatar size="sm">
                          {memberPhoto(member) && (
                            <AvatarImage src={memberPhoto(member) as string} alt={member.full_name} />
                          )}
                          <AvatarFallback>{initials(member.full_name) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="truncate font-medium flex items-center gap-1.5">
                            {h(member.full_name)}
                            {isAdmin(member) && (
                              <Badge variant="secondary" className="gap-1">
                                <ShieldCheck className="size-3" />
                                Group Admin
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {memberSubtitle(member)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {inGroup.has(member.id) && !isAdmin(member) && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={memberAdminBusyId === member.id}
                              onClick={() => makeAdmin(member)}
                              aria-label={`Make ${member.full_name} a group admin`}
                              title="Make group admin"
                            >
                              {memberAdminBusyId === member.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <ShieldPlus />
                              )}
                            </Button>
                          )}
                          {inGroup.has(member.id) ? (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:text-destructive"
                              disabled={busyId === member.id}
                              onClick={() => remove(member)}
                              aria-label={`Remove ${member.full_name}`}
                              title="Remove from group"
                            >
                              {busyId === member.id ? <Loader2 className="animate-spin" /> : <X />}
                            </Button>
                          ) : (
                            <Checkbox
                              checked={selected.has(member.id)}
                              onCheckedChange={() => toggleSelected(member.id)}
                              aria-label={`Select ${member.full_name}`}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {selectable.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={allSelected ? true : selected.size > 0 ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                      />
                      Select all
                    </label>
                    <Button
                      size="sm"
                      onClick={addSelected}
                      disabled={selected.size === 0 || addingBulk}
                    >
                      {addingBulk ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      Add selected{selected.size > 0 ? ` (${selected.size})` : ""}
                    </Button>
                  </div>
                )}
                {!query &&
                  directory.data &&
                  (directory.data.total ?? 0) > directoryMembers.length && (
                    <p className="text-xs text-muted-foreground">
                      Showing the first {directoryMembers.length} of {directory.data.total} — search
                      to narrow the list.
                    </p>
                  )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
