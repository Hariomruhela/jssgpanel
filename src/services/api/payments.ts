import type { PaymentStatus, PaymentTransaction, TransactionStatus } from "@/types"
import { FISCAL_YEAR, db, delay, nextId } from "@/services/mock/db"

export interface TransactionFilters {
  search?: string
  groupId?: string
  status?: "all" | TransactionStatus
  method?: string
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<PaymentTransaction[]> {
  let result = [...db.transactions].sort((a, b) => b.paidOn.localeCompare(a.paidOn))
  const q = (filters.search ?? "").trim().toLowerCase()
  if (q) {
    result = result.filter(
      (t) =>
        t.txnNo.toLowerCase().includes(q) ||
        t.receiptNo.toLowerCase().includes(q) ||
        t.payerName.toLowerCase().includes(q)
    )
  }
  if (filters.groupId) result = result.filter((t) => t.groupId === filters.groupId)
  if (filters.status && filters.status !== "all") result = result.filter((t) => t.status === filters.status)
  if (filters.method) result = result.filter((t) => t.method === filters.method)
  return delay(result, 250)
}

export interface GroupPaymentStatus {
  groupId: string
  name: string
  totalMembers: number
  expected: number
  collected: number
  outstanding: number
  paidMembers: number
  rate: number
  status: PaymentStatus
}

export async function getGroupPaymentStatus(): Promise<GroupPaymentStatus[]> {
  const rows = db.groups.map((g) => {
    const fee = db.feeConfigs.find((f) => f.groupId === g.id)
    const amount = fee?.amount ?? 15000
    const expected = g.memberCount * amount
    const collected = db.transactions
      .filter((t) => t.groupId === g.id && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0)
    const paidMembers = Math.min(g.memberCount, Math.round(collected / amount))
    const rate = expected === 0 ? 0 : Math.round((collected / expected) * 1000) / 10
    const status: PaymentStatus =
      rate >= 95 ? "paid" : rate >= 70 ? "partial" : rate > 0 ? "overdue" : "unpaid"
    return {
      groupId: g.id,
      name: g.name,
      totalMembers: g.memberCount,
      expected,
      collected,
      outstanding: Math.max(0, expected - collected),
      paidMembers,
      rate,
      status,
    }
  })
  return delay(rows)
}

export interface CollectionSummary {
  fiscalYear: string
  expectedTotal: number
  collectedTotal: number
  outstandingTotal: number
  totalTransactions: number
  successRate: number
}

export async function getCollectionSummary(): Promise<CollectionSummary> {
  const expectedTotal = db.groups.reduce((sum, g) => {
    const fee = db.feeConfigs.find((f) => f.groupId === g.id)
    return sum + g.memberCount * (fee?.amount ?? 15000)
  }, 0)
  const collectedTotal = db.transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalTransactions = db.transactions.length
  const success = db.transactions.filter((t) => t.status === "success").length
  return delay({
    fiscalYear: FISCAL_YEAR,
    expectedTotal,
    collectedTotal,
    outstandingTotal: Math.max(0, expectedTotal - collectedTotal),
    totalTransactions,
    successRate: totalTransactions === 0 ? 0 : Math.round((success / totalTransactions) * 100),
  })
}

export async function getMonthlyCollections(): Promise<{ month: string; collected: number }[]> {
  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]
  return delay(
    months.map((m) => ({
      month: new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" }),
      collected: db.transactions
        .filter((t) => t.paidOn.startsWith(m) && t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0),
    }))
  )
}

export async function recordPayment(input: {
  payerName: string
  groupId: string
  amount: number
  method: PaymentTransaction["method"]
  remark: string
}): Promise<PaymentTransaction> {
  const seq = db.transactions.length + 1
  const txn: PaymentTransaction = {
    id: nextId(),
    txnNo: `TXN${String(9000 + seq)}`,
    receiptNo: `RCP${String(9000 + seq)}`,
    fiscalYear: FISCAL_YEAR,
    status: "success",
    paidOn: new Date().toISOString().slice(0, 10),
    ...input,
  }
  db.transactions.unshift(txn)
  return delay(txn, 300)
}

export async function refundTransaction(id: string, remark: string): Promise<PaymentTransaction | undefined> {
  const idx = db.transactions.findIndex((t) => t.id === id)
  if (idx === -1) return delay(undefined)
  db.transactions[idx] = {
    ...db.transactions[idx],
    status: "refunded",
    remark: remark || `${db.transactions[idx].remark} (refunded)`,
  }
  return delay(db.transactions[idx], 300)
}