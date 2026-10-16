export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

export function formatDate(date: string): string {
  if (!date) return "—"
  const d = new Date(date.length === 10 ? `${date}T00:00:00` : date)
  if (Number.isNaN(d.getTime())) return date
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(date: string): string {
  if (!date) return "—"
  const d = new Date(date.length === 10 ? `${date}T00:00:00` : date)
  if (Number.isNaN(d.getTime())) return date
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  const hour = String(d.getHours()).padStart(2, "0")
  const minute = String(d.getMinutes()).padStart(2, "0")
  return `${day}/${month}/${year} ${hour}:${minute}`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function groupIdToName(groups: { id: string; name: string }[], id: string): string {
  return groups.find((g) => g.id === id)?.name ?? id
}

export function safePercent(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}