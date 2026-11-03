import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/FormField"
import { getErrorMessage } from "@/lib/apiClient"
import type { SubscriptionDurationOption } from "@/types"
import { getSubscriptionDurations, updateSubscriptionPricing } from "@/services/api/ads"

interface AdvertisementPricingSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function AdvertisementPricingSettingsDialog({
  open,
  onOpenChange,
  onSaved,
}: AdvertisementPricingSettingsDialogProps) {
  const [plans, setPlans] = useState<SubscriptionDurationOption[]>([])
  const [prices, setPrices] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getSubscriptionDurations()
      setPlans(next)
      setPrices(
        Object.fromEntries(next.map((plan) => [plan.months, String(plan.price)]))
      )
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load subscription pricing."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadPlans()
  }, [open, loadPlans])

  const handleSave = async () => {
    if (plans.length === 0) return

    const updates = plans.map((plan) => ({
      months: plan.months,
      price: Number(prices[plan.months]),
    }))

    if (updates.some((item) => !Number.isFinite(item.price) || item.price <= 0)) {
      toast.error("Enter a price greater than zero for every plan.")
      return
    }

    setSaving(true)
    try {
      await updateSubscriptionPricing(updates)
      toast.success("Subscription pricing updated", {
        description: "New subscriptions and renewals will use these prices.",
      })
      onSaved?.()
      onOpenChange(false)
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, "Could not update subscription pricing."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Advertisement Pricing Settings</DialogTitle>
          <DialogDescription>
            Set the price for each subscription duration. Existing advertisements keep
            the amount they were purchased at; new subscriptions and renewals use the
            latest prices.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading plans…
          </div>
        ) : error ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadPlans()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {plans.map((plan) => (
              <FormField
                key={plan.months}
                label={`${plan.label} subscription`}
                hint={plan.description}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    className="pl-7 font-mono"
                    value={prices[plan.months] ?? ""}
                    onChange={(event) =>
                      setPrices((current) => ({
                        ...current,
                        [plan.months]: event.target.value,
                      }))
                    }
                  />
                </div>
              </FormField>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || loading || Boolean(error) || plans.length === 0}
            onClick={handleSave}
          >
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save Prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
