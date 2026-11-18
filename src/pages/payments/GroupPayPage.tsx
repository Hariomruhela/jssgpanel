import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/StatusBadge"
import { useData } from "@/lib/useData"
import { formatCurrency, formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/apiClient"
import { loadRazorpayScript } from "@/lib/razorpay"
import {
  createGroupCheckoutOrder,
  getGroupObligationDetail,
  verifyGroupCheckoutPayment,
} from "@/services/api/payments"
import type { GroupObligationRecord } from "@/types"

export default function GroupPayPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()

  const detailData = useData(
    useCallback(() => {
      if (!groupId) throw new Error("Group ID is required")
      return getGroupObligationDetail(groupId)
    }, [groupId])
  )

  const group: GroupObligationRecord | undefined = detailData.data?.obligation

  const [amountToPay, setAmountToPay] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)
  const [lastPaymentAmount, setLastPaymentAmount] = useState<number>(0)

  // Initialize selected amount to the entire pending balance once loaded
  useEffect(() => {
    if (group && group.pending_amount > 0 && amountToPay === 0 && !paymentSuccess) {
      setAmountToPay(group.pending_amount)
    }
  }, [group, amountToPay, paymentSuccess])

  const pendingAmount = group?.pending_amount ?? 0
  const expectedAmount = group?.expected_amount ?? 0
  const collectedAmount = group?.collected_amount ?? 0
  const dueDateStr = group?.due_date || "2027-03-31"

  // Quick preset selections
  const setPercentageAmount = (pct: number) => {
    if (!pendingAmount) return
    const calculated = Math.round((pendingAmount * pct) / 100)
    setAmountToPay(Math.max(1, calculated))
  }

  // Handle manual input change
  const handleAmountChange = (valStr: string) => {
    const parsed = Number(valStr)
    if (Number.isNaN(parsed)) {
      setAmountToPay(0)
      return
    }
    // Cap at pending amount
    if (parsed > pendingAmount) {
      setAmountToPay(pendingAmount)
      toast.info(`Amount capped at outstanding balance of ${formatCurrency(pendingAmount)}`)
    } else {
      setAmountToPay(parsed)
    }
  }

  // Calculated metrics
  const currentCollectionPct = expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 0
  const newPaymentPct = expectedAmount > 0 ? (amountToPay / expectedAmount) * 100 : 0
  const projectedCollected = collectedAmount + amountToPay
  const projectedPct = expectedAmount > 0 ? Math.min(100, (projectedCollected / expectedAmount) * 100) : 0
  const remainingAfterPayment = Math.max(0, expectedAmount - projectedCollected)

  // Due Date calculation (Days remaining / Overdue)
  const calculateDueStatus = (dStr: string) => {
    const due = new Date(dStr.length === 10 ? `${dStr}T00:00:00` : dStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, tone: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900" }
    } else if (diffDays === 0) {
      return { text: "Due today", tone: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900" }
    } else if (diffDays <= 15) {
      return { text: `Due in ${diffDays} days`, tone: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900" }
    }
    return { text: `Due on ${formatDate(dStr)}`, tone: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900" }
  }

  const dueStatus = calculateDueStatus(dueDateStr)

  // Proceed with Payment
  const handleProceedPayment = async () => {
    if (!group || !groupId) return
    if (amountToPay <= 0) {
      toast.error("Please enter a valid amount greater than ₹0.")
      return
    }
    if (amountToPay > pendingAmount) {
      toast.error(`Amount cannot exceed the pending balance of ${formatCurrency(pendingAmount)}.`)
      return
    }

    setSubmitting(true)
    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        toast.error("Could not load Razorpay SDK. Please check your internet connection.")
        setSubmitting(false)
        return
      }

      // 2. Create Razorpay order on backend for the SELECTED amount
      const order = await createGroupCheckoutOrder(groupId, {
        amount: amountToPay,
        billingPeriod: group.billing_period,
      })

      // 3. Open Razorpay Checkout modal
      const options = {
        key: order.razorpay_key_id,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: "JSSG Federation",
        description: `Group Contribution - ${order.group_name}`,
        order_id: order.razorpay_order_id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            toast.loading("Verifying payment with gateway...", { id: "checkout-verify" })
            await verifyGroupCheckoutPayment(groupId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success(`Payment of ${formatCurrency(order.amount)} verified successfully!`, {
              id: "checkout-verify",
            })
            setLastPaymentAmount(order.amount)
            setPaymentSuccess(true)
            detailData.reload()
          } catch (err) {
            toast.error(getErrorMessage(err, "Payment signature verification failed."), {
              id: "checkout-verify",
            })
          } finally {
            setSubmitting(false)
          }
        },
        prefill: {
          name: "Super Admin",
          email: "admin@jssg.org",
        },
        theme: {
          color: "#0f5132",
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

  if (detailData.loading && !group) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/payments")}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        </div>
        <Card className="animate-pulse">
          <CardHeader className="h-28 bg-muted/40" />
          <CardContent className="h-72" />
        </Card>
      </div>
    )
  }

  if (detailData.error || !group) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-xl font-semibold">Group Not Found or Error Loading Obligation</h2>
        <p className="text-sm text-muted-foreground">
          {detailData.error ? getErrorMessage(detailData.error) : "Unable to retrieve group payment details."}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/admin/payments")}>
            <ArrowLeft className="size-4 mr-1" /> Return to Payments
          </Button>
          <Button onClick={detailData.reload}>
            <RefreshCw className="size-4 mr-1" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/payments")}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back to Payments
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Pay Group Contribution
            </h1>
            <p className="text-xs text-muted-foreground">
              Super Admin Checkout &bull; FY {group.billing_period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={group.status} />
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${dueStatus.tone}`}>
            <CalendarClock className="size-3.5" />
            {dueStatus.text}
          </span>
        </div>
      </div>

      {/* Success Notification Banner if payment was completed */}
      {paymentSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                Payment Captured Successfully!
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                A payment of <strong>{formatCurrency(lastPaymentAmount)}</strong> has been credited to the common ledger for {group.group_name}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                onClick={() => {
                  setPaymentSuccess(false)
                  setAmountToPay(group.pending_amount)
                }}
              >
                Pay Another Amount
              </Button>
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => navigate("/admin/payments")}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Information Header Card */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">{group.group_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                <Users className="size-3.5 text-muted-foreground" />
                <span>{group.member_count} eligible members</span>
                <span>&bull;</span>
                <span>₹{group.rate_per_member} / member</span>
                <span>&bull;</span>
                <span>FY {group.billing_period}</span>
              </CardDescription>
            </div>

            {/* Due Date Indicator */}
            <div className="flex items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 border shadow-2xs">
              <Calendar className="size-4 text-primary" />
              <div className="text-left text-xs">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment Due Date</p>
                <p className="font-semibold text-foreground">{formatDate(dueDateStr)}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Current Financial Status Bar */}
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-3 rounded-lg border bg-card p-3 text-center sm:gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Expected</p>
              <p className="text-base font-bold sm:text-lg">{formatCurrency(group.expected_amount)}</p>
            </div>
            <div className="border-x border-border/60">
              <p className="text-xs text-muted-foreground">Already Collected</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 sm:text-lg">
                {formatCurrency(group.collected_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding (Pending)</p>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 sm:text-lg">
                {formatCurrency(group.pending_amount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Payment Amount Selection & Progress Section */}
      {group.pending_amount <= 0 ? (
        <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-center py-8">
          <CardContent className="space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <Check className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Obligation Fully Paid!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There is no outstanding balance for {group.group_name} in fiscal period {group.billing_period}.
            </p>
            <div className="pt-2">
              <Button onClick={() => navigate("/admin/payments")}>
                Return to Payment Module
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Amount Selection (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IndianRupee className="size-4 text-primary" />
                  Select Amount to Pay
                </CardTitle>
                <CardDescription>
                  You can pay the full outstanding balance or choose a custom partial contribution amount.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Quick Selection Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Quick Preset Amounts:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={amountToPay === pendingAmount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPercentageAmount(100)}
                      className="text-xs flex flex-col h-auto py-2"
                    >
                      <span className="font-semibold">100%</span>
                      <span className="text-[10px] opacity-80">{formatCurrency(pendingAmount)}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={amountToPay === Math.round(pendingAmount * 0.75) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPercentageAmount(75)}
                      className="text-xs flex flex-col h-auto py-2"
                    >
                      <span className="font-semibold">75%</span>
                      <span className="text-[10px] opacity-80">{formatCurrency(Math.round(pendingAmount * 0.75))}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={amountToPay === Math.round(pendingAmount * 0.5) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPercentageAmount(50)}
                      className="text-xs flex flex-col h-auto py-2"
                    >
                      <span className="font-semibold">50%</span>
                      <span className="text-[10px] opacity-80">{formatCurrency(Math.round(pendingAmount * 0.5))}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={amountToPay === Math.round(pendingAmount * 0.25) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPercentageAmount(25)}
                      className="text-xs flex flex-col h-auto py-2"
                    >
                      <span className="font-semibold">25%</span>
                      <span className="text-[10px] opacity-80">{formatCurrency(Math.round(pendingAmount * 0.25))}</span>
                    </Button>
                  </div>
                </div>

                {/* Amount Numeric Input Box */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Custom Amount to Pay (₹):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={pendingAmount}
                      value={amountToPay || ""}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="pl-8 text-lg font-bold text-foreground h-11"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>Min: ₹1</span>
                    <span>Max Outstanding: {formatCurrency(pendingAmount)}</span>
                  </div>
                </div>

                {/* Range Slider for Smooth Drag Selection */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={pendingAmount}
                    value={amountToPay || 0}
                    onChange={(e) => setAmountToPay(Number(e.target.value))}
                    className="w-full accent-[#0f5132] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>₹1</span>
                    <span>50% ({formatCurrency(Math.round(pendingAmount / 2))})</span>
                    <span>100% ({formatCurrency(pendingAmount)})</span>
                  </div>
                </div>

                {/* Gateway & Payment Security Note */}
                <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Razorpay Gateway Secured
                  </div>
                  <p className="leading-relaxed">
                    Supports instant payment capture via UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cards. Upon successful verification, the common ledger and group collection percentage will be updated immediately.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-t bg-muted/10 pt-4">
                <Button
                  size="lg"
                  className="w-full font-semibold gap-2 bg-[#0f5132] hover:bg-[#0c4027] text-white"
                  disabled={submitting || amountToPay <= 0 || amountToPay > pendingAmount}
                  onClick={handleProceedPayment}
                >
                  <CreditCard className="size-5" />
                  {submitting
                    ? "Opening Payment Gateway..."
                    : `Proceed to Pay ${formatCurrency(amountToPay)}`}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  By clicking Proceed, you will be redirected to the secure Razorpay payment gateway modal.
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Live Collection Progress Visualization (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border-primary/20 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Live Collection Progress
                </CardTitle>
                <CardDescription>
                  Preview how this payment will impact the group's collection percentage in real-time.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Visual Progress Bar (Multi-color: Existing + This Payment) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Overall Progress</span>
                    <span className="font-bold text-foreground">
                      {currentCollectionPct.toFixed(1)}% &rarr;{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {projectedPct.toFixed(1)}%
                      </span>
                    </span>
                  </div>

                  {/* Dual Fill Progress Bar */}
                  <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted border">
                    {/* 1. Already Collected Bar (Green) */}
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${currentCollectionPct}%` }}
                      title={`Already Collected: ${currentCollectionPct.toFixed(1)}%`}
                    />
                    {/* 2. New Payment Portion Bar (Indigo/Blue Accent) */}
                    <div
                      className="absolute top-0 h-full bg-[#123f24] opacity-90 transition-all duration-300"
                      style={{
                        left: `${currentCollectionPct}%`,
                        width: `${newPaymentPct}%`,
                      }}
                      title={`Paying Now: +${newPaymentPct.toFixed(1)}%`}
                    />
                  </div>

                  {/* Legend below the bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-emerald-600" />
                      <span className="text-muted-foreground">
                        Collected: {currentCollectionPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-[#123f24]" />
                      <span className="font-semibold text-primary">
                        +Paying Now: +{newPaymentPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculation Detail Breakdown Cards */}
                <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3.5">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Breakdown Calculation
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Expected:</span>
                      <span className="font-medium">{formatCurrency(expectedAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Already Collected:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(collectedAmount)} ({currentCollectionPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-[#123f24]" />
                        This Payment:
                      </span>
                      <span className="font-bold text-[#123f24] dark:text-[#a88a38]">
                        +{formatCurrency(amountToPay)} (+{newPaymentPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2 bg-background/50 p-2 rounded-lg font-semibold">
                      <span>Projected Collection:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(projectedCollected)} ({projectedPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-muted-foreground">Remaining Balance After:</span>
                      <span className={remainingAfterPayment === 0 ? "font-bold text-emerald-600" : "font-semibold text-rose-600 dark:text-rose-400"}>
                        {remainingAfterPayment === 0 ? "₹0 (Fully Cleared 🎉)" : formatCurrency(remainingAfterPayment)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Due Date & Policy Reminder */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        Due Date Reminder: {formatDate(dueDateStr)}
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Full collection before the deadline ensures the group maintains active membership in the Federation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Ledger & History link */}
                <div className="pt-1 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/admin/payments`)}
                  >
                    <History className="size-3.5 mr-1.5" />
                    View All Transaction History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
