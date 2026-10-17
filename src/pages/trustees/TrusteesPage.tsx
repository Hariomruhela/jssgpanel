import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { useData } from "@/lib/useData"
import { formatDate, initials } from "@/lib/format"
import type { Trustee } from "@/types"
import { createTrustee, getTrustees, removeTrustee, updateTrustee, type TrusteeInput } from "@/services/api/trustees"
import { getGroups } from "@/services/api/groups"

const DESIGNATIONS: Trustee["designation"][] = ["President", "Vice President", "Secretary", "Joint Secretary", "Treasurer", "Trustee Member"]

const DEFAULT_FORM: TrusteeInput = {
  name: "",
  designation: "Trustee Member",
  groupId: "",
  city: "",
  phone: "",
  email: "",
  tenureFrom: "",
  tenureTo: "",
  status: "active",
}

export default function TrusteesPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const trustees = useData(useCallback(() => getTrustees(), []))
  const groupMap = useMemo(() => Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])), [groups.data])

  const [dialog, setDialog] = useState<{ open: boolean; editing: Trustee | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<Trustee | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TrusteeInput>(DEFAULT_FORM)

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null })
  }

  const openEdit = (t: Trustee) => {
    setForm({
      name: t.name, designation: t.designation, groupId: t.groupId, city: t.city,
      phone: t.phone, email: t.email, tenureFrom: t.tenureFrom, tenureTo: t.tenureTo, status: t.status,
    })
    setDialog({ open: true, editing: t })
  }

  const save = async () => {
    if (!form.name.trim() || !form.groupId) return
    setSaving(true)
    try {
      if (dialog.editing) {
        await updateTrustee(dialog.editing.id, form)
        toast.success(`${form.name} updated`)
      } else {
        await createTrustee(form)
        toast.success(`${form.name} added`)
      }
      trustees.reload()
      setDialog({ open: false, editing: null })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await removeTrustee(deleting.id)
    toast.success(`${deleting.name} removed`)
  }

  const columns: Column<Trustee>[] = [
    {
      id: "name",
      header: "Office bearer",
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials(t.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{t.name}</p>
            <Badge variant="secondary" className="font-normal">
              {t.designation}
            </Badge>
          </div>
        </div>
      ),
    },
    { id: "group", header: "Group", cell: (t) => groupMap[t.groupId] ?? t.groupId },
    { id: "city", header: "City", cell: (t) => t.city },
    { id: "contact", header: "Contact", cell: (t) => `${t.phone} · ${t.email}` },
    { id: "tenure", header: "Tenure", cell: (t) => `${formatDate(t.tenureFrom)} – ${formatDate(t.tenureTo)}` },
    { id: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
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
        title="Trustee Management"
        description="Manage trustee and office bearer information for each social group"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Office Bearer
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total office bearers</p>
              <p className="font-heading text-xl font-semibold">{trustees.data?.length ?? "…"}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Landmark className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Presidents</p>
              <p className="font-heading text-xl font-semibold">
                {trustees.data?.filter((t) => t.designation === "President").length ?? "…"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Landmark className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="font-heading text-xl font-semibold">
                {trustees.data?.filter((t) => t.status === "active").length ?? "…"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={trustees.data ?? []}
        loading={trustees.loading}
        rowKey={(t) => t.id}
        searchKeys={(t) => `${t.name} ${t.designation} ${groupMap[t.groupId] ?? ""} ${t.city} ${t.email}`}
        searchPlaceholder="Search by name, designation, group…"
        filters={[
          {
            key: "groupId",
            label: "Group",
            options: (groups.data ?? []).map((g) => ({ label: g.name, value: g.id })),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        emptyTitle="No office bearers found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Office Bearer" : "Add Office Bearer"}</DialogTitle>
            <DialogDescription>Update trustee directory information.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full name" required>
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Rajesh Shah" />
            </FormField>
            <FormField label="Designation" required>
              <Select value={form.designation} onValueChange={(v) => setForm((s) => ({ ...s, designation: v as Trustee["designation"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Social group" required>
              <Select value={form.groupId} onValueChange={(v) => setForm((s) => ({ ...s, groupId: v }))}>
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
            <FormField label="City">
              <Input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
            </FormField>
            <FormField label="Email">
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </FormField>
            <FormField label="Tenure from">
              <DateInput value={form.tenureFrom} onChange={(v) => setForm((s) => ({ ...s, tenureFrom: v }))} />
            </FormField>
            <FormField label="Tenure to">
              <DateInput value={form.tenureTo} onChange={(v) => setForm((s) => ({ ...s, tenureTo: v }))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as Trustee["status"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.groupId}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove office bearer"
        description={`Remove ${deleting?.name} from the trustee directory?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}