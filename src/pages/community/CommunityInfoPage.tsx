import { useCallback, useState } from "react"
import { toast } from "sonner"
import { FileText, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/apiClient"
import type { CommunityInfo } from "@/types"
import { createCommunityInfo, getCommunityInfo, removeCommunityInfo, updateCommunityInfo, type CommunityInfoInput } from "@/services/api/community"

const CATEGORIES = ["About", "Policies", "Seva", "Events", "Temple", "Education", "Other"]

const DEFAULT_FORM: CommunityInfoInput = {
  title: "",
  category: "About",
  content: "",
  featured: false,
  status: "published",
}

export default function CommunityInfoPage() {
  const info = useData(useCallback(() => getCommunityInfo(), []))
  const [dialog, setDialog] = useState<{ open: boolean; editing: CommunityInfo | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<CommunityInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CommunityInfoInput>(DEFAULT_FORM)

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null })
  }

  const openEdit = (c: CommunityInfo) => {
    setForm({ title: c.title, category: c.category, content: c.content, featured: c.featured, status: c.status })
    setDialog({ open: true, editing: c })
  }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      if (dialog.editing) {
        await updateCommunityInfo(dialog.editing.id, form, "Rohit Shah")
        toast.success("Content updated")
      } else {
        await createCommunityInfo(form, "Rohit Shah")
        toast.success("Content published")
      }
      info.reload()
      setDialog({ open: false, editing: null })
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save content."))
    } finally {
      setSaving(false)
    }
  }

  const toggleFeatured = async (c: CommunityInfo) => {
    try {
      await updateCommunityInfo(c.id, { featured: !c.featured }, "Rohit Shah")
      info.reload()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update featured status."))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await removeCommunityInfo(deleting.id)
      toast.success("Content removed")
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove content."))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Information"
        description="Manage approved community information and content"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Content
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(info.data ?? []).map((c) => (
          <Card key={c.id} className="gap-3">
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{c.title}</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{c.category}</Badge>
                <StatusBadge status={c.status} />
                {c.featured && (
                  <Badge variant="outline">
                    <Pin className="size-3" /> Featured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3">
              <p className="line-clamp-3 text-sm text-muted-foreground">{c.content}</p>
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {c.updatedBy} · {formatDate(c.updatedOn)}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => toggleFeatured(c)} aria-label="Toggle featured">
                    {c.featured ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)} aria-label="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)} aria-label="Delete">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Content" : "Add Content"}</DialogTitle>
            <DialogDescription>Create or update community information.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Title" required>
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. About the Federation" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as CommunityInfo["status"] }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Content" required>
              <Textarea value={form.content} onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} rows={5} placeholder="Write the content…" />
            </FormField>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Featured content</p>
                <p className="text-xs text-muted-foreground">Show this prominently in the community section.</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(v) => setForm((s) => ({ ...s, featured: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete content"
        description={`Remove "${deleting?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}