import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, Image as ImageIcon, MapPin, Pencil, Plus, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useData } from "@/lib/useData"
import { formatDate } from "@/lib/format"
import type { EventRecord } from "@/types"
import { getEventCounts, getEventTypes, listEvents, removeEvent, endTimeOf } from "@/services/api/events"
import { EventFormDialog } from "./EventFormDialog"

const PAGE_SIZE = 20

/** The buckets the API sorts events into. */
const TIME_FRAMES = [
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Future", value: "FUTURE" },
  { label: "Past", value: "PAST" },
]

/** The event's time span, e.g. `10:00 – 12:00`, or the start alone when it has no end. */
function timeRange(event: EventRecord): string {
  const start = event.event_time ?? ""
  const end = endTimeOf(event)
  if (!start) return end || "—"
  return end ? `${start} – ${end}` : start
}

export default function EventsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [eventType, setEventType] = useState("")
  const [timeFrame, setTimeFrame] = useState("")
  const [version, setVersion] = useState(0)

  // The search box answers on every keystroke, so the request waits for a pause.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setQuery(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const list = useData(
    useCallback(
      () => listEvents({ page, pageSize: PAGE_SIZE, search: query, eventType, timeFrame }),
      [page, query, eventType, timeFrame]
    ),
    version
  )
  const counts = useData(useCallback(() => getEventCounts(), []), version)
  const types = useData(useCallback(() => getEventTypes(), []), version)

  const [dialog, setDialog] = useState<{ open: boolean; editing: EventRecord | null }>({
    open: false,
    editing: null,
  })
  const [deleting, setDeleting] = useState<EventRecord | null>(null)

  const refresh = () => setVersion((v) => v + 1)

  const typeLabel = useMemo(() => {
    const map = new Map((types.data ?? []).map((type) => [type.value, type.label]))
    return (value: string, other: string | null) =>
      other?.trim() ? other.trim() : map.get(value) ?? value
  }, [types.data])

  const openCreate = () => setDialog({ open: true, editing: null })
  const openEdit = (event: EventRecord) => setDialog({ open: true, editing: event })

  const confirmDelete = async () => {
    if (!deleting) return
    const event = deleting
    setDeleting(null)
    try {
      await removeEvent(event.id)
      toast.success("Event removed")
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the event.")
    }
  }

  const columns: Column<EventRecord>[] = [
    {
      id: "event",
      header: "Event",
      // The title is shown in full, so the cell wraps instead of holding one line.
      className: "whitespace-normal",
      cell: (e) => (
        <div className="flex items-start gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {e.cover_image_url ? (
              <img src={e.cover_image_url} alt="" className="size-full object-cover" />
            ) : (
              <CalendarDays className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 max-w-80 leading-tight">
            <p className="break-words font-medium">{e.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {e.event_type ? typeLabel(e.event_type, e.event_type_other) : "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "when",
      header: "When",
      cell: (e) => (
        <div className="leading-tight">
          <p>{e.event_date ?? (e.starts_at ? formatDate(e.starts_at) : "—")}</p>
          <p className="text-xs text-muted-foreground">{timeRange(e)}</p>
        </div>
      ),
    },
    {
      id: "venue",
      header: "Venue",
      cell: (e) => (
        <div className="flex max-w-56 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{e.venue_name || "—"}</span>
        </div>
      ),
    },
    {
      id: "host",
      header: "Host",
      cell: (e) => (
        <div className="flex max-w-48 items-center gap-1.5">
          <User className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 leading-tight">
            <p className="truncate">{e.host_name || "—"}</p>
            {e.host_contact_number && (
              <p className="truncate text-xs text-muted-foreground">{e.host_contact_number}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "images",
      header: "Images",
      cell: (e) => (
        <div className="flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-muted-foreground" />
          <span>{e.image_count ?? 0}</span>
        </div>
      ),
    },
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
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(e)}
            aria-label="Delete"
          >
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryMini
          icon={<CalendarDays className="size-4" />}
          label="Total events"
          value={counts.data ? counts.data.total : "…"}
          tone="text-primary bg-primary/10"
        />
        <SummaryMini
          icon={<CalendarDays className="size-4" />}
          label="Upcoming"
          value={counts.data ? counts.data.upcoming : "…"}
          tone="text-sky-600 bg-sky-500/10"
        />
        <SummaryMini
          icon={<CalendarDays className="size-4" />}
          label="Future"
          value={counts.data ? counts.data.future : "…"}
          tone="text-amber-600 bg-amber-500/10"
        />
        <SummaryMini
          icon={<CalendarDays className="size-4" />}
          label="Past"
          value={counts.data ? counts.data.past : "…"}
          tone="text-emerald-600 bg-emerald-500/10"
        />
      </div>

      <DataTable
        columns={columns}
        data={list.data?.events ?? []}
        loading={list.loading}
        rowKey={(e) => e.id}
        searchPlaceholder="Search events…"
        filters={[
          {
            key: "eventType",
            label: "Event type",
            options: (types.data ?? []).map((type) => ({ label: type.label, value: type.value })),
          },
          {
            key: "timeFrame",
            label: "When",
            options: TIME_FRAMES,
          },
        ]}
        pageSize={PAGE_SIZE}
        currentPage={page}
        total={list.data?.total}
        onPageChange={setPage}
        onSearchChange={setSearchInput}
        onFilterChange={(key, value) => {
          setPage(1)
          if (key === "eventType") setEventType(value === "all" ? "" : value)
          if (key === "timeFrame") setTimeFrame(value === "all" ? "" : value)
        }}
        emptyTitle="No events found"
        emptyDescription="Try adjusting your search or filters, or add a new event."
      />

      <EventFormDialog
        open={dialog.open}
        editing={dialog.editing}
        eventTypes={types.data ?? []}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete event"
        description={`Remove "${deleting?.title}"? Its cover image and gallery go with it.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function SummaryMini({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
