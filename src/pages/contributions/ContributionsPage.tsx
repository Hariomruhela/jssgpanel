import { useState, useEffect, useMemo, useRef } from "react"
import {
  Heart,
  HeartHandshake,
  Search,
  Download,
  Printer,
  Plus,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  Users,
  Building,
  RefreshCw,
  IndianRupee,
  Wallet,
} from "lucide-react"
import type { ContributionRecord } from "@/types"
import { listContributions } from "@/services/api/contributions"
import { listGroups } from "@/services/api/groups"
import { ContributionReceiptModal } from "@/components/contributions/ContributionReceiptModal"
import { AddContributionModal } from "@/components/contributions/AddContributionModal"

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<ContributionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [selectedMethod, setSelectedMethod] = useState("all")
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

  // Modals state
  const [activeReceipt, setActiveReceipt] = useState<ContributionRecord | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const printTableRef = useRef<HTMLDivElement>(null)

  // Fetch groups
  useEffect(() => {
    let mounted = true
    listGroups({ pageSize: 100 })
      .then((res) => {
        if (mounted && res?.groups) {
          setGroups(res.groups.map((g) => ({ id: g.id, name: g.name })))
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  // Fetch contributions
  const fetchRecords = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await listContributions({ fetchAll: true })
      setContributions(res.items || [])
    } catch (e) {
      console.error("Failed to load contributions", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Filtered list
  const filteredContributions = useMemo(() => {
    let list = contributions

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.member_name?.toLowerCase().includes(q) ||
          c.donor_name?.toLowerCase().includes(q) ||
          c.group_name?.toLowerCase().includes(q) ||
          c.transaction_id?.toLowerCase().includes(q) ||
          c.receipt_no?.toLowerCase().includes(q) ||
          c.donor_phone?.includes(q) ||
          c.purpose?.toLowerCase().includes(q)
      )
    }

    if (selectedGroup !== "all") {
      list = list.filter((c) => c.group_id === selectedGroup || c.group_name === selectedGroup)
    }

    if (selectedMethod !== "all") {
      list = list.filter((c) => {
        const pm = (c.payment_method || "").toUpperCase()
        if (selectedMethod === "ONLINE") return pm.includes("ONLINE") || pm.includes("UPI")
        if (selectedMethod === "CASH") return pm.includes("CASH")
        if (selectedMethod === "CHEQUE") return pm.includes("CHEQUE")
        if (selectedMethod === "BANK_TRANSFER") return pm.includes("BANK") || pm.includes("RTGS") || pm.includes("NEFT")
        return true
      })
    }

    return list
  }, [contributions, searchQuery, selectedGroup, selectedMethod])

  // Summary Metrics calculated on filtered list
  const metrics = useMemo(() => {
    const totalCollected = filteredContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const count = filteredContributions.length
    const avg = count > 0 ? Math.round(totalCollected / count) : 0
    const highest = filteredContributions.reduce((max, c) => Math.max(max, Number(c.amount || 0)), 0)

    return {
      totalCollected,
      count,
      avg,
      highest,
    }
  }, [filteredContributions])

  // Copy transaction ID handler
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    const headers = [
      "Receipt No",
      "Member / Contributor Name",
      "Phone",
      "Group Name",
      "Amount (INR)",
      "Payment Method",
      "Transaction ID",
      "Purpose",
      "Date",
      "Status",
    ]

    const rows = filteredContributions.map((c) => [
      `"${c.receipt_no || c.id}"`,
      `"${c.member_name || c.donor_name || 'N/A'}"`,
      `"${c.donor_phone || ''}"`,
      `"${c.group_name || 'General'}"`,
      c.amount,
      `"${c.payment_method || 'ONLINE'}"`,
      `"${c.transaction_id || ''}"`,
      `"${c.purpose || ''}"`,
      `"${c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-IN') : ''}"`,
      `"${c.status}"`,
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `JSSG_Contributions_Report_${new Date().toISOString().substring(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Print filtered report
  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Contribution Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            सदस्य सहयोग, दान एवं रसीद प्रबंधन (Voluntary member donations, transaction records & receipt generation)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            title="Refresh list"
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Excel
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Print Report
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Record Contribution
          </button>
        </div>
      </div>

      {/* 4 Metric / KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected */}
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-xs dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Contributions
            </span>
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            ₹{metrics.totalCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            कुल एकत्रित सहयोग राशि
          </p>
        </div>

        {/* Total Donors / Transactions */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-5 shadow-xs dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Total Donors
            </span>
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {metrics.count}
          </div>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400 font-medium">
            कुल दानकर्ता / रसीद संख्या
          </p>
        </div>

        {/* Average Contribution */}
        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-5 shadow-xs dark:border-purple-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
              Average Donation
            </span>
            <div className="rounded-lg bg-purple-600 p-2 text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            ₹{metrics.avg.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-purple-700 dark:text-purple-400 font-medium">
            औसत प्रति दान राशि
          </p>
        </div>

        {/* Top Single Contribution */}
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-xs dark:border-amber-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Top Contribution
            </span>
            <div className="rounded-lg bg-amber-600 p-2 text-white">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            ₹{metrics.highest.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
            उच्चतम एकल सहयोग
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Member, Group, Transaction ID, Phone..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Building className="h-4 w-4 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Groups ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Wallet className="h-4 w-4 text-slate-400" />
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Modes</option>
              <option value="ONLINE">Online / UPI</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          {(searchQuery || selectedGroup !== "all" || selectedMethod !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedGroup("all")
                setSelectedMethod("all")
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline dark:text-rose-400"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Contributions Table Card */}
      <div
        ref={printTableRef}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Contribution Transactions ({filteredContributions.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing all matching voluntary contributions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Receipt No</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Member / Donor Name</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Group Name</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Mode & Purpose</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Transaction ID</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right print:hidden">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                    Loading contributions...
                  </td>
                </tr>
              ) : filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <HeartHandshake className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-sm">No contributions found matching your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search filters or click "Record Contribution" to add a new record.</p>
                  </td>
                </tr>
              ) : (
                filteredContributions.map((item) => {
                  const dateStr = item.paid_at
                    ? new Date(item.paid_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"

                  const isCopied = copiedId === item.id

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/50"
                    >
                      {/* Receipt No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {item.receipt_no || `REC-${item.id.substring(0, 8).toUpperCase()}`}
                      </td>

                      {/* Member / Donor Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm dark:text-slate-100">
                          {item.member_name || item.donor_name || "Anonymous Donor"}
                        </div>
                        {item.donor_phone && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.donor_phone}
                          </div>
                        )}
                      </td>

                      {/* Group Name */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Building className="h-3 w-3 text-slate-400" />
                          {item.group_name || "Federation General"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300">
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Mode & Purpose */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 uppercase text-[11px] dark:text-slate-200">
                          {item.payment_method || "ONLINE"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px] dark:text-slate-400" title={item.purpose || "General"}>
                          {item.purpose || "General Welfare"}
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[130px]" title={item.transaction_id || "N/A"}>
                            {item.transaction_id || "N/A"}
                          </span>
                          {item.transaction_id && (
                            <button
                              onClick={() => handleCopy(item.transaction_id!, item.id)}
                              title="Copy transaction ID"
                              className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition dark:hover:bg-slate-700"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Receipt Action Button */}
                      <td className="py-3.5 px-4 text-right print:hidden">
                        <button
                          onClick={() => setActiveReceipt(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {activeReceipt && (
        <ContributionReceiptModal
          contribution={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Add Contribution Modal */}
      {isAddModalOpen && (
        <AddContributionModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newRecord) => {
            setContributions((prev) => [newRecord, ...prev])
            setActiveReceipt(newRecord) // Automatically open the receipt for printing
          }}
        />
      )}
    </div>
  )
}
