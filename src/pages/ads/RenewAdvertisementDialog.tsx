import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  RotateCcw,
  Loader2,
  CreditCard,
  Building,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Advertisement, SubscriptionDurationOption } from "@/types"
import {
  getSubscriptionDurations,
  renewAdvertisement,
  createAdPaymentOrder,
  verifyAdPayment,
  createAdPaymentLink,
  recordAdManualPayment,
} from "@/services/api/ads"
import { formatCurrency, formatDate } from "@/lib/format"
import { loadRazorpayScript } from "@/lib/razorpay"
import { SubscriptionPlanSelector } from "./SubscriptionPlanSelector"

interface RenewAdvertisementDialogProps {
  open: boolean
  ad: Advertisement | null
  onOpenChange: (open: boolean) => void
  onRenewed: (ad: Advertisement) => void
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function calculateEndDate(startDateStr: string, months: number): string {
  if (!startDateStr || !months) return startDateStr || todayIso()
  const d = new Date(startDateStr)
  if (isNaN(d.getTime())) return startDateStr

  // Accurate month addition
  const targetMonth = d.getMonth() + Number(months)
  d.setMonth(targetMonth)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function RenewAdvertisementDialog({
  open,
  ad,
  onOpenChange,
  onRenewed,
}: RenewAdvertisementDialogProps) {
  const [durations, setDurations] = useState<SubscriptionDurationOption[]>([])
  const [subscriptionMonths, setSubscriptionMonths] = useState(1)
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [paymentMode, setPaymentMode] = useState<"RAZORPAY" | "LINK" | "OFFLINE" | "WAIVED">("RAZORPAY")
  const [offlineMethod, setOfflineMethod] = useState<"CASH" | "CHEQUE" | "BANK_TRANSFER">("CASH")
  const [offlineTxnId, setOfflineTxnId] = useState("")

  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  // Fetch subscription duration pricing
  useEffect(() => {
    if (open) {
      getSubscriptionDurations()
        .then((plans) => {
          setDurations(plans)
          if (plans.length > 0) {
            const def = plans.find((p) => p.is_default) || plans[0]
            setSubscriptionMonths(def.months)
          }
        })
        .catch(() => toast.error("Could not load subscription pricing"))
    }
  }, [open])

  // Setup initial start and auto-calculated end dates whenever ad changes
  useEffect(() => {
    if (ad && open) {
      const now = new Date()
      let initialStart = todayIso()

      if (ad.end_date) {
        const curEnd = new Date(ad.end_date)
        if (!isNaN(curEnd.getTime()) && curEnd > now) {
          // If ad is not yet expired, renew starting exactly from current end date
          initialStart = curEnd.toISOString().substring(0, 10)
        }
      }

      setStartDate(initialStart)
      setEndDate(calculateEndDate(initialStart, subscriptionMonths))
      setGeneratedLink(null)
    }
  }, [ad, open])

  // Handle duration change with auto-calculation
  const handleDurationChange = (months: number) => {
    setSubscriptionMonths(months)
    setEndDate(calculateEndDate(startDate, months))
  }

  // Handle start date change with auto-calculation
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart)
    setEndDate(calculateEndDate(newStart, subscriptionMonths))
  }

  const selectedPlan =
    durations.find((p) => p.months === subscriptionMonths) ||
    durations[0] ||
    null

