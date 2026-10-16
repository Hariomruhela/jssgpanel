import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, hint, children, className }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}