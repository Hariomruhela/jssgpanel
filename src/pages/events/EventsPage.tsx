import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { useData } from "@/lib/useData"
import { formatDate } from "@/lib/format"
import { safePercent } from "@/lib/format"
import type { CommunityEvent } from "@/types"
import { createEvent, getEvents, removeEvent, updateEvent, type EventInput } from "@/services/api/events"
import { getGroups } from "@/services/api/groups"

const EVT_CATEGORIES = ["Religious", "Seva", "Cultural", "Educational", "Health", "Social", "Community Meet", "Environmental"]
const EVT_STATUSES: CommunityEvent["status"][] = ["upcoming", "ongoing", "completed", "cancelled"]

const DEFAULT_FORM: EventInput = {
  title: "",
  category: "Community Meet",
  date: new Date().toISOString().slice(0, 10),
  time: "10:00 AM",
  location: "",
  city: "",
  organizerId: "",
  capacity: 100,
  status: "upcoming",
  description: "",
}

export default function EventsPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const events = useData(useCallback(() => getEvents(), []))
  const groupMap = useMemo(() => Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])), [groups.data])

  const [dialog, setDialog] = useState<{ open: boolean; editing: CommunityEvent | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<CommunityEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EventInput>(DEFAULT_FORM)

  const summary = useMemo(() => {
    const all = events.data ?? []
    const status = (s: CommunityEvent["status"]) => all.filter((e) => e.status === s).length
    return { upcoming: status("upcoming"), ongoing: status("ongoing"), completed: status("completed") }
  }, [events.data])

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null })
  }

  const openEdit = (e: CommunityEvent) => {
    setForm({
      title: e.title, category: e.category, date: e.date, time: e.time, location: e.location,
      city: e.city, organizerId: e.organizerId, capacity: e.capacity, status: e.status, description: e.description,
    })
    setDialog({ open: true, editing: e })
  }

  const save = async () => {
    if (!form.title.trim() || !form.organizerId) return
    setSaving(true)
    try {
      if (dialog.editing) {
        await updateEvent(dialog.editing.id, form)
        toast.success("Event updated")
      } else {
        await createEvent(form)
        toast.success("Event created")
      }
      events.reload()
      setDialog({ open: false, editing: null })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await removeEvent(deleting.id)
    toast.success("Event removed")
  }

  const columns: Column<CommunityEvent>[] = [
    {
      id: "title",
      header: "Event",
      cell: (e) => (
        <div className="max-w-72">
          <p className="truncate font-medium">{e.title}</p>
          <p className="truncate text-xs text-muted-foreground">{e.category} · {groupMap[e.organizerId] ?? e.organizerId}</p>
        </div>
      ),
    },
    {
      id: "when",
      header: "When",
      cell: (e) => (
        <div className="leading-tight">
          <p>{formatDate(e.date)}</p>
          <p className="text-xs text-muted-foreground">{e.time}</p>
        </div>
      ),
    },
    {
      id: "where",
      header: "Where",
      cell: (e) => (
        <div className="flex max-w-56 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{e.location}, {e.city}</span>
        </div>
      ),
    },
    {
      id: "attendance",
      header: "Attendance",
      cell: (e) => (
        <div>
          <p>
            {e.attendeeCount}/{e.capacity}
          </p>
          <p className="text-xs text-muted-foreground">{safePercent(e.attendeeCount, e.capacity)}% filled</p>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(e)} aria-label="Edit">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(e)} aria-label="Delete">
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events Management"
        description="Create and manage community events and activities"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryMini icon={<CalendarDays className="size-4" />} label="Upcoming" value={events.data ? summary.upcoming : "…"} tone="text-sky-600 bg-sky-500/10" />
        <SummaryMini icon={<CalendarDays className="size-4" />} label="Ongoing" value={events.data ? summary.ongoing : "…"} tone="text-amber-600 bg-amber-500/10" />
        <SummaryMini icon={<CalendarDays className="size-4" />} label="Completed" value={events.data ? summary.completed : "…"} tone="text-emerald-600 bg-emerald-500/10" />
      </div>

      <DataTable
        columns={columns}
        data={events.data ?? []}
        loading={events.loading}
        rowKey={(e) => e.id}
        searchKeys={(e) => `${e.title} ${e.category} ${e.location} ${e.city} ${groupMap[e.organizerId] ?? ""}`}
        searchPlaceholder="Search events…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: EVT_STATUSES.map((s) => ({ label: s, value: s })),
          },
          {
            key: "city",
            label: "City",
            options: [...new Set((events.data ?? []).map((e) => e.city))].map((c) => ({ label: c, value: c })),
          },
        ]}
        emptyTitle="No events found"
        emptyDescription="Try adjusting your search or filters."
        pageSize={8}
      />

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Event" : "Add Event"}</DialogTitle>
            <DialogDescription>Create or update a community event.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Event title" required className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Community Blood Donation Camp" />
            </FormField>
            <FormField label="Category">
              <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as CommunityEvent["status"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date">
              <DateInput value={form.date} onChange={(v) => setForm((s) => ({ ...s, date: v }))} />
            </FormField>
            <FormField label="Time">
              <Input value={form.time} onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))} />
            </FormField>
            <FormField label="Organising group" required>
              <Select value={form.organizerId} onValueChange={(v) => setForm((s) => ({ ...s, organizerId: v }))}>
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
            <FormField label="Capacity">
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((s) => ({ ...s, capacity: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </FormField>
            <FormField label="Location" className="sm:col-span-2">
              <Input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} placeholder="Venue name" />
            </FormField>
            <FormField label="City" className="sm:col-span-2">
              <Input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <Textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.organizerId}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete event"
        description={`Remove "${deleting?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function SummaryMini({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label} events</p>
        <p className="font-heading text-xl font-semibold">{value}</p>
      </div>
    </div>
  )
}