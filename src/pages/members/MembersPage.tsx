import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/apiClient"
import {
  BadgeCheck,
  Eye,
  KeyRound,
  Lock,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useData } from "@/lib/useData"
import { useLanguage } from "@/lib/language"
import { formatDate, initials } from "@/lib/format"
import type { MemberRecord } from "@/types"
import { getMemberGroups, getMemberLocations, getMember, getMembers, getMembershipCounts, removeMember } from "@/services/api/members"
import { useAuth } from "@/lib/auth"
import { ApiSignInDialog } from "./ApiSignInDialog"
import { MemberFormDialog } from "./MemberFormDialog"
import { MemberViewDialog } from "./MemberViewDialog"
import { RoleDialog } from "./RoleDialog"

const PAGE_SIZE = 20

function memberPhoto(member: MemberRecord): string | null {
  return member.profile_photo_url || member.member_photo_link || null
}

export default function MembersPage() {
  const { user } = useAuth()
  const { t, h } = useLanguage()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [groupName, setGroupName] = useState("")
  const [version, setVersion] = useState(0)

  const list = useData(
    useCallback(
      () => getMembers({ page, pageSize: PAGE_SIZE, query, groupName }),
      [page, query, groupName]
    ),
    version
  )
  const counts = useData(useCallback(() => getMembershipCounts(), []), version)
  const options = useData(
    useCallback(
      () =>
        Promise.all([getMemberGroups(), getMemberLocations()]).then(
          ([groups, locations]) => ({ groups, locations })
        ),
      []
    ),
    version
  )

  const [signInOpen, setSignInOpen] = useState(false)
  const [formDialog, setFormDialog] = useState<{ open: boolean; editing: MemberRecord | null }>({
    open: false,
    editing: null,
  })
  const [formVersion, setFormVersion] = useState(0)
  const [viewing, setViewing] = useState<MemberRecord | null>(null)
  const [roleMember, setRoleMember] = useState<MemberRecord | null>(null)
  const [deleting, setDeleting] = useState<MemberRecord | null>(null)
  const [busy, setBusy] = useState(false)

  const signedIn = user !== null
  const refresh = () => setVersion((v) => v + 1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setQuery(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const changeFilter = (key: string, value: string) => {
    if (key === "groupName") {
      setPage(1)
      setGroupName(value === "all" ? "" : value)
    }
  }

  const openCreate = () => {
    setFormVersion((v) => v + 1)
    setFormDialog({ open: true, editing: null })
  }

  const openEdit = (member: MemberRecord) => {
    setFormVersion((v) => v + 1)
    setViewing(null)
    setFormDialog({ open: true, editing: member })
  }

  const requireSignIn = () => {
    if (!signedIn) setSignInOpen(true)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await removeMember(deleting.id)
      toast.success(t("Member deleted successfully"))
      setDeleting(null)
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not delete the member."), {
        description: (error instanceof ApiError ? error.detail : null) ?? undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const groupById = useMemo(
    () =>
      Object.fromEntries((options.data?.groups ?? []).map((g) => [g.id, g.name])) as Record<
        string,
        string
      >,
    [options.data?.groups]
  )

  /** The linked group wins, then the free-text name carried by sheet imports. */
  const groupLabel = (m: MemberRecord) =>
    (m.group_id ? groupById[m.group_id] : null) || m.social_group_name || "—"

  const viewMember = async (member: MemberRecord) => {
    // Keep the label resolution from the row: the linked group wins over the free-text name.
    const labelled: MemberRecord = {
      ...member,
      social_group_name: groupLabel(member) === "—" ? null : groupLabel(member),
    }
    setViewing(labelled)
    try {
      // GET /members/{id} answers with the full list-item shape; merge it over the row anyway
      // so a partial response never blanks out what the table already showed.
      const detail = await getMember(member.id)
      setViewing({ ...labelled, ...detail } as MemberRecord)
    } catch {
      // fall back to the list row, which already carries every displayed field
    }
  }

  const columns: Column<MemberRecord>[] = [
    {
      id: "member",
      header: t("Member"),
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {memberPhoto(m) && <AvatarImage src={memberPhoto(m) as string} alt={m.full_name} />}
            <AvatarFallback>{initials(m.full_name) || "?"}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{h(m.full_name)}</p>
            <p className="text-xs text-muted-foreground">{m.email || m.user?.email || "—"}</p>
          </div>
        </div>
      ),
    },
    { id: "group", header: t("Group"), cell: (m) => h(groupLabel(m)) },
    { id: "role", header: t("Role"), cell: (m) => m.user?.role?.name ?? "—" },
    { id: "city", header: t("City"), cell: (m) => [h(m.city), h(m.area)].filter(Boolean).join(", ") || "—" },
    { id: "phone", header: t("Phone"), cell: (m) => m.phone_number || "—" },
    { id: "family", header: t("Family"), cell: (m) => m.family_member_count || "0" },
    { id: "joined", header: t("Joined"), cell: (m) => formatDate(m.joined_at ?? m.created_at) },
    {
      id: "actions",
      header: "",
      className: "text-right",
      headClassName: "text-right",
      cell: (m) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => viewMember(m)} aria-label={t("View")}>
            <Eye />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => (signedIn ? setRoleMember(m) : requireSignIn())}
            aria-label={t("Change role")}
            title={m.user ? t("Change login role") : t("No login account")}
          >
            <KeyRound />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => (signedIn ? openEdit(m) : requireSignIn())}
            aria-label={t("Edit")}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => (signedIn ? setDeleting(m) : requireSignIn())}
            aria-label={t("Delete")}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  /** Groups from the groups API only. */
  const groupOptions = [
    ...(options.data?.groups ?? []).map((g) => g.name),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name }))

  const filters = [
    ...(groupOptions.length > 0 ? [{ key: "groupName", label: t("Group"), options: groupOptions }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Member Management")}
        description={t("Browse the JSSG member directory and manage member records")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw />
              {t("Refresh")}
            </Button>
            <Button onClick={signedIn ? openCreate : requireSignIn}>
              <Plus />
              {t("Add member")}
            </Button>
          </>
        }
        meta={
          user ? (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1.5">
                <BadgeCheck className="size-3 text-emerald-600" />
                {user.full_name}
                {user.role ? ` · ${user.role.name}` : ""}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1.5">
                <Lock className="size-3" />
                {t("Read-only")}
              </Badge>
              <Button variant="ghost" size="xs" onClick={() => setSignInOpen(true)}>
                <LogIn />
                {t("Sign in to manage members")}
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {query || groupName ? t("Members found") : t("Total members")}
              </p>
              <p className="font-heading text-xl font-semibold">{list.data ? list.data.total : "…"}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Users className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Approved members")}</p>
              <p className="font-heading text-xl font-semibold">{counts.data ? counts.data.approved : "…"}</p>
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
              {t("Retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={list.data?.members ?? []}
        loading={list.loading}
        rowKey={(m) => m.id}
        searchKeys={(m) =>
          [
            m.id,
            m.membership_number,
            m.full_name,
            m.first_name,
            m.middle_name,
            m.last_name,
            m.email,
            m.phone_number,
            m.contact_phone,
            m.contact_email,
            m.spouse_name,
            m.spouse_mobile,
            m.group_id ? groupById[m.group_id] : null,
            m.social_group_name,
            m.city,
            m.area,
            m.address,
            m.address_line,
            m.business_address,
            m.gender,
            m.blood_group,
            m.member_occupation,
            m.company_name,
            m.group_designation,
            m.interest_fields,
            m.family_member_count?.toString(),
          ]
            .filter(Boolean)
            .join(" ")
        }
        searchPlaceholder={t("Search members…")}
        filters={filters}
        pageSize={PAGE_SIZE}
        currentPage={page}
        total={list.data?.total}
        onPageChange={setPage}
        onSearchChange={setSearchInput}
        onFilterChange={changeFilter}
        emptyTitle={t("No members found")}
        emptyDescription={t("Try adjusting your search or filters, or add a new member.")}
      />

      <ApiSignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSignedIn={() => {
          refresh()
        }}
      />

      <MemberFormDialog
        key={formVersion}
        open={formDialog.open}
        editing={formDialog.editing}
        signedIn={signedIn}
        groups={options.data?.groups ?? []}
        locations={options.data?.locations ?? []}
        onOpenChange={(open) => setFormDialog((s) => ({ ...s, open }))}
        onSaved={() => refresh()}
        onRequireSignIn={() => setSignInOpen(true)}
      />

      <MemberViewDialog member={viewing} onOpenChange={(open) => !open && setViewing(null)} onEdit={openEdit} />

      {/* Keyed by member so the dialog's role and group pickers start from that member. */}
      <RoleDialog
        key={roleMember?.id ?? "closed"}
        member={roleMember}
        onOpenChange={(open) => !open && setRoleMember(null)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("Delete member")}
        description={t(
          "Are you sure you want to delete this member? {name} This removes the member record and cannot be undone.",
          { name: deleting?.full_name ?? "" }
        )}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
