import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  value: string
  label: string
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-[16px] border border-[#ece9e4] bg-white px-4 py-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:border-[#38332a] dark:bg-[#221f19]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#9a6a00]/10 dark:bg-[#f0c96e]/10">
        <Icon className="size-6 text-[#9a6a00] dark:text-[#f0c96e]" strokeWidth={2} />
      </span>
      <p className="mt-2 text-2xl leading-none font-bold tracking-tight text-[#222] dark:text-[#f3e6d0]">
        {value}
      </p>
      <p className="mt-2 text-[13px] font-medium text-[#8a8f98] dark:text-[#b5aa97]">
        {label}
      </p>
    </div>
  )
}