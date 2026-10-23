import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/apiClient"
import { Landmark, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { initials } from "@/lib/format"
import type { MemberRecord, MemberTrusteeRecord, TrusteeRecord } from "@/types"
import {
  createPostHolder,
  getAllBoardSeats,
  getTrusteeCounts,
  getTrustees,
  removePostHolder,
  updatePostHolder,
} from "@/services/api/postHolders"
import { clearMemberDesignation, getMembers, updateMember } from "@/services/api/members"
import { getGroups } from "@/services/api/groups"

const PAGE_SIZE = 20

const DESIGNATIONS = [
  { value: "President", label: "President" },
  { value: "group_admin", label: "Group Admin" },
  { value: "post_holder", label: "Post Holder" },
]

const DESIGNATION_LABELS: Record<string, string> = Object.fromEntries(
  DESIGNATIONS.map((designation) => [designation.value, designation.label])
)

function designationLabel(value: string): string {
  return DESIGNATION_LABELS[value] ?? value
}

/** Sentinel for the selects: an empty string is not a valid Radix select value. */
const NONE = "none"

interface PostHolderForm {
  firstName: string
  lastName: string
  designation: string
  groupId: string
  memberId: string
  phone: string
  email: string
}

const DEFAULT_FORM: PostHolderForm = {
  firstName: "",
  lastName: "",
  designation: "post_holder",
  groupId: "",
  memberId: "",
  phone: "",
  email: "",
}

/** A member can hold a seat in more than one group, so both parts identify it. */
function seatKey(groupId: string | null | undefined, memberId: string | null | undefined): string {
  return `${groupId ?? ""}:${memberId ?? ""}`
}

export default function PostHoldersPage() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [groupId, setGroupId] = useState("")
  const [version, setVersion] = useState(0)

  const list = useData(
    useCallback(
      () => getTrustees({ page, pageSize: PAGE_SIZE, query, groupId }),
      [page, query, groupId]
    ),
    version
  )
  // The seats carry the term of every post holder; a trustee without a seat is
  // still a post holder (their designation is enough).
  const seats = useData(
    useCallback(() => getAllBoardSeats(groupId || undefined), [groupId]),
    version
  )
  const counts = useData(
    useCallback(() => getTrusteeCounts({ query, groupId }), [query, groupId]),
    version
  )
  const groups = useData(useCallback(() => getGroups(), []), version)

  const groupMap = useMemo(
    () =>
      Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])) as Record<string, string>,
    [groups.data]
  )

  const seatByMember = useMemo(() => {
    const map: Record<string, TrusteeRecord> = {}
    for (const seat of seats.data ?? []) {
      if (seat.member_id) map[seatKey(seat.group_id, seat.member_id)] = seat
    }
    return map
  }, [seats.data])

  const [dialog, setDialog] = useState<{
    open: boolean
    editing: MemberTrusteeRecord | null
    seat: TrusteeRecord | null
  }>({ open: false, editing: null, seat: null })
  const [deleting, setDeleting] = useState<MemberTrusteeRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PostHolderForm>(DEFAULT_FORM)

  // The members of the group the form points at, so a post holder can be
  // linked to the member record it belongs to.
  const groupMembers = useData(
    useCallback(
      () =>
        dialog.open && form.groupId
          ? getMembers({ groupId: form.groupId, pageSize: 100 })
          : Promise.resolve({
              members: [] as MemberRecord[],
              total: 0,
              page: 1,
              pageSize: 100,
              totalPages: 1,
            }),
      [dialog.open, form.groupId]
    )
  )

  const refresh = () => setVersion((v) => v + 1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setQuery(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const changeFilter = (key: string, value: string) => {
    if (key === "group_id") {
      setPage(1)
      setGroupId(value === "all" ? "" : value)
    }
  }

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null, seat: null })
  }

  const openEdit = (trustee: MemberTrusteeRecord) => {
    const seat = seatByMember[seatKey(trustee.group_id, trustee.member_id)] ?? null
    const designation = DESIGNATIONS.some((item) => item.value === trustee.designation)
      ? trustee.designation
      : "post_holder"
    setForm({
      firstName: trustee.first_name ?? "",
      lastName: trustee.last_name ?? "",
      designation,
      groupId: trustee.group_id ?? "",
      memberId: trustee.member_id,
      phone: seat?.contact_phone ?? trustee.contact_phone ?? "",
      email: seat?.contact_email ?? trustee.contact_email ?? "",
    })
    setDialog({ open: true, editing: trustee, seat })
  }

  const pickMember = (memberId: string) => {
    if (memberId === NONE) {
      setForm((s) => ({ ...s, memberId: "" }))
      return
    }
    const member = (groupMembers.data?.members ?? []).find((m) => m.id === memberId)
    const designation = DESIGNATIONS.some((item) => item.value === member?.group_designation)
      ? member!.group_designation!
      : null
    setForm((s) => ({
      ...s,
      memberId,
      firstName: member?.first_name || s.firstName,
      lastName: member?.last_name || s.lastName,
      phone: member?.contact_phone || member?.phone_number || s.phone,
      email: member?.contact_email || member?.email || s.email,
      designation: designation ?? s.designation,
    }))
  }

  const save = async () => {
    if (!form.firstName.trim() || !form.groupId) return
    // A post holder without a member never reaches the trustee listing, so a
    // new post holder has to be linked to one.
    if (!dialog.editing && !form.memberId) {
      toast.error("Pick the member of the group who holds this post.")
      return
    }
    setSaving(true)
    const seatPayload = {
      group_id: form.groupId,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      designation: form.designation || "post_holder",
      member_id: form.memberId || null,
      contact_phone: form.phone.trim() || null,
      contact_email: form.email.trim() || null,
    }
    try {
      // The seat holds the term and the post; the API mirrors the designation
      // onto the member, so the listing follows.
      if (dialog.seat) {
        await updatePostHolder(dialog.seat.id, seatPayload)
      } else {
        await createPostHolder(seatPayload)
      }
      // The member carries the name and the contact the listing shows. The seat
      // is already saved, so a failure here must not invite a duplicate retry.
      if (form.memberId) {
        try {
          await updateMember(form.memberId, {
            first_name: seatPayload.first_name,
            last_name: seatPayload.last_name,
            contact_phone: seatPayload.contact_phone,
            contact_email: seatPayload.contact_email,
          })
        } catch (error) {
          toast.warning("Post holder saved, but the member details were not updated", {
            description:
              (error instanceof ApiError ? (error.detail ?? error.message) : null) ?? undefined,
          })
        }
      }
      toast.success(
        dialog.editing
          ? `${seatPayload.first_name} updated`
          : `${seatPayload.first_name} added`
      )
      setDialog({ open: false, editing: null, seat: null })
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the post holder.", {
        description: (error instanceof ApiError ? error.detail : null) ?? undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const seat = seatByMember[seatKey(deleting.group_id, deleting.member_id)]
    try {
      if (seat) {
        // Removing the seat clears the designation the member carried, so the
        // post holder leaves the listing.
        await removePostHolder(seat.id)
      } else {
        await clearMemberDesignation(deleting.member_id)
      }
      toast.success(`${deleting.full_name || "Post holder"} removed`)
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the post holder.", {
        description: (error instanceof ApiError ? error.detail : null) ?? undefined,
      })
    }
  }

  const columns: Column<MemberTrusteeRecord>[] = [
    {
      id: "name",
      header: "Post holder",
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {t.profile_photo_url && <AvatarImage src={t.profile_photo_url} alt={t.full_name} />}
            <AvatarFallback>{initials(t.full_name) || "?"}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{t.full_name || "—"}</p>
            <Badge variant="secondary" className="font-normal">
              {t.designation ? designationLabel(t.designation) : "—"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: "group",
      header: "Group",
      cell: (t) => t.group_name ?? (t.group_id ? groupMap[t.group_id] ?? t.group_id : "—"),
    },
    { id: "city", header: "City", cell: (t) => t.city || "—" },
    {
      id: "contact",
      header: "Contact",
      cell: (t) => [t.contact_phone, t.contact_email].filter(Boolean).join(" · ") || "—",
    },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(t)} aria-label="Edit">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(t)} aria-label="Delete">
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Holder Management"
        description="Manage the post holders of each social group and the offices they hold"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Add Post Holder
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:max-w-sm">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {query || groupId ? "Post holders" : "Total post holders"}
              </p>
              <p className="font-heading text-xl font-semibold">{counts.data?.total ?? "…"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {list.error && (
        <Card size="sm" className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-sm text-destructive">{list.error.message}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={list.data?.trustees ?? []}
        loading={list.loading}
        rowKey={(t) => t.id}
        searchPlaceholder="Search by name, designation, membership number…"
        filters={[
          {
            key: "group_id",
            label: "Group",
            options: (groups.data ?? []).map((g) => ({ label: g.name, value: g.id })),
          },
        ]}
        pageSize={PAGE_SIZE}
        currentPage={page}
        total={list.data?.total}
        onPageChange={setPage}
        onSearchChange={setSearchInput}
        onFilterChange={changeFilter}
        emptyTitle="No post holders found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Post Holder" : "Add Post Holder"}</DialogTitle>
            <DialogDescription>Update the post holder directory information.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Social group" required>
              <Select
                value={form.groupId || NONE}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, groupId: v === NONE ? "" : v, memberId: "" }))
                }
                disabled={!!dialog.editing?.group_id}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {(groups.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="Member directory"
              required={!dialog.editing}
              hint="Pick the member of the group who holds this post"
            >
              <Select
                value={form.memberId || NONE}
                onValueChange={pickMember}
                disabled={!form.groupId || !!dialog.editing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.groupId ? "Select member" : "Select a group first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not linked</SelectItem>
                  {(groupMembers.data?.members ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name || m.membership_number || m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="First name" required>
              <Input value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} placeholder="e.g. Rajesh" />
            </FormField>
            <FormField label="Last name">
              <Input value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} placeholder="e.g. Shah" />
            </FormField>
            <FormField label="Designation" required>
              <Select
                value={form.designation}
                onValueChange={(value) => setForm((s) => ({ ...s, designation: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((designation) => (
                    <SelectItem key={designation.value} value={designation.value}>
                      {designation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
            </FormField>
            <FormField label="Email">
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.firstName.trim() || !form.groupId || (!dialog.editing && !form.memberId)}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove post holder"
        description={`Remove ${deleting?.full_name || "this post holder"} from the post holder directory?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
