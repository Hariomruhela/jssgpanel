import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Newspaper, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { useData } from "@/lib/useData"
import { formatDate } from "@/lib/format"
import type { Announcement } from "@/types"
import { createAnnouncement, getAnnouncements, removeAnnouncement, updateAnnouncement, type AnnouncementInput } from "@/services/api/news"

const NEWS_CATEGORIES = ["Religious", "Administrative", "Events", "Policies", "Seva", "General"]

const DEFAULT_FORM: AnnouncementInput = {
  title: "",
  category: "General",
  summary: "",
  author: "Rohit Shah",
  publishedOn: new Date().toISOString().slice(0, 10),
  publishStatus: "published",
  pinned: false,
}

export default function NewsPage() {
  const news = useData(useCallback(() => getAnnouncements(), []))
  const [dialog, setDialog] = useState<{ open: boolean; editing: Announcement | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AnnouncementInput>(DEFAULT_FORM)

  const counts = useMemo(() => {
    const all = news.data ?? []
    return {
      published: all.filter((a) => a.publishStatus === "published").length,
      drafts: all.filter((a) => a.publishStatus === "draft").length,
      pinned: all.filter((a) => a.pinned).length,
    }
  }, [news.data])

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null })
  }

  const openEdit = (a: Announcement) => {
    setForm({
      title: a.title, category: a.category, summary: a.summary, author: a.author,
      publishedOn: a.publishedOn, publishStatus: a.publishStatus, pinned: a.pinned,
    })
    setDialog({ open: true, editing: a })
  }

  const save = async () => {
    if (!form.title.trim() || !form.summary.trim()) return
    setSaving(true)
    try {
      if (dialog.editing) {
        await updateAnnouncement(dialog.editing.id, form)
        toast.success("Announcement updated")
      } else {
        await createAnnouncement(form)
        toast.success("Announcement published")
      }
      news.reload()
      setDialog({ open: false, editing: null })
    } finally {
      setSaving(false)
    }
  }

  const togglePinned = async (a: Announcement) => {
    await updateAnnouncement(a.id, { pinned: !a.pinned })
    news.reload()
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await removeAnnouncement(deleting.id)
    toast.success("Announcement removed")
  }

  const columns: Column<Announcement>[] = [
    {
      id: "title",
      header: "Announcement",
      cell: (a) => (
        <div className="flex max-w-96 items-center gap-2">
          {a.pinned && <Pin className="size-3.5 shrink-0 text-amber-500" />}
          <div className="min-w-0">
            <p className="truncate font-medium">{a.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{a.summary}</p>
          </div>
        </div>
      ),
    },
    { id: "category", header: "Category", cell: (a) => <Badge variant="secondary">{a.category}</Badge> },
    { id: "author", header: "Author", cell: (a) => a.author },
    { id: "date", header: "Published on", cell: (a) => formatDate(a.publishedOn) },
    { id: "status", header: "Status", cell: (a) => <StatusBadge status={a.publishStatus} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => togglePinned(a)} aria-label="Toggle pin">
            {a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(a)} aria-label="Edit">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(a)} aria-label="Delete">
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="News & Announcements"
        description="Publish and manage community updates"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            New Announcement
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label="Published" value={news.data ? counts.published : "…"} />
        <MiniStat label="Drafts" value={news.data ? counts.drafts : "…"} />
        <MiniStat label="Pinned" value={news.data ? counts.pinned : "…"} />
      </div>

      <DataTable
        columns={columns}
        data={news.data ?? []}
        loading={news.loading}
        rowKey={(a) => a.id}
        searchKeys={(a) => `${a.title} ${a.summary} ${a.author} ${a.category}`}
        searchPlaceholder="Search announcements…"
        filters={[
          {
            key: "publishStatus",
            label: "Status",
            options: [
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Scheduled", value: "scheduled" },
            ],
          },
        ]}
        emptyTitle="No announcements found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            <DialogDescription>Publish or schedule a community update.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Title" required>
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Annual fee payment window opens" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.publishStatus} onValueChange={(v) => setForm((s) => ({ ...s, publishStatus: v as Announcement["publishStatus"] }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Summary" required>
              <Textarea value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} rows={3} placeholder="Short summary of the announcement…" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Author">
                <Input value={form.author} onChange={(e) => setForm((s) => ({ ...s, author: e.target.value }))} />
              </FormField>
              <FormField label="Published on">
                <DateInput value={form.publishedOn} onChange={(v) => setForm((s) => ({ ...s, publishedOn: v }))} />
              </FormField>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Pin announcement</p>
                <p className="text-xs text-muted-foreground">Show at the top of the community news feed.</p>
              </div>
              <Switch checked={form.pinned} onCheckedChange={(v) => setForm((s) => ({ ...s, pinned: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.summary.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete announcement"
        description={`Remove "${deleting?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
        <Newspaper className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-semibold">{value}</p>
      </div>
    </div>
  )
}