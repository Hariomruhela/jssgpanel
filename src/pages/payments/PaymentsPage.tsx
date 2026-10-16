import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { CreditCard, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { formatCompact, formatCurrency, formatDate } from "@/lib/format"
import type { PaymentTransaction } from "@/types"
import {
  getCollectionSummary,
  getGroupPaymentStatus,
  getTransactions,
  recordPayment,
  refundTransaction,
} from "@/services/api/payments"
import { getGroups } from "@/services/api/groups"

const METHODS: PaymentTransaction["method"][] = ["UPI", "Bank Transfer", "Cheque", "Cash", "Card"]

export default function PaymentsPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const summary = useData(useCallback(() => getCollectionSummary(), []))
  const groupMap = useMemo(() => Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])), [groups.data])

  const [recordOpen, setRecordOpen] = useState(false)
  const [payForm, setPayForm] = useState({ payerName: "", groupId: "", amount: 15000, method: "UPI" as PaymentTransaction["method"], remark: "Annual fee FY 2025-26" })
  const [saving, setSaving] = useState(false)

  const savePayment = async () => {
    if (!payForm.payerName.trim() || !payForm.groupId) return
    setSaving(true)
    try {
      await recordPayment(payForm)
      toast.success("Payment recorded")
      setRecordOpen(false)
      setPayForm({ payerName: "", groupId: "", amount: 15000, method: "UPI", remark: "Annual fee FY 2025-26" })
      summary.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Module"
        description="Record payments and view group-wise payment status and history"
        actions={
          <Button onClick={() => setRecordOpen(true)}>
            <Plus />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Mini label="Expected" value={summary.data ? formatCompact(summary.data.expectedTotal) : "…"} />
        <Mini label="Collected" value={summary.data ? formatCompact(summary.data.collectedTotal) : "…"} tone="text-emerald-600 dark:text-emerald-400" />
        <Mini label="Outstanding" value={summary.data ? formatCompact(summary.data.outstandingTotal) : "…"} tone="text-rose-600 dark:text-rose-400" />
        <Mini label="Transactions" value={summary.data ? String(summary.data.totalTransactions) : "…"} />
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Group-wise Status</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="pt-2">
          <GroupStatus />
        </TabsContent>
        <TabsContent value="transactions" className="pt-2">
          <TransactionsTab groupMap={groupMap} onMutate={() => summary.reload()} />
        </TabsContent>
      </Tabs>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log an offline or online annual fee payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Payer / member" required>
              <Input value={payForm.payerName} onChange={(e) => setPayForm((s) => ({ ...s, payerName: e.target.value }))} placeholder="Name of the member" />
            </FormField>
            <FormField label="Group" required>
              <Select value={payForm.groupId} onValueChange={(v) => setPayForm((s) => ({ ...s, groupId: v }))}>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Amount (₹)">
                <Input
                  type="number"
                  min={1}
                  value={payForm.amount}
                  onChange={(e) => setPayForm((s) => ({ ...s, amount: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </FormField>
              <FormField label="Method">
                <Select value={payForm.method} onValueChange={(v) => setPayForm((s) => ({ ...s, method: v as PaymentTransaction["method"] }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Remark">
              <Input value={payForm.remark} onChange={(e) => setPayForm((s) => ({ ...s, remark: e.target.value }))} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePayment} disabled={saving || !payForm.payerName.trim() || !payForm.groupId}>
              {saving ? "Saving…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupStatus() {
  const data = useData(useCallback(() => getGroupPaymentStatus(), []))
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {(data.data ?? []).map((g) => (
        <Card key={g.groupId} size="sm" className="gap-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="line-clamp-1 text-sm">{g.name}</CardTitle>
              <StatusBadge status={g.status} />
            </div>
            <CardDescription>
              {g.paidMembers}/{g.totalMembers} members paid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Collected</span>
                <span className="font-medium text-foreground">{formatCompact(g.collected)} / {formatCompact(g.expected)}</span>
              </div>
              <Progress value={g.rate} className="mt-1.5 h-2" />
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(g.outstanding)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TransactionsTab({ groupMap, onMutate }: { groupMap: Record<string, string>; onMutate: () => void }) {
  const txns = useData(useCallback(() => getTransactions(), []))
  const groups = useData(useCallback(() => getGroups(), []))
  const [refunding, setRefunding] = useState<PaymentTransaction | null>(null)

  const doRefund = async () => {
    if (!refunding) return
    await refundTransaction(refunding.id, "Manual refund")
    toast.success("Payment marked as refunded")
    txns.reload()
    onMutate()
  }

  const columns: Column<PaymentTransaction>[] = [
    {
      id: "txn",
      header: "Transaction",
      cell: (t) => (
        <div className="leading-tight">
          <p className="font-medium">{t.txnNo}</p>
          <p className="text-xs text-muted-foreground">Receipt {t.receiptNo}</p>
        </div>
      ),
    },
    { id: "payer", header: "Payer", cell: (t) => t.payerName },
    { id: "group", header: "Group", cell: (t) => groupMap[t.groupId] ?? t.groupId },
    { id: "method", header: "Method", cell: (t) => t.method },
    { id: "amount", header: "Amount", cell: (t) => <span className="font-medium">{formatCurrency(t.amount)}</span> },
    { id: "paidOn", header: "Paid on", cell: (t) => formatDate(t.paidOn) },
    { id: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (t) =>
        t.status === "success" ? (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon-xs" className="text-amber-600 hover:text-amber-600" onClick={() => setRefunding(t)} aria-label="Refund">
              <RotateCcw />
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={txns.data ?? []}
        loading={txns.loading}
        rowKey={(t) => t.id}
        searchKeys={(t) => `${t.txnNo} ${t.receiptNo} ${t.payerName} ${t.groupId}`}
        searchPlaceholder="Search by txn no, receipt, payer…"
        filters={[
          {
            key: "groupId",
            label: "Group",
            options: (groups.data ?? []).map((g) => ({ label: g.name, value: g.id })),
          },
          {
            key: "method",
            label: "Method",
            options: METHODS.map((m) => ({ label: m, value: m })),
          },
          {
            key: "status",
            label: "Status",
            options: ["success", "pending", "failed", "refunded"].map((s) => ({ label: s, value: s })),
          },
        ]}
        emptyTitle="No transactions found"
        emptyDescription="Try adjusting your search or filters."
        pageSize={8}
      />
      <ConfirmDialog
        open={!!refunding}
        onOpenChange={(open) => !open && setRefunding(null)}
        title="Refund payment"
        description={`Mark ${refunding?.txnNo} (${refunding ? formatCurrency(refunding.amount) : ""}) as refunded? This removes it from the collection totals.`}
        confirmLabel="Refund"
        onConfirm={doRefund}
      />
    </>
  )
}

function Mini({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <CreditCard className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-heading text-xl font-semibold ${tone}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}