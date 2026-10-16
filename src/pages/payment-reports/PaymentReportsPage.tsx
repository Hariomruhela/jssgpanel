import { useCallback } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Download, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { useData } from "@/lib/useData"
import { chartTooltipProps } from "@/lib/chart"
import { downloadCSV } from "@/lib/csv"
import { formatCompact, formatCurrency } from "@/lib/format"
import { getCollectionSummary, getMonthlyCollections, getGroupPaymentStatus } from "@/services/api/payments"
import { getFeeOutstandingReport, type FeeOutstandingRow } from "@/services/api/reports"

export default function PaymentReportsPage() {
  const summary = useData(useCallback(() => getCollectionSummary(), []))
  const monthly = useData(useCallback(() => getMonthlyCollections(), []))
  const outstanding = useData(useCallback(() => getFeeOutstandingReport(), []))
  const status = useData(useCallback(() => getGroupPaymentStatus(), []))

  const cols: Column<FeeOutstandingRow>[] = [
    { id: "group", header: "Group", cell: (r) => <span className="font-medium">{r.group}</span> },
    { id: "members", header: "Members", cell: (r) => r.totalMembers },
    { id: "fee", header: "Fee", cell: (r) => formatCurrency(r.feeAmount) },
    { id: "expected", header: "Expected", cell: (r) => formatCurrency(r.expected) },
    { id: "collected", header: "Collected", cell: (r) => formatCurrency(r.collected) },
    { id: "outstanding", header: "Outstanding", cell: (r) => <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(r.outstanding)}</span> },
    { id: "rate", header: "Collection %", cell: (r) => <span className="font-medium">{r.collectionRate}%</span> },
    {
      id: "progress",
      header: "Progress",
      cell: (r) => <Progress value={r.collectionRate} className="w-28" />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Reports"
        description="Collection and outstanding fee reports for Federation administration — FY 2025-26"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <ReportStat label="Expected collection" value={summary.data ? formatCompact(summary.data.expectedTotal) : "…"} />
        <ReportStat label="Collected" value={summary.data ? formatCompact(summary.data.collectedTotal) : "…"} tone="text-emerald-600 dark:text-emerald-400" />
        <ReportStat label="Outstanding" value={summary.data ? formatCompact(summary.data.outstandingTotal) : "…"} tone="text-rose-600 dark:text-rose-400" />
        <ReportStat label="Payment success rate" value={summary.data ? `${summary.data.successRate}%` : "…"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Collection</CardTitle>
            <CardDescription>Annual fee collection trend across the fiscal year</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              {monthly.loading || !monthly.data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly.data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}K`} width={44} />
                    <Tooltip {...chartTooltipProps} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="collected" name="Collected" fill="var(--primary)" radius={[5, 5, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Group Status Snapshot</CardTitle>
            <CardDescription>Payment status across registered groups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(status.data ?? []).map((g) => (
              <div key={g.groupId} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs text-muted-foreground">{g.name}</span>
                <StatusBadge status={g.status} />
              </div>
            ))}
            {status.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold">Outstanding Fee Report</h2>
            <p className="text-sm text-muted-foreground">
              Group-wise expected, collected and outstanding annual fees
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              downloadCSV(
                "payment-report-outstanding.csv",
                ["Group", "Members", "Fee", "Expected", "Collected", "Outstanding", "Collection %"],
                (outstanding.data ?? []).map((r) => [r.group, r.totalMembers, r.feeAmount, r.expected, r.collected, r.outstanding, r.collectionRate])
              )
            }
          >
            <Download />
            Export CSV
          </Button>
        </div>
        <DataTable
          columns={cols}
          data={outstanding.data ?? []}
          loading={outstanding.loading}
          rowKey={(r) => r.group}
          searchKeys={(r) => r.group}
          searchPlaceholder="Search groups…"
          pageSize={8}
        />
      </div>
    </div>
  )
}

function ReportStat({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ReceiptText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className={`font-heading text-xl font-semibold ${tone}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}