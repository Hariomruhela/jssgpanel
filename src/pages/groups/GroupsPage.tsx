import { useCallback, useEffect, memo, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"
import { ApiError } from "@/lib/apiClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { SearchableSelect } from "@/components/SearchableSelect"
import { useData } from "@/lib/useData"
import { initials } from "@/lib/format"
import type { GroupInput, GroupRecord } from "@/types"
import { getGeoStateCities, getGeoStates, type GeoCity } from "@/services/api/geo"
import {
  addGroupMember,
  createGroup,
  getAllGroups,
  getGroupMembers,
  removeGroup,
  updateGroup,
  uploadGroupImage,
} from "@/services/api/groups"
import {
  getMemberLocations,
  getMembers,
  updateMember,
} from "@/services/api/members"
import { GroupMembersDialog } from "./GroupMembersDialog"
import { GroupMembersInline } from "./GroupMembersInline"

const PAGE_SIZE = 20

const DEFAULT_FORM: GroupInput = {
  name: "",
  name_hi: "",
  description: "",
  contact_name: "",
  contact_phone: "",
  address: "",
  city: "",
  state: "",
  logo_url: "",
  status: "ACTIVE",
  is_active: true,
  location_id: "",
}

/**
 * A row of the group directory: either a managed `social_groups` row or a
 * directory-only name that members carry as free text (`profile_data`).
 */
interface DirectoryGroup {
  key: string
  name: string
  /** `group` is null for a directory-only entry. */
  group: GroupRecord | null
  status: string
}

function errorMessage(error: unknown, fallback: string): { message: string; description?: string } {
  if (error instanceof ApiError) return { message: error.message, description: error.detail ?? undefined }
  return { message: error instanceof Error ? error.message : fallback }
}

/**
 * Names arrive from sheets and manual entry, so the same group shows up as
 * "Jssg professional unity", "JSSG PROFESSIONAL UNITY", … Trimming and
 * case-folding gives one key per real group; a name that only differs by case
 * or padding is the same group, while "…unity" and "…unity group" stay apart.
 */
function normalizeGroupName(name: string): string {
  return name.trim().toLowerCase()
}

function GroupsPage() {
  const [version, setVersion] = useState(0)

  // Groups from the groups API only.
  const source = useData(
    useCallback(async (): Promise<{ groups: GroupRecord[]; memberNames: string[] }> => {
      const groups = await getAllGroups()
      return { groups, memberNames: [] }
    }, []),
    version
  )
  const locations = useData(useCallback(() => getMemberLocations(), []))

  const [dialog, setDialog] = useState<{ open: boolean; editing: GroupRecord | null }>({
    open: false,
    editing: null,
  })
  // The row being confirmed for deletion. `group` is null for a name that only
  // lives in member records, which is deleted by clearing that name.
  const [deleting, setDeleting] = useState<DirectoryGroup | null>(null)
  const [membersOf, setMembersOf] = useState<GroupRecord | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  // A directory-only row while its real group is being created, so its row's
  // buttons can show a spinner and ignore a second click.
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<GroupInput>(DEFAULT_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const states = useData(useCallback(() => getGeoStates(), []))
  const cities = useData(
    useCallback(async () => {
      const state = form.state?.trim()
      if (!state) return { state: "", items: [] as GeoCity[] }
      return { state, items: await getGeoStateCities(state) }
    }, [form.state])
  )

  const stateOptions = useMemo(() => {
    const options = (states.data ?? []).map((state) => state.name)
    const current = form.state?.trim()
    return current && !options.includes(current) ? [current, ...options] : options
  }, [states.data, form.state])

  const cityOptions = useMemo(() => {
    const loaded = cities.data
    const options =
      loaded && loaded.state === form.state
        ? [...new Set(loaded.items.map((city) => city.name))]
        : []
    const current = form.city?.trim()
    return current && !options.includes(current) ? [current, ...options] : options
  }, [cities.data, form.state, form.city])

  const citiesLoading =
    !!form.state?.trim() &&
    (cities.loading || cities.data?.state !== form.state)

  const refresh = () => setVersion((v) => v + 1)

  const directory = useMemo<DirectoryGroup[]>(() => {
    const groups = source.data?.groups ?? []
    const entries = new Map<string, DirectoryGroup>()
    // Stored groups first, so a managed group always wins over a member-derived
    // name that normalizes to the same thing.
    for (const group of groups) {
      const name = group.name.trim()
      const key = normalizeGroupName(name)
      if (!key || entries.has(key)) continue
      entries.set(key, { key: group.id, name, group, status: group.status || "ACTIVE" })
    }
    // Then the free-text names members carry. Only names with no managed group
    // already claiming the same normalized key become directory-only rows.
    for (const rawName of source.data?.memberNames ?? []) {
      const name = rawName.trim()
      const key = normalizeGroupName(name)
      if (!key || entries.has(key)) continue
      entries.set(key, { key: `member:${key}`, name, group: null, status: "ACTIVE" })
    }
    return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [source.data])

  // A member count per row: linked members for a managed group, members whose
  // free-text group name matches for a directory-only entry.
  useEffect(() => {
    if (!directory.length) return
    let active = true
    Promise.all(
      directory.map(async (entry): Promise<[string, number]> => {
        try {
          const total = entry.group
            ? (await getGroupMembers(entry.group.id, { pageSize: 1 })).total
            : (await getMembers({ groupName: entry.name, pageSize: 1 })).total
          return [entry.key, total]
        } catch {
          return [entry.key, 0]
        }
      })
    ).then((pairs) => active && setMemberCounts(Object.fromEntries(pairs)))
    return () => {
      active = false
    }
  }, [directory])

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const pickImage = (file: File | null | undefined) => {
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const openCreate = (name = "") => {
    clearImage()
    setForm({ ...DEFAULT_FORM, name })
    setDialog({ open: true, editing: null })
  }

  const openEdit = (group: GroupRecord) => {
    clearImage()
    setForm({
      name: group.name,
      name_hi: group.name_hi ?? "",
      description: group.description ?? "",
      contact_name: group.contact_name ?? "",
      contact_phone: group.contact_phone ?? "",
      address: group.address ?? "",
      city: group.city ?? "",
      state: group.state ?? "",
      logo_url: group.logo_url ?? "",
      status: group.status || "ACTIVE",
      is_active: group.is_active,
      location_id: group.location_id ?? "",
    })
    setDialog({ open: true, editing: group })
  }

  const save = async () => {
    if (!form.name.trim()) return
    if (!form.city?.trim() || !form.state?.trim()) {
      toast.error("City and state are required.")
      return
    }
    setSaving(true)
    try {
      const payload: GroupInput = {
        ...form,
        name: form.name.trim(),
        name_hi: form.name_hi?.trim() || null,
        description: form.description?.trim() || null,
        contact_name: form.contact_name?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        logo_url: form.logo_url?.trim() || null,
        location_id: form.location_id?.trim() || null,
      }
      const saved = dialog.editing
        ? await updateGroup(dialog.editing.id, payload)
        : await createGroup(payload)
      toast.success(`${payload.name} ${dialog.editing ? "updated" : "created"}`)

      // The image needs the group's id, so it uploads after the row exists.
      if (imageFile) {
        try {
          const url = await uploadGroupImage(saved.id, imageFile)
          await updateGroup(saved.id, { logo_url: url })
        } catch (uploadError) {
          const detail = errorMessage(uploadError, "Could not upload the group image.")
          toast.error("Group saved, but the image failed to upload", {
            description: detail.description ?? detail.message,
          })
        }
      }

      clearImage()
      refresh()
      setDialog({ open: false, editing: null })
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not save the group.")
      toast.error(message, { description })
    } finally {
      setSaving(false)
    }
  }

  /**
   * A row that only exists as a free-text name in member records gets a real
   * `social_groups` row the first time it is edited or opened for member
   * management. Members already carrying that name (and not in any other group)
   * are linked so the count the row showed is preserved; no member record is
   * created or destroyed.
   */
  const ensureGroup = async (entry: DirectoryGroup): Promise<GroupRecord> => {
    if (entry.group) return entry.group
    const created = await createGroup({
      name: entry.name.trim(),
      name_hi: null,
      description: null,
      contact_name: null,
      contact_phone: null,
      address: null,
      city: "",
      state: "",
      logo_url: null,
      status: "ACTIVE",
      is_active: true,
      location_id: null,
    })
    let page = 1
    let totalPages = 1
    do {
      const result = await getMembers({ groupName: entry.name, pageSize: 100, page })
      for (const member of result.members) {
        if (member.group_id) continue
        try {
          await addGroupMember(created.id, member.id)
        } catch {
          // A member that cannot be moved stays in its current group.
        }
      }
      totalPages = result.totalPages
      page += 1
    } while (page <= totalPages)
    return created
  }

  /** Materializes a directory-only row on demand, then runs the intended action. */
  const withGroup = async (entry: DirectoryGroup, action: (group: GroupRecord) => void) => {
    if (entry.group) {
      action(entry.group)
      return
    }
    setBusyKey(entry.key)
    try {
      const group = await ensureGroup(entry)
      refresh()
      action(group)
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not prepare the group.")
      toast.error(message, { description })
    } finally {
      setBusyKey(null)
    }
  }

  /**
   * Deleting a name that only lives in member records removes that name from
   * every member carrying it. Members themselves are never deleted.
   */
  const clearFreeTextGroup = async (name: string): Promise<number> => {
    const ids: string[] = []
    let page = 1
    let totalPages = 1
    do {
      const result = await getMembers({ groupName: name, pageSize: 100, page })
      ids.push(...result.members.map((member) => member.id))
      totalPages = result.totalPages
      page += 1
    } while (page <= totalPages)
    for (const id of ids) {
      await updateMember(id, { social_group_name: null })
    }
    return ids.length
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const entry = deleting
    setDeleting(null)
    try {
      if (entry.group) {
        await removeGroup(entry.group.id)
        toast.success(`${entry.name} removed`)
      } else {
        const cleared = await clearFreeTextGroup(entry.name)
        toast.success(
          `${entry.name} removed from ${cleared} member${cleared === 1 ? "" : "s"}`
        )
      }
      refresh()
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not delete the group.")
      toast.error(message, { description })
    }
  }

  // The API stores city/state on the group itself; show them in the table. For
  // older rows without those fields, fall back to the city/state of the linked
  // location (and only then to the location name).
  const groupLocation = (group: GroupRecord) => {
    const direct = [group.city, group.state].filter(Boolean).join(", ")
    if (direct) return direct
    const location = group.location_id
      ? (locations.data ?? []).find((item) => item.id === group.location_id)
      : undefined
    if (!location) return "—"
    return [location.city, location.state].filter(Boolean).join(", ") || location.name || "—"
  }

  const columns: Column<DirectoryGroup>[] = [
    {
      id: "group",
      header: "Group",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={() => setExpandedKey((key) => (key === row.key ? null : row.key))}
            aria-label={expandedKey === row.key ? "Hide members" : "Show members"}
            aria-expanded={expandedKey === row.key}
          >
            {expandedKey === row.key ? <ChevronDown /> : <ChevronRight />}
          </Button>
          <Avatar size="sm">
            {row.group?.logo_url && <AvatarImage src={row.group.logo_url} alt={row.name} />}
            <AvatarFallback>{initials(row.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.group
                ? row.group.name_hi || row.group.description || row.group.address || "—"
                : "From member records"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "members",
      header: "Members",
      cell: (row) => (
        <span className="font-medium tabular-nums">{memberCounts[row.key] ?? "…"}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: (row) => (row.group ? groupLocation(row.group) : "—"),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      // Every row gets the same three actions. A directory-only row (a name
      // members carry as free text) is materialized as a real group the first
      // time Add Member or Edit is used, then the action runs against it.
      cell: (row) => {
        const busy = busyKey === row.key
        const shared = {
          disabled: busy,
          "aria-busy": busy,
        }
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              {...shared}
              onClick={() => withGroup(row, (group) => setMembersOf(group))}
              aria-label="Add or manage members"
              title="Add or manage members"
            >
              {busy ? <Loader2 className="animate-spin" /> : <UserPlus />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              {...shared}
              onClick={() => withGroup(row, (group) => openEdit(group))}
              aria-label="Edit"
              title="Edit"
            >
              {busy ? <Loader2 className="animate-spin" /> : <Pencil />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => setDeleting(row)}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        )
      },
    },
  ]

  const activeCount = directory.filter((entry) => entry.status === "ACTIVE").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Management"
        description="Create and manage Jain social groups registered with the federation"
        actions={
          <Button onClick={() => openCreate()}>
            <Plus />
            Add Group
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total groups</p>
              <p className="font-heading text-xl font-semibold">
                {source.data ? directory.length : "…"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Building2 className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active groups</p>
              <p className="font-heading text-xl font-semibold">
                {source.data ? activeCount : "…"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {source.error && (
        <Card size="sm" className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-sm text-destructive">{source.error.message}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={directory}
        loading={source.loading}
        rowKey={(row) => row.key}
        searchKeys={(row) => `${row.name} ${row.group?.name_hi ?? ""}`}
        searchPlaceholder="Search group name…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ],
          },
        ]}
        pageSize={PAGE_SIZE}
        expandedRowKey={expandedKey}
        renderExpandedRow={(row) => {
          const group = row.group
          return group ? (
            <GroupMembersInline
              groupId={group.id}
              admins={group.admins}
              onManage={() => setMembersOf(group)}
              reloadKey={version}
            />
          ) : (
            <GroupMembersInline
              groupName={row.name}
              onManage={() => withGroup(row, (g) => setMembersOf(g))}
              reloadKey={version}
            />
          )
        }}
        emptyTitle="No groups found"
        emptyDescription="Try adjusting your search or filters, or add a new group."
      />

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) clearImage()
          setDialog((s) => ({ ...s, open }))
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Group" : "Add Group"}</DialogTitle>
            <DialogDescription>Manage federation social group details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Group name" required className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Mumbai Jain Yuvak Mandal"
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status ?? "ACTIVE"}
                onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Contact name">
              <Input
                value={form.contact_name ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, contact_name: e.target.value }))}
                placeholder="e.g. Asha Shah"
              />
            </FormField>
            <FormField label="Contact phone">
              <Input
                value={form.contact_phone ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, contact_phone: e.target.value }))}
                placeholder="+919876543210"
              />
            </FormField>
            <FormField label="Group image" className="sm:col-span-2" hint="JPG, PNG, WebP or GIF — up to 10 MB.">
              <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {imagePreview || form.logo_url ? (
                    <img
                      src={imagePreview ?? form.logo_url ?? ""}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload />
                    {imageFile || form.logo_url ? "Replace image" : "Upload image"}
                  </Button>
                  {(imageFile || form.logo_url) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearImage()
                        setForm((s) => ({ ...s, logo_url: "" }))
                      }}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    pickImage(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </div>
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={3}
                placeholder="What this group is about…"
              />
            </FormField>
            <FormField label="State" required>
              <Select
                value={form.state ?? ""}
                onValueChange={(state) =>
                  setForm((s) => ({ ...s, state, city: "" }))
                }
                disabled={states.loading && stateOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={states.loading ? "Loading states…" : "Select state"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {states.error && (
                <p className="text-xs text-destructive">
                  Could not load states: {states.error.message}
                </p>
              )}
            </FormField>
            <FormField label="City" required>
              <SearchableSelect
                options={cityOptions.map((city) => ({ value: city, label: city }))}
                value={form.city ?? ""}
                onChange={(city) => setForm((s) => ({ ...s, city }))}
                placeholder={
                  !form.state?.trim()
                    ? "Select state first"
                    : citiesLoading
                      ? "Loading cities…"
                      : cityOptions.length
                        ? "Search and select a city…"
                        : "No cities found"
                }
                searchPlaceholder="Type a city name…"
                emptyText="No city matched."
                disabled={!form.state?.trim() || citiesLoading || cityOptions.length === 0}
              />
              {cities.error && form.state?.trim() && !citiesLoading && (
                <p className="text-xs text-destructive">
                  Could not load cities: {cities.error.message}
                </p>
              )}
            </FormField>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_active ?? true}
                onCheckedChange={(checked) =>
                  setForm((s) => ({ ...s, is_active: checked === true }))
                }
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.city?.trim() || !form.state?.trim()}
            >
              {saving ? <Loader2 className="animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyed by group so the dialog's search and list reset per group. */}
      <GroupMembersDialog
        key={membersOf?.id ?? "closed"}
        group={membersOf}
        onOpenChange={(open) => !open && setMembersOf(null)}
        onChanged={refresh}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete group"
        description={
          deleting?.group
            ? `Remove ${deleting.name} from the federation? This will not delete its members.`
            : `Remove ${deleting?.name ?? ""} from the member records carrying it? Members themselves are not deleted.`
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default memo(GroupsPage)
