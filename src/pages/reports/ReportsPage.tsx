import { useCallback } from "react"
import { Download, FileText, Landmark, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { useData } from "@/lib/useData"
import { downloadCSV } from "@/lib/csv"
import { formatCurrency, formatDate, safePercent } from "@/lib/format"
import { getDirectory, getFeeOutstandingReport, getGroupSummary, type DirectoryRow, type FeeOutstandingRow, type GroupSummaryRow } from "@/services/api/reports"

function ReportCardLink({
  icon,
  title,
  description,
  target,
}: {
  icon: React.ReactNode
  title: string
  description: string
  target: "directory" | "groups" | "fees"
}) {
  return (
    <a
      href={`#report-${target}`}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </a>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Directory"
        description="Access community data, directories and administrative reports"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportCardLink icon={<FileText className="size-4" />} title="Member Directory" description="All registered members with contact details" target="directory" />
        <ReportCardLink icon={<Landmark className="size-4" />} title="Group Summary" description="Members, post holders and activity per group" target="groups" />
        <ReportCardLink icon={<ReceiptText className="size-4" />} title="Outstanding Fees" description="Fee collection status across all groups" target="fees" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Member Directory</TabsTrigger>
          <TabsTrigger value="groups">Group Summary</TabsTrigger>
          <TabsTrigger value="fees">Outstanding Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="pt-4">
          <DirectoryReport />
        </TabsContent>
        <TabsContent value="groups" className="pt-4">
          <GroupSummaryReport />
        </TabsContent>
        <TabsContent value="fees" className="pt-4">
          <OutstandingReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DirectoryReport() {
  const data = useData(useCallback(() => getDirectory(), []))
  const cols: Column<DirectoryRow>[] = [
    { id: "regNo", header: "Reg No", cell: (r) => r.regNo },
    { id: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { id: "gender", header: "Gender", cell: (r) => r.gender },
    { id: "group", header: "Group", cell: (r) => r.group },
    { id: "city", header: "City", cell: (r) => `${r.city}, ${r.state}` },
    { id: "phone", header: "Phone", cell: (r) => r.phone },
    { id: "email", header: "Email", cell: (r) => r.email },
    { id: "joined", header: "Joined", cell: (r) => formatDate(r.joinedOn) },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ]
  return (
    <div className="space-y-4">
      <p id="report-directory" className="sr-only">Member Directory</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.data?.length?.toLocaleString() ?? "…"} members across all groups
        </p>
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(
              "member-directory.csv",
              ["Reg No", "Name", "Gender", "Group", "City", "State", "Phone", "Email", "Joined", "Status"],
              (data.data ?? []).map((r) => [r.regNo, r.name, r.gender, r.group, r.city, r.state, r.phone, r.email, formatDate(r.joinedOn), r.status])
            )
          }
        >
          <Download />
          Export CSV
        </Button>
      </div>
      <DataTable columns={cols} data={data.data ?? []} loading={data.loading} rowKey={(r) => r.regNo} pageSize={8}
        searchKeys={(r) => `${r.name} ${r.regNo} ${r.group} ${r.city} ${r.email}`} searchPlaceholder="Search directory…" />
    </div>
  )
}

function GroupSummaryReport() {
  const data = useData(useCallback(() => getGroupSummary(), []))
  const cols: Column<GroupSummaryRow>[] = [
    {
      id: "group",
      header: "Group",
      cell: (r) => (
        <div className="max-w-72 leading-tight">
          <p className="truncate font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.code}</p>
        </div>
      ),
    },
    { id: "city", header: "Location", cell: (r) => `${r.city}, ${r.state}` },
    { id: "members", header: "Members", cell: (r) => r.members },
    { id: "postHolders", header: "Post holders", cell: (r) => r.postHolders },
    { id: "events", header: "Events", cell: (r) => r.events },
    {
      id: "collection",
      header: "Fee collection",
      cell: (r) => (
        <div className="w-32">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{r.collectionRate}%</span>
          </div>
          <Progress value={r.collectionRate} className="mt-1 h-1.5" />
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.membershipStatus} /> },
  ]
  return (
    <div className="space-y-4">
      <p id="report-groups" className="sr-only">Group Summary</p>
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(
              "group-summary.csv",
              ["Code", "Group", "City", "State", "Members", "Post Holders", "Events", "Collection %", "Status"],
              (data.data ?? []).map((r) => [r.code, r.name, r.city, r.state, r.members, r.postHolders, r.events, r.collectionRate, r.membershipStatus])
            )
          }
        >
          <Download />
          Export CSV
        </Button>
      </div>
      <DataTable columns={cols} data={data.data ?? []} loading={data.loading} rowKey={(r) => r.id} pageSize={8}
        searchKeys={(r) => `${r.name} ${r.code} ${r.city} ${r.state}`} searchPlaceholder="Search groups…" />
    </div>
  )
}

function OutstandingReport() {
  const data = useData(useCallback(() => getFeeOutstandingReport(), []))
  const totalOutstanding = (data.data ?? []).reduce((sum, r) => sum + r.outstanding, 0)
  const cols: Column<FeeOutstandingRow>[] = [
    { id: "group", header: "Group", cell: (r) => <span className="font-medium">{r.group}</span> },
    { id: "members", header: "Members", cell: (r) => r.totalMembers },
    { id: "fee", header: "Fee", cell: (r) => formatCurrency(r.feeAmount) },
    { id: "expected", header: "Expected", cell: (r) => formatCurrency(r.expected) },
    { id: "collected", header: "Collected", cell: (r) => formatCurrency(r.collected) },
    {
      id: "outstanding",
      header: "Outstanding",
      cell: (r) => <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(r.outstanding)}</span>,
    },
    {
      id: "rate",
      header: "Collection",
      cell: (r) => (
        <div className="w-28">
          <div className="flex justify-between text-xs">
            <span>{safePercent(r.collected, r.expected)}%</span>
          </div>
          <Progress value={r.collectionRate} className="mt-1 h-1.5" />
        </div>
      ),
    },
    { id: "paid", header: "Members paid", cell: (r) => `${r.membersPaid} / ${r.totalMembers}` },
  ]
  return (
    <div className="space-y-4">
      <p id="report-fees" className="sr-only">Outstanding Fees</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total outstanding: <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(totalOutstanding)}</span>
        </p>
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(
              "outstanding-fees.csv",
              ["Group", "Members", "Fee", "Expected", "Collected", "Outstanding", "Collection %", "Members Paid", "Members Unpaid"],
              (data.data ?? []).map((r) => [r.group, r.totalMembers, r.feeAmount, r.expected, r.collected, r.outstanding, r.collectionRate, r.membersPaid, r.membersUnpaid])
            )
          }
        >
          <Download />
          Export CSV
        </Button>
      </div>
      <DataTable columns={cols} data={data.data ?? []} loading={data.loading} rowKey={(r) => r.group} pageSize={8}
        searchKeys={(r) => `${r.group}`} searchPlaceholder="Search groups…" />
    </div>
  )
}