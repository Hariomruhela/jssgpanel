import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { SubscriptionDurationOption } from "@/types"

interface SubscriptionPlanSelectorProps {
  plans: SubscriptionDurationOption[]
  value: number
  onChange: (months: number) => void
  disabled?: boolean
}

const POPULAR_PLAN_MONTHS = 2

function formatPlanPrice(plan: SubscriptionDurationOption): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(plan.price))
}

export function SubscriptionPlanSelector({
  plans,
  value,
  onChange,
  disabled = false,
}: SubscriptionPlanSelectorProps) {
  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card p-4 text-xs text-muted-foreground">
        Loading subscription plans…
      </div>
    )
  }

  return (
    <RadioGroup
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
      disabled={disabled}
      className="grid gap-3 px-1 pt-2 sm:grid-cols-3"
    >
      {plans.map((plan) => {
        const selected = plan.months === value
        const popular = plan.months === POPULAR_PLAN_MONTHS
        return (
          <label
            key={plan.months}
            className={cn(
              "relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all duration-200",
              selected
                ? "border-emerald-600 bg-emerald-50 shadow-[0_10px_28px_-16px_rgba(5,150,105,0.55)]"
                : "border-border/70 bg-card hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm",
              disabled && "cursor-not-allowed opacity-70 hover:translate-y-0 hover:shadow-none"
            )}
          >
            {popular && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm ring-2 ring-background">
                Most Popular
              </span>
            )}

            <span className="flex items-center gap-2.5">
              <RadioGroupItem
                value={String(plan.months)}
                id={`subscription-plan-${plan.months}`}
                disabled={disabled}
                className={cn(
                  selected &&
                    "border-emerald-600 data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white"
                )}
              />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {plan.label}
              </span>
            </span>

            <span className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {formatPlanPrice(plan)}
            </span>
            <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {plan.description}
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
