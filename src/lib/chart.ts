import { formatCurrency } from "@/lib/format"

export const chartTooltipProps = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: 12,
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 500 },
  itemStyle: { color: "var(--foreground)" },
} as const

export const currencyFormatter = (value: number | string) => formatCurrency(Number(value))

export const compactTooltipFormatter = (value: number | string) => formatCurrency(Number(value))