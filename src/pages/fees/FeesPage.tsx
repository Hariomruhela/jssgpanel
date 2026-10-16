import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarClock, IndianRupee, Pencil, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { formatCompact, formatCurrency, formatDate } from "@/lib/format"
import type { FeeConfig } from "@/types"
import { applyFeeToAll, getFeeConfigs, updateFeeConfig } from "@/services/api/fees"
import { getGroups } from "@/services/api/groups"
import { getCollectionSummary } from "@/services/api/payments"

export default function FeesPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const fees = useData(useCallback(() => getFeeConfigs(), []))
  const summary = useData(useCallback(() => getCollectionSummary(), []))
  const groupMap = useMemo(() => Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])), [groups.data])

  const [editing, setEditing] = useState<FeeConfig | null>(null)
  const [form, setForm] = useState({ amount: 15000, dueDate: "2026-10-15", lateFee: 2000, status: "open" as FeeConfig["status"] })
  const [saving, setSaving] = useState(false)

  const [bulk, setBulk] = useState({ amount: 15000, dueDate: "2026-10-15", lateFee: 2000 })
  const [bulkSaving, setBulkSaving] = useState(false)

  const openEdit = (f: FeeConfig) => {
    setForm({ amount: f.amount, dueDate: f.dueDate, lateFee: f.lateFee, status: f.status })
    setEditing(f)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateFeeConfig(editing.groupId, form)
      toast.success(`Fee updated for ${groupMap[editing.groupId]}`)
      fees.reload()
      summary.reload()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const applyAll = async () => {
    setBulkSaving(true)
    try {
      await applyFeeToAll(bulk)
      toast.success("Fee configuration applied to all groups")
      fees.reload()
      summary.reload()
    } finally {
      setBulkSaving(false)
    }
  }

  const columns: Column<FeeConfig>[] = [
    { id: "group", header: "Group", cell: (f) => <span className="font-medium">{groupMap[f.groupId] ?? f.groupId}</span> },
    { id: "members", header: "Members", cell: (f) => f.totalMembers },
    { id: "fee", header: "Fee", cell: (f) => <span className="font-medium">{formatCurrency(f.amount)}</span> },
    {
      id: "due",
      header: "Due date",
      cell: (f) => (
        <div className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-muted-foreground" />
          {formatDate(f.dueDate)}
        </div>
      ),
    },
    { id: "late", header: "Late fee", cell: (f) => formatCurrency(f.lateFee) },
    {
      id: "collection",
      header: "Collection",
      cell: (f) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{f.paidMembers}/{f.totalMembers} members</span>
            <span className="font-medium">{f.collectionRate}%</span>
          </div>
          <Progress value={f.collectionRate} className="mt-1 h-1.5" />
        </div>
      ),
    },
    { id: "collected", header: "Collected", cell: (f) => formatCurrency(f.collected) },
    { id: "status", header: "Status", cell: (f) => <StatusBadge status={f.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (f) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(f)} aria-label="Edit">
            <Pencil />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annual Fee Management"
        description="Configure annual Federation fees for registered Jain social groups — FY 2025-26"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UnitCard label="Expected collection" value={summary.data ? formatCompact(summary.data.expectedTotal) : "…"} tone="text-foreground" />
        <UnitCard label="Collected" value={summary.data ? formatCompact(summary.data.collectedTotal) : "…"} tone="text-emerald-600 dark:text-emerald-400" />
        <UnitCard label="Outstanding" value={summary.data ? formatCompact(summary.data.outstandingTotal) : "…"} tone="text-rose-600 dark:text-rose-400" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Apply fee to all groups
          </CardTitle>
          <CardDescription>One-click update of the fee amount, due date and late fee for every group.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Annual fee (₹)">
              <Input
                type="number"
                min={0}
                value={bulk.amount}
                onChange={(e) => setBulk((s) => ({ ...s, amount: Number(e.target.value) || 0 }))}
              />
            </FormField>
            <FormField label="Due date">
              <Input type="date" value={bulk.dueDate} onChange={(e) => setBulk((s) => ({ ...s, dueDate: e.target.value }))} />
            </FormField>
            <FormField label="Late fee (₹)">
              <Input
                type="number"
                min={0}
                value={bulk.lateFee}
                onChange={(e) => setBulk((s) => ({ ...s, lateFee: Number(e.target.value) || 0 }))}
              />
            </FormField>
          </div>
          <div className="mt-4">
            <Button onClick={applyAll} disabled={bulkSaving}>
              {bulkSaving ? "Applying…" : "Apply to all groups"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={fees.data ?? []}
        loading={fees.loading}
        rowKey={(f) => f.groupId}
        searchKeys={(f) => `${groupMap[f.groupId] ?? ""} ${f.fiscalYear}`}
        searchPlaceholder="Search groups…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Open", value: "open" },
              { label: "Closed", value: "closed" },
            ],
          },
        ]}
        emptyTitle="No fee configurations found"
        emptyDescription="Apply a fee to all groups above to get started."
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit fee — {editing ? groupMap[editing.groupId] : ""}</DialogTitle>
            <DialogDescription>Update annual fee configuration for this group.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Annual fee (₹)">
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: Number(e.target.value) || 0 }))}
              />
            </FormField>
            <FormField label="Late fee (₹)">
              <Input
                type="number"
                min={0}
                value={form.lateFee}
                onChange={(e) => setForm((s) => ({ ...s, lateFee: Number(e.target.value) || 0 }))}
              />
            </FormField>
            <FormField label="Due date">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as FeeConfig["status"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
    </div>
  )
}

function UnitCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <IndianRupee className="size-[18px] text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-heading text-xl font-semibold ${tone}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}