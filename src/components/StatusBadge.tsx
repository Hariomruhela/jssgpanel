import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const toneMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  sent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  enabled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  open: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  scheduled: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  upcoming: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  ongoing: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  overdue: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  unpaid: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  blocked: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  failed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
  refunded: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  emergency: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  "System": "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  Custom: "bg-muted text-muted-foreground",
}

const dotMap: Record<string, string> = {
  active: "bg-emerald-500",
  approved: "bg-emerald-500",
  paid: "bg-emerald-500",
  published: "bg-emerald-500",
  sent: "bg-emerald-500",
  success: "bg-emerald-500",
  completed: "bg-emerald-500",
  open: "bg-amber-500",
  pending: "bg-amber-500",
  partial: "bg-amber-500",
  scheduled: "bg-amber-500",
  upcoming: "bg-sky-500",
  ongoing: "bg-sky-500",
  overdue: "bg-rose-500",
  unpaid: "bg-rose-500",
  rejected: "bg-rose-500",
  blocked: "bg-rose-500",
  failed: "bg-rose-500",
  cancelled: "bg-rose-500",
  inactive: "bg-muted-foreground",
  draft: "bg-muted-foreground",
  expired: "bg-muted-foreground",
  archived: "bg-muted-foreground",
  closed: "bg-muted-foreground",
  refunded: "bg-violet-500",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  emergency: "bg-rose-500",
  System: "bg-indigo-500",
  Custom: "bg-muted-foreground",
}

export function StatusBadge({ status, showDot = true }: { status: string; showDot?: boolean }) {
  const key = status.toLowerCase()
  return (
    <Badge variant="outline" className={cn("gap-1.5 py-0.5 font-medium", toneMap[key] ?? "")}>
      {showDot && <span className={cn("size-1.5 rounded-full", dotMap[key] ?? "bg-muted-foreground")} />}
      <span className="capitalize">{status}</span>
    </Badge>
  )
}