import type { LucideIcon } from "lucide-react"

export interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  trend?: string
  trendLabel?: string
  iconBg?: string
  iconColor?: string
}

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendLabel = "vs. last month",
  iconBg = "bg-amber-100/70",
  iconColor = "text-amber-800",
}: StatCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#E8DFD1] bg-white p-5 shadow-[0_2px_8px_rgba(43,30,22,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(43,30,22,0.06)] text-left">
      {/* Icon */}
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
        <Icon className="size-4.5" strokeWidth={2} />
      </div>

      {/* Label */}
      <p className="mt-3 text-xs font-medium text-[#7C6C5E]">
        {label}
      </p>

      {/* Value */}
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#2B1E16]">
        {value}
      </p>

      {/* Trend Percentage */}
      {trend && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
            <span>↑</span> {trend}
          </span>
          <span className="text-[#9C8C7D]">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
