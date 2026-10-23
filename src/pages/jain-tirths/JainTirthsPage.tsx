import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Image as ImageIcon, Landmark, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useData } from "@/lib/useData"
import type { JainTirthRecord } from "@/types"
import { getJainTirthCounts, listJainTirths, removeJainTirth } from "@/services/api/jainTirths"
import { JainTirthFormDialog } from "./JainTirthFormDialog"

const PAGE_SIZE = 20

/** The statuses the API filters Jain Tirths by. */
const STATUSES = [
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
]

export default function JainTirthsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
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
      () => listJainTirths({ page, pageSize: PAGE_SIZE, search: query, status }),
      [page, query, status]
    ),
    version
  )
  const counts = useData(useCallback(() => getJainTirthCounts(), []), version)

  const [dialog, setDialog] = useState<{ open: boolean; editing: JainTirthRecord | null }>({
    open: false,
    editing: null,
  })
  const [deleting, setDeleting] = useState<JainTirthRecord | null>(null)

  const refresh = () => setVersion((v) => v + 1)

  const openCreate = () => setDialog({ open: true, editing: null })
  const openEdit = (tirth: JainTirthRecord) => setDialog({ open: true, editing: tirth })

  const confirmDelete = async () => {
    if (!deleting) return
    const tirth = deleting
    setDeleting(null)
    try {
      await removeJainTirth(tirth.id)
      toast.success("Jain Tirth removed")
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the Jain Tirth.")
    }
  }

  const columns: Column<JainTirthRecord>[] = [
    {
      id: "tirth",
      header: "Jain Tirth",
      // The title is shown in full, so the cell wraps instead of holding one line.
      className: "whitespace-normal",
      cell: (t) => (
        <div className="flex items-start gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {t.cover_image_url ? (
              <img src={t.cover_image_url} alt="" className="size-full object-cover" />
            ) : (
              <Landmark className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 max-w-80 leading-tight">
            <p className="break-words font-medium">{t.title}</p>
            {t.title_hi && <p className="truncate text-xs text-muted-foreground">{t.title_hi}</p>}
          </div>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: (t) => (
        <div className="flex max-w-56 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{t.location || "—"}</span>
        </div>
      ),
    },
    {
      id: "images",
      header: "Images",
      cell: (t) => (
        <div className="flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-muted-foreground" />
          <span>{t.image_count ?? 0}</span>
        </div>
      ),
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
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(t)}
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
        title="Jain Tirth Management"
        description="Create and manage Jain Tirth locations and details"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Jain Tirth
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryMini
          icon={<Landmark className="size-4" />}
          label="Total Jain Tirths"
          value={counts.data ? counts.data.total : "…"}
          tone="text-primary bg-primary/10"
        />
        <SummaryMini
          icon={<Landmark className="size-4" />}
          label="Published"
          value={counts.data ? counts.data.published : "…"}
          tone="text-sky-600 bg-sky-500/10"
        />
        <SummaryMini
          icon={<Landmark className="size-4" />}
          label="Draft"
          value={counts.data ? counts.data.draft : "…"}
          tone="text-amber-600 bg-amber-500/10"
        />
        <SummaryMini
          icon={<Landmark className="size-4" />}
          label="Cancelled"
          value={counts.data ? counts.data.cancelled : "…"}
          tone="text-emerald-600 bg-emerald-500/10"
        />
      </div>

      <DataTable
        columns={columns}
        data={list.data?.tirths ?? []}
        loading={list.loading}
        rowKey={(t) => t.id}
        searchPlaceholder="Search Jain Tirths…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUSES,
          },
        ]}
        pageSize={PAGE_SIZE}
        currentPage={page}
        total={list.data?.total}
        onPageChange={setPage}
        onSearchChange={setSearchInput}
        onFilterChange={(key, value) => {
          setPage(1)
          if (key === "status") setStatus(value === "all" ? "" : value)
        }}
        emptyTitle="No Jain Tirths found"
        emptyDescription="Try adjusting your search or filters, or add a new Jain Tirth."
      />

      <JainTirthFormDialog
        open={dialog.open}
        editing={dialog.editing}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Jain Tirth"
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