  const renewAmount = selectedPlan ? Number(selectedPlan.price) : Number(ad?.amount ?? 0)

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ad) return

    setLoading(true)
    try {
      if (paymentMode === "RAZORPAY") {
        // 1. Load Razorpay script
        const isLoaded = await loadRazorpayScript()
        if (!isLoaded || !(window as any).Razorpay) {
          toast.error("Could not load Razorpay gateway. Please check internet connection.")
          setLoading(false)
          return
        }

        // 2. First renew ad in pending status to lock new price & duration
        const renewedAd = await renewAdvertisement(ad.id, {
          subscription_months: subscriptionMonths,
          start_date: startDate,
          end_date: endDate,
          payment_status: "PENDING",
        })

        // 3. Create Razorpay order
        const orderData = await createAdPaymentOrder(ad.id)

        // 4. Open Razorpay checkout
        const options = {
          key: orderData.razorpay_key_id,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || "INR",
          name: "JSSG Federation",
          description: `Ad Renewal: ${ad.title} (${subscriptionMonths} mo)`,
          order_id: orderData.razorpay_order_id,
          prefill: {
            name: ad.person_name || undefined,
            contact: ad.mobile_number ? ad.mobile_number.replace(/\D/g, "") : undefined,
          },
          theme: {
            color: "#2563eb",
          },
          handler: async (response: any) => {
            try {
              toast.loading("Verifying payment...")
              const verified = await verifyAdPayment(ad.id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              toast.dismiss()
              toast.success("Advertisement renewed and payment verified successfully!")
              onRenewed(verified)
              onOpenChange(false)
            } catch (err: any) {
              toast.dismiss()
              toast.error(err?.message || "Payment verification failed.")
            }
          },
          modal: {
            ondismiss: () => {
              toast.info("Payment window closed. The renewal is pending payment.")
              onRenewed(renewedAd)
              onOpenChange(false)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
        setLoading(false)
        return
      }

      if (paymentMode === "LINK") {
        // First renew ad with pending payment
        const renewedAd = await renewAdvertisement(ad.id, {
          subscription_months: subscriptionMonths,
          start_date: startDate,
          end_date: endDate,
          payment_status: "PENDING",
        })

        const linkRes = await createAdPaymentLink(ad.id)
        setGeneratedLink(linkRes.short_url)
        toast.success("Payment link generated successfully!")
        onRenewed(renewedAd)
        return
      }

      if (paymentMode === "OFFLINE") {
        const renewedAd = await renewAdvertisement(ad.id, {
          subscription_months: subscriptionMonths,
          start_date: startDate,
          end_date: endDate,
          payment_method: offlineMethod,
          payment_status: "PAID",
          transaction_id: offlineTxnId.trim() || undefined,
        })
        await recordAdManualPayment(ad.id, {
          payment_method: offlineMethod,
          transaction_id: offlineTxnId.trim() || undefined,
          notes: `Renewed for ${subscriptionMonths} months`,
        })
        toast.success("Advertisement renewed with offline payment!")
        onRenewed(renewedAd)
        onOpenChange(false)
        return
      }

      if (paymentMode === "WAIVED") {
        const renewedAd = await renewAdvertisement(ad.id, {
          subscription_months: subscriptionMonths,
          start_date: startDate,
          end_date: endDate,
          payment_method: "WAIVED",
          payment_status: "WAIVED",
        })
        toast.success("Advertisement renewed (Fee Waived)!")
        onRenewed(renewedAd)
        onOpenChange(false)
        return
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to renew advertisement. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!ad) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <RotateCcw className="size-5" />
            <DialogTitle className="text-lg">Renew Advertisement / विज्ञापन नवीनीकरण</DialogTitle>
          </div>
          <DialogDescription>
            Select a new subscription plan duration and renew your campaign. The campaign end date will be automatically calculated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRenewSubmit} className="space-y-4 pt-2">
          {/* Ad Info Summary Card */}
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground text-sm">{ad.title}</span>
              <Badge variant="outline" className="font-mono text-[11px]">
                {ad.placement || "HOME_BANNER"}
              </Badge>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Advertiser: {ad.person_name || ad.personName || "N/A"}</span>
              <span>Group: {ad.group_name || ad.postBy || "General"}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Previous Expiry:</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {ad.end_date ? formatDate(ad.end_date) : "N/A"}
              </span>
            </div>
          </div>

          {/* Subscription Duration Selector */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
              New Subscription Duration <span className="text-destructive">*</span>
            </Label>
            <SubscriptionPlanSelector
              plans={durations}
              value={subscriptionMonths}
              onChange={handleDurationChange}
            />
          </div>

          {/* Dates (Auto-calculated End Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                Renewal Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider block">
                  New End Date
                </Label>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-300">
                  Auto-calculated
                </span>
              </div>
              <Input
                type="date"
                required
                readOnly
                disabled
                value={endDate}
                className="text-xs font-bold bg-muted/60 border-emerald-500/50 cursor-not-allowed opacity-90"
              />
            </div>
          </div>

          {/* Amount Highlight */}
          <div className="rounded-lg border-2 border-dashed border-blue-500/70 bg-blue-50/50 p-3.5 flex items-center justify-between dark:bg-blue-950/20">
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Renewal Fee ({subscriptionMonths} Months):
              </p>
              <p className="text-[11px] text-muted-foreground">
                Rates as per federation approved subscription amount
              </p>
            </div>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300">
              {formatCurrency(renewAmount)}
            </span>
          </div>

          {/* Payment Method Options */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider block">
              Payment & Activation Option
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("RAZORPAY")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === "RAZORPAY"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <CreditCard className="size-4 mb-1 text-blue-600" />
                Pay Now
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("LINK")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === "LINK"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Share2 className="size-4 mb-1 text-purple-600" />
                Payment Link
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("OFFLINE")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === "OFFLINE"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Building className="size-4 mb-1 text-emerald-600" />
                Cash / Cheque
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("WAIVED")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === "WAIVED"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="size-4 mb-1 text-slate-600" />
                Waive Fee
              </button>
            </div>
          </div>

          {/* Offline details sub-fields */}
          {paymentMode === "OFFLINE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div>
                <Label className="text-xs font-medium mb-1 block">Mode</Label>
                <select
                  value={offlineMethod}
                  onChange={(e) => setOfflineMethod(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <option value="CASH">Cash (नकद)</option>
                  <option value="CHEQUE">Cheque (चेक)</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Cheque / UTR Ref</Label>
                <Input
                  type="text"
                  placeholder="e.g. CHQ-9901 or UTR..."
                  value={offlineTxnId}
                  onChange={(e) => setOfflineTxnId(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Generated Payment Link Display */}
          {generatedLink && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-3 space-y-2 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                <span>Payment Link Created:</span>
                <span className="font-mono text-[11px]">{formatCurrency(renewAmount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  className="text-xs font-mono bg-white select-all dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    toast.success("Payment link copied to clipboard!")
                  }}
                  className="shrink-0"
                >
                  <Copy className="size-3.5 mr-1" />
                  Copy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => window.open(generatedLink, "_blank")}
                  className="shrink-0"
                >
                  <ExternalLink className="size-3.5 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Confirm Renewal ({formatCurrency(renewAmount)})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
