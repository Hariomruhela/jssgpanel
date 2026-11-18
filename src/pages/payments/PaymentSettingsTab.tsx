import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  IndianRupee,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { useData } from "@/lib/useData"
import { getErrorMessage } from "@/lib/apiClient"
import { getPaymentSettings, updatePaymentSettings } from "@/services/api/payments"
import type { PaymentSettings } from "@/types"

const DEFAULT_SETTINGS: PaymentSettings = {
  rate_per_member: 100,
  billing_period: "2026-2027",
  due_date: "2027-03-31",
  late_fee: 0,
  allow_partial_payments: true,
  min_partial_amount: 100,
  payment_gateway: "Razorpay",
  razorpay_key_id: "rzp_test_TzeUn0Iazq0yuq",
  allowed_payment_methods: ["UPI", "Net Banking", "Debit/Credit Card"],
  apply_to_existing_obligations: false,
}

export function PaymentSettingsTab({ onSettingsUpdated }: { onSettingsUpdated?: () => void }) {
  const settingsData = useData(useCallback(() => getPaymentSettings(), []))
  const [form, setForm] = useState<PaymentSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [applyToExisting, setApplyToExisting] = useState(false)

  useEffect(() => {
    if (settingsData.data) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...settingsData.data,
      })
    }
  }, [settingsData.data])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePaymentSettings({
        ...form,
        apply_to_existing_obligations: applyToExisting,
      })
      toast.success(
        applyToExisting
          ? "Payment settings saved and applied to all group obligations!"
          : "Payment settings saved successfully!"
      )
      settingsData.reload()
      onSettingsUpdated?.()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save payment settings."))
    } finally {
      setSaving(false)
    }
  }

  const toggleMethod = (method: string) => {
    setForm((prev) => {
      const exists = prev.allowed_payment_methods.includes(method)
      const updated = exists
        ? prev.allowed_payment_methods.filter((m) => m !== method)
        : [...prev.allowed_payment_methods, method]
      return { ...prev, allowed_payment_methods: updated }
    })
  }

  if (settingsData.loading && !settingsData.data) {
    return (
      <div className="space-y-4 py-4">
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted/30" />
          <CardContent className="h-64" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Settings className="size-5 text-primary" />
                Payment Module Settings & Configuration
              </CardTitle>
              <CardDescription>
                Manage contribution rates, due dates, partial payment rules, and gateway configurations.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => settingsData.reload()}
              disabled={settingsData.loading}
            >
              <RefreshCw className={settingsData.loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-6">
            {/* 1. Contribution & Period Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <IndianRupee className="size-4 text-primary" />
                Contribution Rate & Due Date Rules
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  label="Rate Per Member (₹)"
                  hint="Base annual contribution amount per active eligible group member"
                  required
                >
                  <Input
                    type="number"
                    min={0}
                    value={form.rate_per_member}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, rate_per_member: Number(e.target.value) || 0 }))
                    }
                  />
                </FormField>

                <FormField
                  label="Payment Due Date"
                  hint="Official deadline for groups to submit annual contributions"
                  required
                >
                  <DateInput
                    value={form.due_date}
                    onChange={(v) => setForm((s) => ({ ...s, due_date: v }))}
                  />
                </FormField>

                <FormField
                  label="Active Billing / Financial Period"
                  hint="e.g. 2026-2027"
                  required
                >
                  <Input
                    value={form.billing_period}
                    onChange={(e) => setForm((s) => ({ ...s, billing_period: e.target.value }))}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                <FormField
                  label="Late Fee Surcharge (₹)"
                  hint="Optional penalty applicable after due date expiry"
                >
                  <Input
                    type="number"
                    min={0}
                    value={form.late_fee}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, late_fee: Number(e.target.value) || 0 }))
                    }
                  />
                </FormField>

                <FormField
                  label="Minimum Partial Amount (₹)"
                  hint="Minimum amount allowed when partial collection is enabled"
                >
                  <Input
                    type="number"
                    min={1}
                    value={form.min_partial_amount}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, min_partial_amount: Number(e.target.value) || 1 }))
                    }
                  />
                </FormField>
              </div>
            </div>

            {/* 2. Partial Payment Permissions */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <CreditCard className="size-4 text-primary" />
                Payment Collection Rules
              </h3>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Allow Partial Payments</span>
                    {form.allow_partial_payments ? (
                      <span className="text-[11px] rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium dark:bg-emerald-950 dark:text-emerald-300">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5 font-medium">
                        Full Only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, Super Admin and Group Admins can make installment/partial contributions towards their total outstanding balance.
                  </p>
                </div>
                <Switch
                  checked={form.allow_partial_payments}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, allow_partial_payments: checked }))
                  }
                />
              </div>

              {/* Payment Methods Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground">
                  Allowed Payment Methods:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["UPI", "Net Banking", "Debit/Credit Card"].map((method) => {
                    const isChecked = form.allowed_payment_methods.includes(method)
                    return (
                      <div
                        key={method}
                        onClick={() => toggleMethod(method)}
                        className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-card hover:bg-muted/30"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleMethod(method)}
                        />
                        <span className="text-xs font-medium">{method}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. Gateway Status */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="size-4 text-primary" />
                Payment Gateway Configuration (Razorpay)
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Payment Gateway Provider"
                  hint="Configured backend payment processor"
                >
                  <Input value={form.payment_gateway} disabled className="bg-muted/50" />
                </FormField>

                <FormField
                  label="Razorpay Key ID"
                  hint="Merchant Key used for Super Admin and payment link checkouts"
                >
                  <Input value={form.razorpay_key_id} disabled className="bg-muted/50 font-mono text-xs" />
                </FormField>
              </div>
            </div>

            {/* 4. Apply to Existing Obligations Option */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="apply_existing"
                  checked={applyToExisting}
                  onCheckedChange={(checked) => setApplyToExisting(Boolean(checked))}
                  className="mt-1"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="apply_existing"
                    className="text-sm font-semibold cursor-pointer text-foreground flex items-center gap-1.5"
                  >
                    <Sparkles className="size-4 text-primary" />
                    Apply and Recalculate for All Groups in FY {form.billing_period}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Check this option to immediately sync the new rate (₹{form.rate_per_member}/member) and due date ({form.due_date}) across all groups for fiscal year {form.billing_period}. Expected and pending amounts will be atomically recalculated.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/10 pt-4">
            <p className="text-xs text-muted-foreground">
              Last saved settings are active across all admin checkouts and mobile payment links.
            </p>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-[#0f5132] hover:bg-[#0c4027] text-white min-w-[140px]"
            >
              <Save className="size-4" />
              {saving ? "Saving Settings..." : "Save Settings"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
