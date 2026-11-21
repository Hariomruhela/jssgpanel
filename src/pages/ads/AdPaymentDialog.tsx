import { useState } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  Loader2,
  Building,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  IndianRupee,
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
import type { Advertisement } from "@/types"
import {
  createAdPaymentOrder,
  verifyAdPayment,
  createAdPaymentLink,
  recordAdManualPayment,
} from "@/services/api/ads"
import { formatCurrency } from "@/lib/format"
import { loadRazorpayScript } from "@/lib/razorpay"
import { triggerPaymentNotification } from "@/lib/notifications"

interface AdPaymentDialogProps {
  open: boolean
  ad: Advertisement | null
  onOpenChange: (open: boolean) => void
  onPaid: (ad: Advertisement) => void
}

export function AdPaymentDialog({ open, ad, onOpenChange, onPaid }: AdPaymentDialogProps) {
  const [paymentMode, setPaymentMode] = useState<"RAZORPAY" | "LINK" | "OFFLINE" | "WAIVED">("RAZORPAY")
  const [offlineMethod, setOfflineMethod] = useState<"CASH" | "CHEQUE" | "BANK_TRANSFER">("CASH")
  const [offlineTxnId, setOfflineTxnId] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  if (!ad) return null

  const amountVal = Number(ad.amount ?? ad.spend ?? 0)

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (paymentMode === "RAZORPAY") {
        const isLoaded = await loadRazorpayScript()
        if (!isLoaded || !(window as any).Razorpay) {
          toast.error("Could not load Razorpay gateway. Please check internet connection.")
          setLoading(false)
          return
        }

        const orderData = await createAdPaymentOrder(ad.id)

        const options = {
          key: orderData.razorpay_key_id,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || "INR",
          name: "JSSG Federation",
          description: `Advertisement Payment: ${ad.title}`,
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
              triggerPaymentNotification({
                id: verified.id,
                category: "ad_payment",
                title: "Ad Payment Received",
                message: `Payment of ${formatCurrency(amountVal)} received for advertisement: "${ad.title}"`,
                amount: amountVal,
                transactionId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                link: "/admin/advertisements",
              })
              onPaid(verified)
              onOpenChange(false)
            } catch (err: any) {
              toast.dismiss()
              toast.error(err?.message || "Payment verification failed.")
            }
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
        setLoading(false)
        return
      }

      if (paymentMode === "LINK") {
        const linkRes = await createAdPaymentLink(ad.id)
        setGeneratedLink(linkRes.short_url)
        toast.success("Payment link generated successfully!")
        return
      }

      if (paymentMode === "OFFLINE") {
        const updated = await recordAdManualPayment(ad.id, {
          payment_method: offlineMethod,
          transaction_id: offlineTxnId.trim() || undefined,
          notes: "Offline advertisement payment",
        })
        triggerPaymentNotification({
          id: updated.id,
          category: "ad_payment",
          title: "Ad Payment Received",
          message: `Payment of ${formatCurrency(amountVal)} received for advertisement: "${ad.title}" (${offlineMethod})`,
          amount: amountVal,
          transactionId: offlineTxnId.trim() || undefined,
          link: "/admin/advertisements",
        })
        onPaid(updated)
        onOpenChange(false)
        return
      }

      if (paymentMode === "WAIVED") {
        const updated = await recordAdManualPayment(ad.id, {
          payment_method: "WAIVED",
          notes: "Fee waived by admin",
        })
        toast.success("Advertisement fee waived!")
        onPaid(updated)
        onOpenChange(false)
        return
      }
    } catch (err: any) {
      toast.error(err?.message || "Payment processing failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <CreditCard className="size-5" />
            <DialogTitle className="text-lg">Complete Advertisement Payment</DialogTitle>
          </div>
          <DialogDescription>
            Collect payment online via Razorpay, generate a link, or record offline cash/cheque payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
          {/* Ad Summary */}
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground text-sm">{ad.title}</span>
              <Badge variant="outline" className="font-mono text-[11px]">
                {ad.placement || "HOME_BANNER"}
              </Badge>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Advertiser: {ad.person_name || ad.personName || "N/A"}</span>
              <span>{ad.subscription_months || 1} Month(s)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Amount Payable:</span>
              <span className="font-bold text-blue-700 text-sm dark:text-blue-300">
                {formatCurrency(amountVal)}
              </span>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider block">
              Choose Payment Method
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
                <span className="font-mono text-[11px]">{formatCurrency(amountVal)}</span>
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
              Close
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : paymentMode === "RAZORPAY" ? (
                <>
                  <IndianRupee className="size-4" />
                  Pay Now ({formatCurrency(amountVal)})
                </>
              ) : paymentMode === "LINK" ? (
                <>
                  <Share2 className="size-4" />
                  Generate Link
                </>
              ) : paymentMode === "WAIVED" ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Waive Fee
                </>
              ) : (
                <>
                  <Building className="size-4" />
                  Record Paid ({formatCurrency(amountVal)})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
