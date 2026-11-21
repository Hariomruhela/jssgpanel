import type {
  ApiEnvelope,
  GroupObligationRecord,
  GroupPaymentDetail,
  GroupPaymentLinkResponse,
  GroupPaymentOrderCreateResponse,
  PaymentListParams,
  PaymentListResult,
  PaymentRecord,
  PaymentSettings,
  PaymentStatus,
  PaymentSummaryData,
  PaymentTransaction,
  TransactionStatus,
} from "@/types"
import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import { FISCAL_YEAR, db, delay, nextId } from "@/services/mock/db"

const BASE = "/payments"

/** Global payment summary totals from `GET /api/v1/payments/summary`. */
export async function getPaymentDashboardSummary(billingPeriod?: string): Promise<PaymentSummaryData> {
  const query = new URLSearchParams()
  if (billingPeriod) query.set("billing_period", billingPeriod)
  const qStr = query.toString() ? `?${query.toString()}` : ""

  const payload = await apiRequest<ApiEnvelope<PaymentSummaryData>>(`${BASE}/summary${qStr}`, {
    auth: true,
  })
  return unwrapItem<PaymentSummaryData>(payload)
}

function normalizeObligation(raw: any): GroupObligationRecord {
  const memberCount =
    typeof raw?.member_count === "number" && !Number.isNaN(raw.member_count)
      ? raw.member_count
      : typeof raw?.member_count_snapshot === "number" && !Number.isNaN(raw.member_count_snapshot)
      ? raw.member_count_snapshot
      : raw?.expected_amount && raw?.rate_per_member
      ? Math.round(Number(raw.expected_amount) / Number(raw.rate_per_member))
      : 0

  return {
    ...raw,
    member_count: memberCount,
  }
}

export interface GroupObligationListParams {
  billingPeriod?: string
  search?: string
  page?: number
  pageSize?: number
  fetchAll?: boolean
}

export interface GroupObligationListResult {
  obligations: GroupObligationRecord[]
  pagination: ApiEnvelope<unknown>["pagination"] | null
}

/** Group-wise payment obligations from `GET /api/v1/payments/groups`. */
export async function listGroupObligations(
  params: GroupObligationListParams = {}
): Promise<GroupObligationListResult> {
  const page = params.page ?? 1
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (params.billingPeriod) query.set("billing_period", params.billingPeriod)
  if (params.search?.trim()) query.set("search", params.search.trim())

  const payload = await apiRequest<ApiEnvelope<any[]>>(`${BASE}/groups?${query.toString()}`, {
    auth: true,
  })

  let rawList = unwrapList<any>(payload)
  const pagination = payload?.pagination ?? null

  // If fetchAll is requested and there are multiple pages, fetch all remaining pages in parallel
  if (params.fetchAll && pagination && pagination.total_pages > 1 && page === 1) {
    const remainingPages = Array.from(
      { length: pagination.total_pages - 1 },
      (_, i) => i + 2
    )
    const responses = await Promise.all(
      remainingPages.map((p) => {
        const pQuery = new URLSearchParams(query)
        pQuery.set("page", String(p))
        return apiRequest<ApiEnvelope<any[]>>(`${BASE}/groups?${pQuery.toString()}`, {
          auth: true,
        })
      })
    )
    for (const res of responses) {
      rawList = rawList.concat(unwrapList<any>(res))
    }
  }

  const obligations = rawList.map(normalizeObligation)

  return {
    obligations,
    pagination,
  }
}

/** Detailed group obligation and transaction history from `GET /api/v1/payments/groups/{id}`. */
export async function getGroupObligationDetail(
  groupId: string,
  billingPeriod?: string
): Promise<GroupPaymentDetail> {
  const query = new URLSearchParams()
  if (billingPeriod) query.set("billing_period", billingPeriod)
  const qStr = query.toString() ? `?${query.toString()}` : ""

  const payload = await apiRequest<ApiEnvelope<any>>(
    `${BASE}/groups/${encodeURIComponent(groupId)}${qStr}`,
    { auth: true }
  )
  const detail = unwrapItem<any>(payload)
  if (detail?.obligation) {
    detail.obligation = normalizeObligation(detail.obligation)
  }
  return detail as GroupPaymentDetail
}

