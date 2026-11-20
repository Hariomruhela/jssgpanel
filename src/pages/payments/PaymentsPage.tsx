import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  Eye,
  FileSpreadsheet,
  Filter,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { useData } from "@/lib/useData"
import { downloadCSV } from "@/lib/csv"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { getErrorMessage } from "@/lib/apiClient"
import { PaymentSettingsTab } from "./PaymentSettingsTab"
import type {
  PaymentRecord,
} from "@/types"
import {
  getPaymentById,
  getPaymentDashboardSummary,
  listGroupObligations,
  listPayments,
} from "@/services/api/payments"

const TRANSACTIONS_PAGE_SIZE = 8
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function shortId(value: string | null | undefined): string {
  if (!value) return "—"
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

function amountValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatAmount(value: string | number | null | undefined): string {
  const parsed = amountValue(value)
  return parsed === null ? "—" : formatCurrency(parsed)
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

export default function PaymentsPage() {
  const summary = useData(useCallback(() => getPaymentDashboardSummary(), []))
  const [activeTab, setActiveTab] = useState("status")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSettingsUpdated = () => {
    summary.reload()
    setRefreshKey((k) => k + 1)
  }

  const handleRecordPayment = () => {
    toast.info("Select a group below to record payments via Super Admin Checkout or Payment Link.")
    setActiveTab("status")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Module"
        description="Dual-workflow group payment collection, settings configuration, and transaction ledger"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="size-4" />
              Payment Settings
            </Button>
            <Button size="sm" onClick={handleRecordPayment}>
              <Plus className="size-4" />
              Collect Payment
            </Button>
          </div>
        }
      />

      {/* Global Dashboard Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Mini
          label="Expected"
          value={summary.loading ? "…" : formatCurrency(summary.data?.total_expected ?? 0)}
        />
        <Mini
          label="Collected"
          value={summary.loading ? "…" : formatCurrency(summary.data?.total_collected ?? 0)}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <Mini
          label="Outstanding"
          value={summary.loading ? "…" : formatCurrency(summary.data?.total_outstanding ?? 0)}
          tone="text-rose-600 dark:text-rose-400"
        />
        <Mini
          label="Transactions"
          value={summary.loading ? "…" : String(summary.data?.total_transactions ?? 0)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status">Group-wise Status</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Payment Reports</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="pt-2">
          <GroupStatusTab key={`status-${refreshKey}`} onLedgerUpdated={summary.reload} />
        </TabsContent>
        <TabsContent value="transactions" className="pt-2">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="reports" className="pt-2">
          <GroupReportsTab key={`reports-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="settings" className="pt-2">
          <PaymentSettingsTab onSettingsUpdated={handleSettingsUpdated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupStatusTab({ onLedgerUpdated }: { onLedgerUpdated: () => void }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const groupsData = useData(
    useCallback(
      () => listGroupObligations({ search: searchQuery, pageSize: 100, fetchAll: true }),
      [searchQuery]
    )
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(search.trim())
  }

  const handleRefresh = () => {
    groupsData.reload()
    onLedgerUpdated()
  }

  const rows = groupsData.data?.obligations ?? []

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex max-w-sm flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search groups by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setSearchQuery("")
              }}
            >
              Clear
            </Button>
          )}
        </form>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={groupsData.loading}
        >
          <RefreshCw className={groupsData.loading ? "animate-spin" : ""} />
          Refresh Groups
        </Button>
      </div>

      {groupsData.error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{getErrorMessage(groupsData.error, "Could not load group obligations.")}</p>
          <Button variant="ghost" size="sm" onClick={groupsData.reload}>
            Retry
          </Button>
        </div>
      )}

      {groupsData.loading && !groupsData.data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted/30" />
              <CardContent className="h-28 py-3" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ReceiptText className="size-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No groups found</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {searchQuery
                ? `No group matched "${searchQuery}". Try a different name.`
                : "Active groups will appear here once configured."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((group) => {
            const isPaid = group.status === "PAID"
            const isNotApplicable = group.status === "NOT_APPLICABLE"
            const canCollect = !isPaid && !isNotApplicable && group.pending_amount > 0
            const memberCount =
              typeof group.member_count === "number" && !Number.isNaN(group.member_count)
                ? group.member_count
                : typeof (group as any).member_count_snapshot === "number"
                ? (group as any).member_count_snapshot
                : group.expected_amount && group.rate_per_member
                ? Math.round(group.expected_amount / group.rate_per_member)
                : 0

            return (
              <Card key={group.id} className="flex flex-col justify-between overflow-hidden shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate font-semibold text-sm sm:text-base" title={group.group_name}>
                        {group.group_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 pt-0.5 text-[11px]">
                        <CalendarClock className="size-3 text-primary shrink-0" />
                        <span>Due: {formatDate(group.due_date || "2027-03-31")}</span>
                      </CardDescription>
                    </div>
                    <StatusBadge status={group.status} />
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 space-y-2.5">
                  {/* Total Members & Calculation Formula */}
                  <div className="rounded-md bg-muted/40 p-2 text-xs space-y-1 border">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
                        <Users className="size-3 text-primary" />
                        Total Members:
                      </span>
                      <span className="font-semibold text-foreground text-xs">{memberCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] border-t border-border/50 pt-1">
                      <span className="text-muted-foreground">Calculation:</span>
                      <span className="font-mono text-foreground font-medium">
                        {memberCount} × ₹{group.rate_per_member} = <span className="font-bold text-primary">{formatCurrency(group.expected_amount)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/20 p-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Expected</p>
                      <p className="font-semibold text-xs">{formatCurrency(group.expected_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Collected</p>
                      <p className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(group.collected_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Outstanding</p>
                      <p className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(group.pending_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Collection</span>
                      <span className="font-medium text-foreground">{group.collection_percentage}%</span>
                    </div>
                    <Progress value={group.collection_percentage} className="h-1.5" />
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-2 border-t bg-muted/10">
                  {canCollect ? (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-[#0f5132] hover:bg-[#0c4027] text-white gap-1.5"
                        onClick={() => navigate(`/admin/payments/pay/${group.group_id}`)}
                      >
                        <CreditCard className="size-3.5" />
                        Pay Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1.5"
                        onClick={() => navigate(`/admin/payments/pay/${group.group_id}`)}
                      >
                        <Eye className="size-3.5" />
                        Ledger & History
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => navigate(`/admin/payments/pay/${group.group_id}`)}
                    >
                      <Eye className="size-3.5" />
                      View Ledger & History
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GroupReportsTab() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const groupsData = useData(
    useCallback(
      () => listGroupObligations({ pageSize: 100, fetchAll: true }),
      []
    )
  )

  const allObligations = groupsData.data?.obligations ?? []

  // Filter groups according to status and search query
  const filteredGroups = useMemo(() => {
    let list = allObligations
    if (statusFilter !== "ALL") {
      list = list.filter((g) => g.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((g) => g.group_name.toLowerCase().includes(q))
    }
    return list
  }, [allObligations, statusFilter, search])

  // Count per status category for pill counters
  const statusCounts = useMemo(() => {
    const counts = { ALL: allObligations.length, PAID: 0, UNPAID: 0, PARTIAL: 0, NOT_APPLICABLE: 0 }
    for (const g of allObligations) {
      if (g.status === "PAID") counts.PAID += 1
      else if (g.status === "UNPAID") counts.UNPAID += 1
      else if (g.status === "PARTIAL") counts.PARTIAL += 1
      else if (g.status === "NOT_APPLICABLE") counts.NOT_APPLICABLE += 1
    }
    return counts
  }, [allObligations])

  // Summary aggregates of filtered records
  const totals = useMemo(() => {
    return filteredGroups.reduce(
      (acc, g) => {
        const count =
          typeof g.member_count === "number" && !Number.isNaN(g.member_count)
            ? g.member_count
            : typeof (g as any).member_count_snapshot === "number"
            ? (g as any).member_count_snapshot
            : g.expected_amount && g.rate_per_member
            ? Math.round(g.expected_amount / g.rate_per_member)
            : 0

        acc.groupsCount += 1
        acc.membersCount += count
        acc.expected += Number(g.expected_amount) || 0
        acc.collected += Number(g.collected_amount) || 0
        acc.outstanding += Number(g.pending_amount) || 0
        return acc
      },
      { groupsCount: 0, membersCount: 0, expected: 0, collected: 0, outstanding: 0 }
    )
  }, [filteredGroups])

  // Excel / CSV Export (Exports ONLY filtered data!)
  const handleDownloadExcel = () => {
    if (filteredGroups.length === 0) {
      toast.warning("No records found to export with the selected filter.")
      return
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `Group_Payment_Report_${statusFilter}_${dateStr}.csv`
    const headers = [
      "S.No.",
      "Group Name",
      "Status",
      "Total Members",
      "Rate Per Member (Rs)",
      "Expected Amount (Rs)",
      "Collected Amount (Rs)",
      "Outstanding Amount (Rs)",
      "Collection %",
      "Due Date",
      "Billing Period",
    ]

    const rows = filteredGroups.map((g, index) => {
      const count =
        typeof g.member_count === "number" && !Number.isNaN(g.member_count)
          ? g.member_count
          : typeof (g as any).member_count_snapshot === "number"
          ? (g as any).member_count_snapshot
          : g.expected_amount && g.rate_per_member
          ? Math.round(g.expected_amount / g.rate_per_member)
          : 0

      return [
        index + 1,
        g.group_name,
        g.status,
        count,
        g.rate_per_member,
        g.expected_amount,
        g.collected_amount,
        g.pending_amount,
        `${g.collection_percentage}%`,
        g.due_date || "2027-03-31",
        g.billing_period,
      ]
    })

    // Append Totals row to the excel file
    rows.push([
      "TOTAL",
      `Total Groups: ${totals.groupsCount}`,
      "",
      totals.membersCount,
      "",
      totals.expected,
      totals.collected,
      totals.outstanding,
      totals.expected > 0 ? `${Math.round((totals.collected / totals.expected) * 100)}%` : "0%",
      "",
      "",
    ])

    downloadCSV(filename, headers, rows)
    toast.success(`Exported ${filteredGroups.length} filtered records to Excel!`)
  }

  // Print Report (Prints ONLY filtered data!)
  const handlePrint = () => {
    if (filteredGroups.length === 0) {
      toast.warning("No records to print with current filter.")
      return
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800")
    if (!printWindow) {
      toast.error("Please allow popups in your browser to print the report.")
      return
    }

    const printDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const rowsHtml = filteredGroups
      .map((g, idx) => {
        const count =
          typeof g.member_count === "number" && !Number.isNaN(g.member_count)
            ? g.member_count
            : typeof (g as any).member_count_snapshot === "number"
            ? (g as any).member_count_snapshot
            : g.expected_amount && g.rate_per_member
            ? Math.round(g.expected_amount / g.rate_per_member)
            : 0

        const statusColor =
          g.status === "PAID"
            ? "#0f5132"
            : g.status === "UNPAID"
            ? "#842029"
            : g.status === "PARTIAL"
            ? "#664d03"
            : "#495057"

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-weight: 600;">${g.group_name}</td>
            <td style="text-align: center;"><span style="color: ${statusColor}; font-weight: 700; font-size: 11px;">${g.status}</span></td>
            <td style="text-align: center;">${count}</td>
            <td style="text-align: right;">₹${Number(g.rate_per_member).toLocaleString("en-IN")}</td>
            <td style="text-align: right;">₹${Number(g.expected_amount).toLocaleString("en-IN")}</td>
            <td style="text-align: right; color: #0f5132; font-weight: 600;">₹${Number(g.collected_amount).toLocaleString("en-IN")}</td>
            <td style="text-align: right; color: #842029; font-weight: 600;">₹${Number(g.pending_amount).toLocaleString("en-IN")}</td>
            <td style="text-align: center; font-weight: 600;">${g.collection_percentage}%</td>
          </tr>
        `
      })
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>JSSG Federation – Group Payment Report</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 12px; }
            .header { border-bottom: 2px solid #0f5132; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 18px; font-weight: bold; color: #0f5132; margin: 0; }
            .subtitle { font-size: 12px; color: #555; margin-top: 4px; }
            .meta { text-align: right; font-size: 11px; color: #444; }
            .summary-boxes { display: flex; gap: 8px; margin-bottom: 12px; }
            .box { border: 1px solid #ccc; border-radius: 6px; padding: 6px 10px; flex: 1; text-align: center; background: #fafafa; }
            .box-label { font-size: 10px; color: #666; text-transform: uppercase; }
            .box-val { font-size: 14px; font-weight: bold; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
            th { background-color: #f1f5f2; color: #1e4620; text-align: left; padding: 6px 8px; border: 1px solid #ccc; font-weight: 700; font-size: 11px; }
            td { padding: 5px 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #fafafa; }
            .footer-row td { background-color: #e9ecef; font-weight: bold; border-top: 2px solid #0f5132; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">JSSG Federation – Group Payment Report</h1>
              <div class="subtitle">
                Filter Status: <strong>${statusFilter}</strong>
                ${search ? ` | Search: "${search}"` : ""}
                | FY: 2026-2027
              </div>
            </div>
            <div class="meta">
              <div>Printed On: ${printDate}</div>
              <div>Filtered Groups: <strong>${totals.groupsCount}</strong></div>
            </div>
          </div>

          <div class="summary-boxes">
            <div class="box">
              <div class="box-label">Filtered Groups</div>
              <div class="box-val">${totals.groupsCount}</div>
            </div>
            <div class="box">
              <div class="box-label">Total Members</div>
              <div class="box-val">${totals.membersCount}</div>
            </div>
            <div class="box">
              <div class="box-label">Expected Total</div>
              <div class="box-val">₹${totals.expected.toLocaleString("en-IN")}</div>
            </div>
            <div class="box">
              <div class="box-label" style="color: #0f5132;">Collected Total</div>
              <div class="box-val" style="color: #0f5132;">₹${totals.collected.toLocaleString("en-IN")}</div>
            </div>
            <div class="box">
              <div class="box-label" style="color: #842029;">Outstanding Total</div>
              <div class="box-val" style="color: #842029;">₹${totals.outstanding.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>Group Name</th>
                <th style="width: 80px; text-align: center;">Status</th>
                <th style="width: 65px; text-align: center;">Members</th>
                <th style="width: 80px; text-align: right;">Rate / Mbr</th>
                <th style="width: 95px; text-align: right;">Expected</th>
                <th style="width: 95px; text-align: right;">Collected</th>
                <th style="width: 95px; text-align: right;">Outstanding</th>
                <th style="width: 65px; text-align: center;">Collection %</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="footer-row">
                <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL (${totals.groupsCount} Groups):</td>
                <td style="text-align: center;">${totals.membersCount}</td>
                <td></td>
                <td style="text-align: right;">₹${totals.expected.toLocaleString("en-IN")}</td>
                <td style="text-align: right; color: #0f5132;">₹${totals.collected.toLocaleString("en-IN")}</td>
                <td style="text-align: right; color: #842029;">₹${totals.outstanding.toLocaleString("en-IN")}</td>
                <td style="text-align: center;">${totals.expected > 0 ? Math.round((totals.collected / totals.expected) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      {/* Filters & Action Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="size-3.5" />
                Status:
              </span>
              {[
                { id: "ALL", label: "All Groups", count: statusCounts.ALL },
                { id: "PAID", label: "Paid", count: statusCounts.PAID },
                { id: "UNPAID", label: "Unpaid", count: statusCounts.UNPAID },
                { id: "PARTIAL", label: "Partial", count: statusCounts.PARTIAL },
                { id: "NOT_APPLICABLE", label: "N/A", count: statusCounts.NOT_APPLICABLE },
              ].map((tab) => {
                const isActive = statusFilter === tab.id
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "default" : "outline"}
                    size="xs"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`h-7 gap-1 text-xs ${
                      isActive ? "bg-[#0f5132] hover:bg-[#0c4027] text-white" : ""
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Button>
                )
              })}
            </div>

            {/* Export and Print Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 h-8 text-xs"
              >
                <Printer className="size-3.5" />
                Print Report
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadExcel}
                className="gap-1.5 h-8 text-xs bg-[#0f5132] hover:bg-[#0c4027] text-white"
              >
                <FileSpreadsheet className="size-3.5" />
                Download Excel (CSV)
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => groupsData.reload()}
                disabled={groupsData.loading}
                title="Refresh report data"
                className="h-8 w-8"
              >
                <RefreshCw className={`size-3.5 ${groupsData.loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Search bar & Live Filter indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t text-xs">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search filtered groups by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="text-muted-foreground">
              Showing <strong>{filteredGroups.length}</strong> of <strong>{allObligations.length}</strong> groups
              {statusFilter !== "ALL" && (
                <span className="ml-1 text-primary font-medium">({statusFilter} only)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Financial Metrics Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MiniCard label="Filtered Groups" value={String(totals.groupsCount)} />
        <MiniCard label="Total Members" value={totals.membersCount.toLocaleString("en-IN")} />
        <MiniCard label="Expected" value={formatCurrency(totals.expected)} />
        <MiniCard
          label="Collected"
          value={formatCurrency(totals.collected)}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <MiniCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          tone="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Report Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-3.5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Group Payment Summary Report</CardTitle>
              <CardDescription className="text-xs">
                Active Billing Period 2026-2027 • {filteredGroups.length} records in this view
              </CardDescription>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tip: Exporting or printing will reflect this exact filtered view.
            </p>
          </div>
        </CardHeader>

        {groupsData.loading && !groupsData.data ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin" />
            Loading group payment report…
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-1">
            <ReceiptText className="size-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="font-semibold text-foreground">No groups match the filter</p>
            <p className="text-xs">Try selecting a different status filter or clearing your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs">
                  <TableHead className="w-12 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Group Name</TableHead>
                  <TableHead className="w-28 text-center font-bold">Status</TableHead>
                  <TableHead className="w-24 text-center font-bold">Members</TableHead>
                  <TableHead className="w-28 text-right font-bold">Rate/Mbr</TableHead>
                  <TableHead className="w-32 text-right font-bold">Expected</TableHead>
                  <TableHead className="w-32 text-right font-bold">Collected</TableHead>
                  <TableHead className="w-32 text-right font-bold">Outstanding</TableHead>
                  <TableHead className="w-32 text-center font-bold">Progress</TableHead>
                  <TableHead className="w-24 text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((g, idx) => {
                  const count =
                    typeof g.member_count === "number" && !Number.isNaN(g.member_count)
                      ? g.member_count
                      : typeof (g as any).member_count_snapshot === "number"
                      ? (g as any).member_count_snapshot
                      : g.expected_amount && g.rate_per_member
                      ? Math.round(g.expected_amount / g.rate_per_member)
                      : 0

                  return (
                    <TableRow key={g.id || g.group_id} className="text-xs hover:bg-muted/40 transition-colors">
                      <TableCell className="text-center font-mono text-muted-foreground text-[11px]">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="leading-tight">
                          <p className="font-semibold text-xs sm:text-sm">{g.group_name}</p>
                          <p className="text-[10px] text-muted-foreground">Due: {formatDate(g.due_date || "2027-03-31")}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={g.status} />
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium">
                        {count}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        ₹{g.rate_per_member}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(g.expected_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(g.collected_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(g.pending_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <div className="text-[10px] font-medium text-right text-muted-foreground">
                            {g.collection_percentage}%
                          </div>
                          <Progress value={g.collection_percentage} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 text-xs text-primary hover:text-primary/80"
                          onClick={() => navigate(`/admin/payments/pay/${g.group_id}`)}
                        >
                          View &rarr;
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter className="bg-muted/60 font-semibold text-xs">
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold uppercase tracking-wider text-muted-foreground">
                    Total ({totals.groupsCount} Groups):
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-foreground">
                    {totals.membersCount}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {formatCurrency(totals.expected)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.collected)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(totals.outstanding)}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {totals.expected > 0 ? `${Math.round((totals.collected / totals.expected) * 100)}%` : "0%"}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

function MiniCard({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card size="sm" className="p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-heading text-lg font-bold mt-0.5 ${tone}`}>{value}</p>
    </Card>
  )
}

function TransactionsTab() {
  const [page, setPage] = useState(1)
  const [memberId, setMemberId] = useState("")
  const [memberError, setMemberError] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PaymentRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const detailRequest = useRef(0)

  const payments = useData(
    useCallback(
      () => listPayments({ memberId: memberId || undefined, page, pageSize: TRANSACTIONS_PAGE_SIZE }),
      [memberId, page]
    ),
    [memberId, page]
  )

  const rows = payments.data?.payments ?? []
  const memberFiltered = Boolean(memberId)
  const hasNextPage = memberFiltered ? rows.length === TRANSACTIONS_PAGE_SIZE : undefined

  const handleSearchChange = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setMemberError(null)
      setMemberId("")
      setPage(1)
      return
    }
    if (!UUID_PATTERN.test(trimmed)) {
      setMemberError("Enter a complete member ID (UUID) to filter payments.")
      return
    }
    setMemberError(null)
    setMemberId(trimmed)
    setPage(1)
  }, [])

  const openDetails = useCallback(async (payment: PaymentRecord) => {
    const request = detailRequest.current + 1
    detailRequest.current = request
    setDetail(payment)
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const fresh = await getPaymentById(payment.id)
      if (detailRequest.current === request) setDetail(fresh)
    } catch (error) {
      if (detailRequest.current === request) {
        setDetailError(getErrorMessage(error, "Could not load payment details."))
      }
    } finally {
      if (detailRequest.current === request) setDetailLoading(false)
    }
  }, [])

  const handleDetailOpenChange = (open: boolean) => {
    if (!open) detailRequest.current += 1
    setDetailOpen(open)
  }

  const columns: Column<PaymentRecord>[] = [
    {
      id: "payment",
      header: "Payment",
      cell: (payment) => (
        <div className="leading-tight">
          <p className="font-medium">{shortId(payment.id)}</p>
          <p className="text-xs text-muted-foreground">Order {shortId(payment.order_id)}</p>
        </div>
      ),
    },
    { id: "member", header: "Member", cell: (payment) => <span className="font-mono text-xs">{shortId(payment.member_id)}</span> },
    { id: "fee", header: "Fee / Group", cell: (payment) => <span className="font-mono text-xs">{shortId(payment.fee_id)}</span> },
    { id: "amount", header: "Amount", cell: (payment) => <span className="font-medium">{formatAmount(payment.amount)}</span> },
    { id: "status", header: "Status", cell: (payment) => <StatusBadge status={payment.status} /> },
    {
      id: "provider",
      header: "Provider",
      cell: (payment) => (
        <div className="leading-tight">
          <p className="capitalize">{payment.provider || "—"}</p>
          <p className="max-w-36 truncate text-xs text-muted-foreground">{payment.provider_reference ?? "—"}</p>
        </div>
      ),
    },
    { id: "created", header: "Created", cell: (payment) => formatDateTime(payment.created_at) },
    { id: "paid", header: "Paid on", cell: (payment) => (payment.paid_at ? formatDateTime(payment.paid_at) : "—") },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (payment) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-xs" onClick={() => openDetails(payment)} aria-label="View payment details">
            <Eye />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {memberError && <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">{memberError}</p>}
      {payments.error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{getErrorMessage(payments.error, "Could not load payments.")}</p>
          <Button variant="ghost" size="sm" onClick={payments.reload}>
            Retry
          </Button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        loading={payments.loading}
        rowKey={(payment) => payment.id}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Filter by member ID (UUID)…"
        toolbar={
          <Button variant="outline" size="sm" onClick={payments.reload} disabled={payments.loading}>
            <RefreshCw className={payments.loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
        emptyTitle="No payments found"
        emptyDescription={
          memberFiltered
            ? "No payments were returned for this member ID."
            : "Payments will appear here once transactions are created."
        }
        pageSize={TRANSACTIONS_PAGE_SIZE}
        currentPage={page}
        total={payments.data?.pagination?.total ?? rows.length}
        hasNextPage={hasNextPage}
        showRecordCount={!memberFiltered}
        onPageChange={setPage}
      />
      {memberFiltered && (
        <p className="mt-2 text-xs text-muted-foreground">
          Exact totals are unavailable while filtering by member ID because the API omits pagination metadata for this query.
        </p>
      )}
      <PaymentDetailsDialog
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        payment={detail}
        loading={detailLoading}
        error={detailError}
      />
    </>
  )
}

function PaymentDetailsDialog({
  open,
  onOpenChange,
  payment,
  loading,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: PaymentRecord | null
  loading: boolean
  error: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription>{payment ? `Order ${payment.order_id}` : "Payment record"}</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!payment && !loading && <p className="text-sm text-muted-foreground">No payment selected.</p>}

        {payment && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Amount" value={formatAmount(payment.amount)} />
              <DetailItem label="Status" value={<StatusBadge status={payment.status} />} />
              <DetailItem label="Provider" value={payment.provider || "—"} />
              <DetailItem label="Provider reference" value={payment.provider_reference} mono />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">References and timeline</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Payment ID" value={payment.id} mono />
                <DetailItem label="Order ID" value={payment.order_id} mono />
                <DetailItem label="Member ID" value={payment.member_id} mono />
                <DetailItem label="Fee ID" value={payment.fee_id} mono />
                <DetailItem label="Created" value={formatDateTime(payment.created_at)} />
                <DetailItem label="Paid at" value={payment.paid_at ? formatDateTime(payment.paid_at) : "—"} />
                <DetailItem label="Expires at" value={payment.expires_at ? formatDateTime(payment.expires_at) : "—"} />
                <DetailItem label="Updated" value={formatDateTime(payment.updated_at)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Transaction history</h3>
                {loading && <span className="text-xs text-muted-foreground">Refreshing…</span>}
              </div>
              {payment.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions recorded for this payment.</p>
              ) : (
                <div className="space-y-2">
                  {payment.transactions.map((transaction) => {
                    const amount = formatAmount(transaction.amount)
                    return (
                      <div
                        key={transaction.id}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium">{transaction.transaction_type.replaceAll("_", " ")}</p>
                          <p className="break-all text-xs text-muted-foreground">
                            {transaction.provider_transaction_id ?? transaction.id}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {amount !== "—" && <span className="font-medium">{amount}</span>}
                          <StatusBadge status={transaction.status} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={`break-all font-medium ${mono ? "font-mono text-xs" : "text-sm"}`}>{value || "—"}</div>
    </div>
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
