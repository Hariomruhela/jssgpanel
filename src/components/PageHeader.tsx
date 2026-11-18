import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-serif-display text-2xl leading-tight font-semibold tracking-tight text-[#2B1E16] dark:text-[#f3e6d0]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}