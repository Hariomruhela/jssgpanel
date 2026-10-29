import { useCallback, useState } from "react"
import { toast } from "sonner"
import { MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { getErrorMessage } from "@/lib/apiClient"
import type { City } from "@/types"
import { getCities, getGroupsByCity, updateCity } from "@/services/api/locations"
import { getGroups } from "@/services/api/groups"

export default function LocationsPage() {
  const cities = useData(useCallback(() => getCities(), []))
  const groups = useData(useCallback(() => getGroups(), []))
  const [editing, setEditing] = useState<City | null>(null)
  const [viewCity, setViewCity] = useState<City | null>(null)
  const [viewGroups, setViewGroups] = useState<{ loading: boolean; data: unknown[] }>({ loading: false, data: [] })
  const [form, setForm] = useState({ state: "", region: "", status: "active" as City["status"] })
  const [saving, setSaving] = useState(false)

  const openEdit = (c: City) => {
    setForm({ state: c.state, region: c.region, status: c.status })
    setEditing(c)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateCity(editing.id, form)
      toast.success("Location updated successfully")
      cities.reload()
      setEditing(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update location."))
    } finally {
      setSaving(false)
    }
  }

  const openView = async (c: City) => {
    setViewCity(c)
    setViewGroups({ loading: true, data: [] })
    const data = await getGroupsByCity(c.id)
    setViewGroups({ loading: false, data })
  }

  const columns: Column<City>[] = [
    {
      id: "city",
      header: "City",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <MapPin className="size-4 text-muted-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.state}</p>
          </div>
        </div>
      ),
    },
    { id: "region", header: "Region", cell: (c) => c.region },
    { id: "groups", header: "Groups", cell: (c) => c.groupCount },
    { id: "members", header: "Members", cell: (c) => c.memberCount },
    { id: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openView(c)}>
            View groups
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)} aria-label="Edit">
            <Pencil />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location Management"
        description="Manage cities, regions and their associated social groups"
        meta={
          <p className="text-xs text-muted-foreground">
            {(groups.data ?? []).length} social groups across {(cities.data ?? []).length} cities
          </p>
        }
      />

      <DataTable
        columns={columns}
        data={cities.data ?? []}
        loading={cities.loading}
        rowKey={(c) => c.id}
        searchKeys={(c) => `${c.name} ${c.state} ${c.region}`}
        searchPlaceholder="Search cities…"
        filters={[
          { key: "region", label: "Region", options: ["West", "North", "Central", "South"].map((r) => ({ label: r, value: r })) },
        ]}
        emptyTitle="No locations found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>Update location details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="State">
              <Input value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} />
            </FormField>
            <FormField label="Region">
              <Input value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))} />
            </FormField>
            <FormField label="Status" className="sm:col-span-2">
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as City["status"] }))}>
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
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCity} onOpenChange={(open) => !open && setViewCity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Groups in {viewCity?.name}</DialogTitle>
            <DialogDescription>
              Nearby groups associated with this city location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {viewGroups.loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : viewGroups.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No groups in this city.</p>
            ) : (
              viewGroups.data.map((g) => {
                const grp = g as { id: string; name: string; city: string; memberCount: number }
                return (
                  <div key={grp.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{grp.name}</p>
                      <p className="text-xs text-muted-foreground">{grp.city}</p>
                    </div>
                    <p className="text-sm">{grp.memberCount} members</p>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}