/** WORKFLOW A: Create Razorpay Checkout order for Super Admin (full or partial amount). */
export async function createGroupCheckoutOrder(
  groupId: string,
  optionsOrBillingPeriod?: string | { amount?: number; billingPeriod?: string }
): Promise<GroupPaymentOrderCreateResponse> {
  const options =
    typeof optionsOrBillingPeriod === "string"
      ? { billingPeriod: optionsOrBillingPeriod }
      : optionsOrBillingPeriod

  const query = new URLSearchParams()
  if (options?.billingPeriod) query.set("billing_period", options.billingPeriod)
  if (options?.amount) query.set("amount", String(options.amount))
  const qStr = query.toString() ? `?${query.toString()}` : ""

  const payload = await apiRequest<ApiEnvelope<GroupPaymentOrderCreateResponse>>(
    `${BASE}/groups/${encodeURIComponent(groupId)}/order${qStr}`,
    {
      method: "POST",
      body: options?.amount
        ? JSON.stringify({ amount: options.amount, billing_period: options?.billingPeriod })
        : undefined,
      auth: true,
    }
  )
  return unwrapItem<GroupPaymentOrderCreateResponse>(payload)
}

/** Global payment module configuration from `GET /api/v1/payments/settings`. */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const payload = await apiRequest<ApiEnvelope<PaymentSettings>>(`${BASE}/settings`, {
    auth: true,
  })
  return unwrapItem<PaymentSettings>(payload)
}

/** Update payment module configuration from `PUT /api/v1/payments/settings`. */
export async function updatePaymentSettings(
  settings: Partial<PaymentSettings>
): Promise<PaymentSettings> {
  const payload = await apiRequest<ApiEnvelope<PaymentSettings>>(`${BASE}/settings`, {
    method: "PUT",
    body: settings,
    auth: true,
  })
  return unwrapItem<PaymentSettings>(payload)
}

/** WORKFLOW A: Submit checkout signature for verification. */
export async function verifyGroupCheckoutPayment(
  groupId: string,
  data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }
): Promise<GroupPaymentDetail> {
  const payload = await apiRequest<ApiEnvelope<GroupPaymentDetail>>(
    `${BASE}/groups/${encodeURIComponent(groupId)}/verify`,
    {
      method: "POST",
      body: data,
      auth: true,
    }
  )
  return unwrapItem<GroupPaymentDetail>(payload)
}

/** WORKFLOW B: Generate mobile-friendly Razorpay Payment Link for Group Admin. */
export async function createGroupPaymentLink(
  groupId: string,
  billingPeriod?: string
): Promise<GroupPaymentLinkResponse> {
  const query = new URLSearchParams()
  if (billingPeriod) query.set("billing_period", billingPeriod)
  const qStr = query.toString() ? `?${query.toString()}` : ""

  const payload = await apiRequest<ApiEnvelope<GroupPaymentLinkResponse>>(
    `${BASE}/groups/${encodeURIComponent(groupId)}/link${qStr}`,
    {
      method: "POST",
      auth: true,
    }
  )
  return unwrapItem<GroupPaymentLinkResponse>(payload)
}

/** Paginated payment history from `GET /api/v1/payments`. */
export async function listPayments(params: PaymentListParams = {}): Promise<PaymentListResult> {
  const page = params.page ?? 1
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (params.memberId) query.set("member_id", params.memberId)
  if (params.groupOnly) query.set("group_only", "true")

  const payload = await apiRequest<ApiEnvelope<PaymentRecord[]>>(`${BASE}?${query.toString()}`, {
    auth: true,
  })

  return {
    payments: unwrapList<PaymentRecord>(payload),
    pagination: payload?.pagination ?? null,
  }
}

/** A single payment with its transaction history from `GET /api/v1/payments/{id}`. */
export async function getPaymentById(id: string): Promise<PaymentRecord> {
  const payload = await apiRequest<ApiEnvelope<PaymentRecord>>(`${BASE}/${encodeURIComponent(id)}`, {
    auth: true,
  })
  return unwrapItem<PaymentRecord>(payload)
}

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