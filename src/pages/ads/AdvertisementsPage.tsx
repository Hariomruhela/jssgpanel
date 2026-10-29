import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Eye, Megaphone, MousePointerClick, Pencil, Plus, Trash2 } from "lucide-react"
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
import { formatCompact, formatCurrency, formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/apiClient"
import type { Advertisement } from "@/types"
import { createAd, getAds, removeAd, updateAd, updateAdStatus, type AdInput } from "@/services/api/ads"

const AD_TYPES: Advertisement["type"][] = ["Banner", "Sidebar", "Popup", "Sponsored Post"]

const DEFAULT_FORM: AdInput = {
  title: "",
  advertiser: "",
  type: "Banner",
  placement: "Homepage Top",
  mediaLabel: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  spend: 0,
}

export default function AdvertisementsPage() {
  const ads = useData(useCallback(() => getAds(), []))
  const [dialog, setDialog] = useState<{ open: boolean; editing: Advertisement | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<Advertisement | null>(null)
  const [viewing, setViewing] = useState<Advertisement | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AdInput>(DEFAULT_FORM)

  const summary = useMemo(() => {
    const all = ads.data ?? []
    const totalSpend = all.reduce((sum, a) => sum + a.spend, 0)
    return {
      active: all.filter((a) => a.status === "active").length,
      pending: all.filter((a) => a.status === "pending").length,
      totalSpend,
    }
  }, [ads.data])

  const openCreate = () => {
    setForm(DEFAULT_FORM)
    setDialog({ open: true, editing: null })
  }

  const openEdit = (a: Advertisement) => {
    setForm({
      title: a.title, advertiser: a.advertiser, type: a.type, placement: a.placement,
      mediaLabel: a.mediaLabel, startDate: a.startDate, endDate: a.endDate, spend: a.spend,
    })
    setDialog({ open: true, editing: a })
  }

  const save = async () => {
    if (!form.title.trim() || !form.advertiser.trim()) return
    setSaving(true)
    try {
      if (dialog.editing) {
        await updateAd(dialog.editing.id, form)
        toast.success("Advertisement updated")
      } else {
        await createAd(form, "Rohit Shah")
        toast.success("Advertisement submitted for approval")
      }
      ads.reload()
      setDialog({ open: false, editing: null })
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save advertisement."))
    } finally {
      setSaving(false)
    }
  }

  const approve = async (a: Advertisement) => {
    try {
      await updateAdStatus(a.id, "approved", "Rohit Shah")
      toast.success(`${a.title} approved`)
      ads.reload()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not approve advertisement."))
    }
  }

  const reject = async (a: Advertisement) => {
    try {
      await updateAdStatus(a.id, "rejected", "Rohit Shah")
      toast.success(`${a.title} rejected`)
      ads.reload()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not reject advertisement."))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await removeAd(deleting.id)
      toast.success("Advertisement removed")
      ads.reload()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove advertisement."))
    }
  }

  const columns: Column<Advertisement>[] = [
    {
      id: "ad",
      header: "Advertisement",
      cell: (a) => (
        <div className="max-w-80">
          <p className="truncate font-medium">{a.title}</p>
          <p className="truncate text-xs text-muted-foreground">{a.advertiser} · {a.type}</p>
        </div>
      ),
    },
    { id: "placement", header: "Placement", cell: (a) => <span className="text-muted-foreground">{a.placement}</span> },
    { id: "dates", header: "Campaign dates", cell: (a) => `${formatDate(a.startDate)} → ${formatDate(a.endDate)}` },
    {
      id: "performance",
      header: "Performance",
      cell: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs">
            <Eye className="size-3.5 text-muted-foreground" /> {a.impressions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MousePointerClick className="size-3.5 text-muted-foreground" /> {a.clicks.toLocaleString()}
          </span>
        </div>
      ),
    },
    { id: "spend", header: "Spend", cell: (a) => formatCurrency(a.spend) },
    { id: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-1">
          {a.status === "pending" && (
            <>
              <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => approve(a)}>
                Approve
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => reject(a)}>
                Reject
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon-xs" onClick={() => setViewing(a)} aria-label="View">
            <Eye />
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
        title="Advertisement Management"
        description="Create, approve and control advertisements across the platform"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Advertisement
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Megaphone className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active campaigns</p>
              <p className="font-heading text-xl font-semibold">{ads.data ? summary.active : "…"}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Megaphone className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
              <p className="font-heading text-xl font-semibold">{ads.data ? summary.pending : "…"}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <Megaphone className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total spend</p>
              <p className="font-heading text-xl font-semibold">{ads.data ? formatCompact(summary.totalSpend) : "…"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={ads.data ?? []}
        loading={ads.loading}
        rowKey={(a) => a.id}
        searchKeys={(a) => `${a.title} ${a.advertiser} ${a.type} ${a.placement}`}
        searchPlaceholder="Search advertisements…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: ["pending", "approved", "active", "expired", "rejected"].map((s) => ({ label: s, value: s })),
          },
          {
            key: "type",
            label: "Type",
            options: AD_TYPES.map((t) => ({ label: t, value: t })),
          },
        ]}
        emptyTitle="No advertisements found"
        emptyDescription="Try adjusting your search or filters."
      />

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Advertisement" : "Add Advertisement"}</DialogTitle>
            <DialogDescription>
              {dialog.editing ? "Update campaign details." : "New submissions require approval before going live."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Title" required className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Navkarshi Jewellers — Gold & Diamond" />
            </FormField>
            <FormField label="Advertiser" required>
              <Input value={form.advertiser} onChange={(e) => setForm((s) => ({ ...s, advertiser: e.target.value }))} />
            </FormField>
            <FormField label="Type">
              <Select value={form.type} onValueChange={(v) => setForm((s) => ({ ...s, type: v as Advertisement["type"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Placement">
              <Input value={form.placement} onChange={(e) => setForm((s) => ({ ...s, placement: e.target.value }))} placeholder="e.g. Homepage Top" />
            </FormField>
            <FormField label="Media file">
              <Input value={form.mediaLabel} onChange={(e) => setForm((s) => ({ ...s, mediaLabel: e.target.value }))} placeholder="banner_advertiser.png" />
            </FormField>
            <FormField label="Start date">
              <DateInput value={form.startDate} onChange={(v) => setForm((s) => ({ ...s, startDate: v }))} />
            </FormField>
            <FormField label="End date">
              <DateInput value={form.endDate} onChange={(v) => setForm((s) => ({ ...s, endDate: v }))} />
            </FormField>
            <FormField label="Budget (₹)" className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                value={form.spend}
                onChange={(e) => setForm((s) => ({ ...s, spend: Number(e.target.value) || 0 }))}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.advertiser.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              {viewing?.advertiser} · submitted by {viewing?.submittedBy} on {viewing ? formatDate(viewing.submittedOn) : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{viewing.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Placement</p>
                <p className="font-medium">{viewing.placement}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="font-medium">{viewing.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="font-medium">{viewing.clicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spend</p>
                <p className="font-medium">{formatCurrency(viewing.spend)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved by</p>
                <p className="font-medium">{viewing.approvedBy ?? "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete advertisement"
        description={`Remove "${deleting?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}