import { useCallback, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Eye,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Share2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { useData } from "@/lib/useData"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { getErrorMessage } from "@/lib/apiClient"
import { loadRazorpayScript } from "@/lib/razorpay"
import type {
  GroupObligationRecord,
  GroupPaymentLinkResponse,
  PaymentRecord,
} from "@/types"
import {
  createGroupCheckoutOrder,
  createGroupPaymentLink,
  getGroupObligationDetail,
  getPaymentById,
  getPaymentDashboardSummary,
  listGroupObligations,
  listPayments,
  verifyGroupCheckoutPayment,
} from "@/services/api/payments"

const TRANSACTIONS_PAGE_SIZE = 8
const GROUPS_PAGE_SIZE = 9
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

  const handleRecordPayment = () => {
    toast.info("Select a group below to record payments via Super Admin Checkout or Payment Link.")
    setActiveTab("status")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Module"
        description="Dual-workflow group payment collection and transaction ledger"
        actions={
          <Button onClick={handleRecordPayment}>
            <Plus />
            Collect Payment
          </Button>
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
        </TabsList>
        <TabsContent value="status" className="pt-2">
          <GroupStatusTab onLedgerUpdated={summary.reload} />
        </TabsContent>
        <TabsContent value="transactions" className="pt-2">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupStatusTab({ onLedgerUpdated }: { onLedgerUpdated: () => void }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [checkoutTarget, setCheckoutTarget] = useState<GroupObligationRecord | null>(null)
  const [linkTarget, setLinkTarget] = useState<GroupObligationRecord | null>(null)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)

  const groupsData = useData(
    useCallback(
      () => listGroupObligations({ search: searchQuery, page, pageSize: GROUPS_PAGE_SIZE }),
      [searchQuery, page]
    )
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearchQuery(search.trim())
  }

  const handleRefresh = () => {
    groupsData.reload()
    onLedgerUpdated()
  }

  const rows = groupsData.data?.obligations ?? []
  const pagination = groupsData.data?.pagination

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
                setPage(1)
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/30" />
              <CardContent className="h-36 py-4" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((group) => {
            const isPaid = group.status === "PAID"
            const isNotApplicable = group.status === "NOT_APPLICABLE"
            const canCollect = !isPaid && !isNotApplicable && group.pending_amount > 0

            return (
              <Card key={group.id} className="flex flex-col justify-between overflow-hidden shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate font-semibold text-base" title={group.group_name}>
                        {group.group_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 pt-1 text-xs">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>
                          {group.member_count} eligible {group.member_count === 1 ? "member" : "members"}
                        </span>
                        <span>•</span>
                        <span>₹{group.rate_per_member}/member</span>
                      </CardDescription>
                    </div>
                    <StatusBadge status={group.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-3">
                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2.5 text-center">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Expected</p>
                      <p className="font-semibold text-xs sm:text-sm">{formatCurrency(group.expected_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Collected</p>
                      <p className="font-semibold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(group.collected_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Outstanding</p>
                      <p className="font-semibold text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                        {formatCurrency(group.pending_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Collection Progress</span>
                      <span className="font-medium text-foreground">{group.collection_percentage}%</span>
                    </div>
                    <Progress value={group.collection_percentage} className="h-2" />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-2 border-t bg-muted/10">
                  <div className="grid w-full grid-cols-2 gap-2">
                    {/* WORKFLOW A: Pay Now (Super Admin Checkout) */}
                    <Button
                      size="sm"
                      disabled={!canCollect}
                      onClick={() => setCheckoutTarget(group)}
                      className="w-full"
                    >
                      <CreditCard className="size-4" />
                      Pay Now
                    </Button>

                    {/* WORKFLOW B: Share Payment Link (Group Admin Link) */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canCollect}
                      onClick={() => setLinkTarget(group)}
                      className="w-full"
                    >
                      <Share2 className="size-4" />
                      Share Link
                    </Button>
                  </div>

                  {/* View Details */}
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => setDetailTargetId(group.group_id)}
                  >
                    <Eye className="size-3.5 mr-1" />
                    View Ledger & History
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <p>
            Showing {(page - 1) * GROUPS_PAGE_SIZE + 1} to{" "}
            {Math.min(page * GROUPS_PAGE_SIZE, pagination.total)} of {pagination.total} groups
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="px-2">
              Page {page} of {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Pay Now Checkout Modal */}
      <PayNowModal
        open={Boolean(checkoutTarget)}
        onOpenChange={(open) => !open && setCheckoutTarget(null)}
        group={checkoutTarget}
        onSuccess={() => {
          setCheckoutTarget(null)
          handleRefresh()
        }}
      />

      {/* Share Payment Link Modal */}
      <SharePaymentLinkModal
        open={Boolean(linkTarget)}
        onOpenChange={(open) => !open && setLinkTarget(null)}
        group={linkTarget}
        onLinkCreated={handleRefresh}
      />

      {/* Group Obligation Details Modal */}
      <GroupPaymentDetailsModal
        groupId={detailTargetId}
        onOpenChange={(open) => !open && setDetailTargetId(null)}
      />
    </div>
  )
}

function PayNowModal({
  open,
  onOpenChange,
  group,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupObligationRecord | null
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  if (!group) return null

  const handleProceedPayment = async () => {
    setSubmitting(true)
    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        toast.error("Could not load Razorpay SDK. Please check your internet connection.")
        setSubmitting(false)
        return
      }

      // 2. Create Razorpay order on backend for current pending amount
      const order = await createGroupCheckoutOrder(group.group_id)

      // 3. Open Razorpay Checkout modal
      const options = {
        key: order.razorpay_key_id,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: "JSSG Federation",
        description: `Annual Contribution - ${order.group_name}`,
        order_id: order.razorpay_order_id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            toast.loading("Verifying payment with gateway...", { id: "checkout-verify" })
            await verifyGroupCheckoutPayment(group.group_id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success(`Payment of ${formatCurrency(order.amount)} verified successfully!`, {
              id: "checkout-verify",
            })
            onSuccess()
          } catch (err) {
            toast.error(getErrorMessage(err, "Payment signature verification failed."), {
              id: "checkout-verify",
            })
          }
        },
        prefill: {
          name: "Super Admin",
          email: "admin@jssg.org",
        },
        theme: {
          color: "#991B1B",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
            toast.info("Payment checkout cancelled.")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`)
        setSubmitting(false)
      })
      rzp.open()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not initiate payment order."))
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Super Admin – Pay Now</DialogTitle>
          <DialogDescription>
            Pay the outstanding contribution for <strong>{group.group_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Eligible Members:</span>
              <span className="font-medium">{group.member_count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rate Per Member:</span>
              <span className="font-medium">₹{group.rate_per_member}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Expected:</span>
              <span className="font-medium">{formatCurrency(group.expected_amount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Already Collected:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(group.collected_amount)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-sm">
              <span>Payable Now (Outstanding):</span>
              <span className="text-rose-600 dark:text-rose-400">{formatCurrency(group.pending_amount)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Razorpay Checkout supports UPI, Net Banking, and Cards. Upon successful payment capture, the common ledger
            will be updated immediately.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleProceedPayment} disabled={submitting}>
            <CreditCard className="size-4 mr-1" />
            {submitting ? "Opening Checkout…" : `Proceed to Pay ${formatCurrency(group.pending_amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SharePaymentLinkModal({
  open,
  onOpenChange,
  group,
  onLinkCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupObligationRecord | null
  onLinkCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [linkData, setLinkData] = useState<GroupPaymentLinkResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOrCreateLink = useCallback(async () => {
    if (!group) return
    setLoading(true)
    try {
      const res = await createGroupPaymentLink(group.group_id)
      setLinkData(res)
      onLinkCreated()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not generate payment link."))
    } finally {
      setLoading(false)
    }
  }, [group, onLinkCreated])

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen && group) {
      fetchOrCreateLink()
    } else {
      setLinkData(null)
      setCopied(false)
    }
    onOpenChange(nextOpen)
  }

  const handleCopy = () => {
    if (!linkData?.short_url) return
    navigator.clipboard.writeText(linkData.short_url)
    setCopied(true)
    toast.success("Payment link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    if (!linkData?.short_url || !group) return
    const text = encodeURIComponent(
      `*JSSG Federation Annual Contribution*\n` +
        `Group: ${group.group_name}\n` +
        `Outstanding Amount: ${formatCurrency(linkData.amount)}\n\n` +
        `Please complete the payment using this official link:\n${linkData.short_url}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank")
  }

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Payment Link – Group Admin</DialogTitle>
          <DialogDescription>
            Generate a hosted Razorpay payment link for <strong>{group.group_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <RefreshCw className="size-6 animate-spin" />
              <p>Generating Razorpay Payment Link…</p>
            </div>
          ) : linkData ? (
            <>
              <div className="rounded-lg border p-3 bg-muted/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Group:</span>
                  <span className="font-medium">{linkData.group_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payable Amount:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(linkData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Link ID:</span>
                  <span className="font-mono">{linkData.payment_link_id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Payment Link URL</label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={linkData.short_url} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={handleCopy} title="Copy Link">
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Group Admins can open this link directly on mobile devices to pay via UPI, Net Banking, or Cards.
                Razorpay webhooks will automatically credit the common ledger upon payment completion.
              </p>
            </>
          ) : (
            <p className="text-sm text-destructive">Failed to load payment link.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {linkData && (
            <Button onClick={handleWhatsAppShare} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Share2 className="size-4 mr-1" />
              Share on WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GroupPaymentDetailsModal({
  groupId,
  onOpenChange,
}: {
  groupId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const detailData = useData(
    useCallback(() => (groupId ? getGroupObligationDetail(groupId) : Promise.resolve(null)), [groupId])
  )

  const detail = detailData.data
  const obligation = detail?.obligation
  const transactions = detail?.transactions ?? []

  return (
    <Dialog open={Boolean(groupId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Group Payment Ledger & History</DialogTitle>
          <DialogDescription>{obligation ? obligation.group_name : "Payment Ledger"}</DialogDescription>
        </DialogHeader>

        {detailData.loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <RefreshCw className="size-6 animate-spin" />
            <p>Loading ledger details…</p>
          </div>
        ) : obligation ? (
          <div className="space-y-5">
            {/* Obligation Snapshot Grid */}
            <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Billing Period {obligation.billing_period}
                </span>
                <StatusBadge status={obligation.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Eligible Members</p>
                  <p className="font-semibold">{obligation.member_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate / Member</p>
                  <p className="font-semibold">₹{obligation.rate_per_member}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected</p>
                  <p className="font-semibold">{formatCurrency(obligation.expected_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(obligation.collected_amount)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t text-xs">
                <span className="text-muted-foreground">Outstanding Balance:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                  {formatCurrency(obligation.pending_amount)}
                </span>
              </div>
            </div>

            {/* Active Payment Link (if any) */}
            {obligation.active_payment_link_url && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-foreground">Active Payment Link</p>
                  <p className="truncate font-mono text-muted-foreground">{obligation.active_payment_link_url}</p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(obligation.active_payment_link_url!)
                    toast.success("Active link copied!")
                  }}
                >
                  <Copy className="size-3 mr-1" />
                  Copy
                </Button>
              </div>
            )}

            {/* Transactions History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Payment Transactions ({transactions.length})</h3>
                {detailData.loading && <span className="text-xs text-muted-foreground">Refreshing…</span>}
              </div>

              {transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No verified payments recorded yet for this group.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tx.transaction_type.replaceAll("_", " ")}</p>
                          {tx.payment_method && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-mono text-muted-foreground">
                              {tx.payment_method}
                            </span>
                          )}
                        </div>
                        <p className="break-all font-mono text-xs text-muted-foreground">
                          {tx.razorpay_payment_id ?? tx.provider_transaction_id ?? tx.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.paid_at ? formatDateTime(tx.paid_at) : formatDateTime(tx.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.amount !== null && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(tx.amount)}
                          </span>
                        )}
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ledger found for this group.</p>
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
    )
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
