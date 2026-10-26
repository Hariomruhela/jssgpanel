import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import type {
  ApiEnvelope,
  MemberTrusteeRecord,
  TrusteeCreateInput,
  TrusteeRecord,
  TrusteeUpdateInput,
} from "@/types"

const BASE = "/trustees"

export interface TrusteeListParams {
  page?: number
  pageSize?: number
  /** Narrow the listing to one social group. */
  groupId?: string
  /** Only the trustees holding this exact designation (case-insensitive). */
  designation?: string
  /** Free-text search over the name, the membership number and the designation. */
  query?: string
  /** Only the approved members (`true`) or only the ones that are not approved yet. */
  isCurrent?: boolean
}

export interface TrusteeListResult {
  trustees: MemberTrusteeRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BoardSeatListParams {
  page?: number
  pageSize?: number
  groupId?: string
  isCurrent?: boolean
}

export interface BoardSeatListResult {
  seats: TrusteeRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TrusteeCounts {
  total: number
}

function listQuery(params: TrusteeListParams): URLSearchParams {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (params.groupId) search.set("group_id", params.groupId)
  if (params.designation?.trim()) search.set("designation", params.designation.trim())
  if (params.query?.trim()) search.set("query", params.query.trim())
  if (params.isCurrent !== undefined) search.set("is_current", String(params.isCurrent))
  return search
}

/**
 * The post holders of the directory (`GET /trustees`).
 *
 * A post holder is a member whose linked account is a group/platform admin or
 * whose group designation is a recognised office (President, Secretary,
 * Treasurer, ...). This is the member listing narrowed to those members - it is
 * what the panel's post holder table shows.
 */
export async function getTrustees(
  params: TrusteeListParams = {}
): Promise<TrusteeListResult> {
  const payload = await apiRequest<ApiEnvelope<MemberTrusteeRecord[]>>(
    `${BASE}?${listQuery(params).toString()}`,
    { auth: true }
  )
  const trustees = unwrapList<MemberTrusteeRecord>(payload)
  const pagination = payload?.pagination

  return {
    trustees,
    total: pagination?.total ?? trustees.length,
    page: pagination?.page ?? params.page ?? 1,
    pageSize: pagination?.page_size ?? params.pageSize ?? 20,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/**
 * The board seats of the `trustees` table (`GET /trustees/board`).
 *
 * A seat is the board's own record of a post holder: it carries the term and
 * the order of the seat. A member can be a post holder without a seat (their
 * designation is enough), so the panel reads the seats to learn the term and
 * writes one when the post holder is edited.
 */
export async function getBoardSeats(
  params: BoardSeatListParams = {}
): Promise<BoardSeatListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (params.groupId) search.set("group_id", params.groupId)
  if (params.isCurrent !== undefined) search.set("is_current", String(params.isCurrent))

  const payload = await apiRequest<ApiEnvelope<TrusteeRecord[]>>(
    `${BASE}/board?${search.toString()}`,
    { auth: true }
  )
  const seats = unwrapList<TrusteeRecord>(payload)
  const pagination = payload?.pagination

  return {
    seats,
    total: pagination?.total ?? seats.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/** Every board seat, page by page, so the term of every trustee is known. */
export async function getAllBoardSeats(groupId?: string): Promise<TrusteeRecord[]> {
  const first = await getBoardSeats({ page: 1, pageSize: 100, groupId })
  const seats = [...first.seats]
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getBoardSeats({ page, pageSize: 100, groupId })
    seats.push(...next.seats)
  }
  return seats
}

/**
 * How many post holders the directory holds.
 *
 * The count is a listing of one row, so the panel does not have to pull the
 * whole directory to know how many post holders there are. The same search and
 * filters as the listing can be passed, so the count follows them.
 */
export async function getTrusteeCounts(params: TrusteeListParams = {}): Promise<TrusteeCounts> {
  const payload = await apiRequest<ApiEnvelope<MemberTrusteeRecord[]>>(
    `${BASE}?${listQuery({ ...params, page: 1, pageSize: 1 }).toString()}`,
    { auth: true }
  )
  return { total: payload?.pagination?.total ?? payload?.data?.length ?? 0 }
}

/**
 * Record a post holder (`POST /trustees`).
 *
 * The seat belongs to the member it is created for, so the API mirrors the
 * designation onto that member and the post holder shows up in the trustee
 * listing straight away.
 */
export async function createPostHolder(input: TrusteeCreateInput): Promise<TrusteeRecord> {
  const payload = await apiRequest<ApiEnvelope<TrusteeRecord>>(BASE, {
    method: "POST",
    auth: true,
    body: input,
  })
  return unwrapItem<TrusteeRecord>(payload)
}

/** Update a post holder (`PATCH /trustees/{id}`); only the sent fields change. */
export async function updatePostHolder(
  id: string,
  input: TrusteeUpdateInput
): Promise<TrusteeRecord> {
  const payload = await apiRequest<ApiEnvelope<TrusteeRecord>>(`${BASE}/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  })
  return unwrapItem<TrusteeRecord>(payload)
}

/** Remove a post holder (`DELETE /trustees/{id}`); the seat is soft-deleted. */
export async function removePostHolder(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE", auth: true })
}
