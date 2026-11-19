import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  IndianRupee,
  RefreshCw,
  Save,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  apply_to_existing_obligations: true,
}

export function PaymentSettingsTab({ onSettingsUpdated }: { onSettingsUpdated?: () => void }) {
  const settingsData = useData(useCallback(() => getPaymentSettings(), []))
  const [form, setForm] = useState<PaymentSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settingsData.data) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...settingsData.data,
        apply_to_existing_obligations: settingsData.data.apply_to_existing_obligations ?? true,
      })
    }
  }, [settingsData.data])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePaymentSettings({
        ...form,
        apply_to_existing_obligations: form.apply_to_existing_obligations ?? true,
      })
      toast.success("Payment settings saved & group obligations updated successfully!")
      settingsData.reload()
      onSettingsUpdated?.()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save payment settings."))
    } finally {
      setSaving(false)
    }
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

              {/* 3. Recalculate Group Obligations for Active Period */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Update Existing Group Obligations</span>
                    {form.apply_to_existing_obligations ? (
                      <span className="text-[11px] rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium dark:bg-emerald-950 dark:text-emerald-300">
                        Apply to {form.billing_period || "2026-2027"}
                      </span>
                    ) : (
                      <span className="text-[11px] rounded-full bg-muted text-muted-foreground px-2 py-0.5 font-medium">
                        Off (New Groups Only)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, saving immediately recalculates the expected amount and pending balances for all 112 groups in fiscal period {form.billing_period || "2026-2027"}.
                  </p>
                </div>
                <Switch
                  checked={Boolean(form.apply_to_existing_obligations)}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, apply_to_existing_obligations: checked }))
                  }
                />
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
