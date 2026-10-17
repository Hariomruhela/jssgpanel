import { apiRequest, unwrap, unwrapItem, unwrapList } from "@/lib/apiClient"
import { getGroupOptions } from "@/services/api/groups"
import type { ApiEnvelope, MemberCreateInput, MemberDetail, MemberPatchInput, MemberRecord, MembershipStatus } from "@/types"

const BASE = "/members"

export interface MemberListParams {
  page?: number
  pageSize?: number
  query?: string
  /** Social group name as the directory displays it (free text or linked group). */
  groupName?: string
  /** Linked group id; use it when the filter targets a managed group. */
  groupId?: string
  status?: MembershipStatus
}

export interface MemberListResult {
  members: MemberRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MemberGroupOption {
  id: string
  name: string
}

export type MemberGroupOptions = MemberGroupOption[]
export type MemberLocationOptions = MemberGroupOption[]

export interface MembershipCounts {
  pending: number
  approved: number
}

export async function getMembers(params: MemberListParams = {}): Promise<MemberListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const query = params.query?.trim()
  if (query) {
    search.set("search", query)
    search.set("search_key", query)
    search.set("searchKey", query)
    search.set("query", query)
    search.set("q", query)
    search.set("keyword", query)
    search.set("term", query)
    search.set("text", query)
    search.set("filter", query)
    search.set("name", query)
    search.set("full_name", query)
    search.set("fullName", query)
    search.set("first_name", query)
    search.set("middle_name", query)
    search.set("last_name", query)
    search.set("phone", query)
    search.set("phone_number", query)
    search.set("phoneNumber", query)
    search.set("mobile", query)
    search.set("email", query)
    search.set("member_id", query)
    search.set("membership_number", query)
    search.set("membershipNumber", query)
    search.set("id", query)
  }
  if (params.groupName?.trim()) search.set("group_name", params.groupName.trim())
  if (params.groupId?.trim()) search.set("group_id", params.groupId.trim())
  if (params.status) search.set("status", params.status)

  const payload = await apiRequest<ApiEnvelope<MemberRecord[]>>(`${BASE}?${search.toString()}`, { auth: true })
  const members = unwrapList<MemberRecord>(payload)
  const pagination = payload?.pagination

  return {
    members,
    // the API omits `pagination` when a `query` is supplied
    total: pagination?.total ?? members.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

export async function getMember(id: string): Promise<MemberDetail> {
  const payload = await apiRequest<ApiEnvelope<MemberDetail>>(`${BASE}/${id}`, { auth: true })
  return unwrap<MemberDetail>(payload)
}

export async function createMember(input: MemberCreateInput): Promise<MemberRecord> {
  const payload = await apiRequest<ApiEnvelope<MemberRecord>>(BASE, { method: "POST", auth: true, body: input })
  return unwrapItem<MemberRecord>(payload)
}

export async function updateMember(id: string, input: MemberPatchInput): Promise<MemberDetail> {
  const payload = await apiRequest<ApiEnvelope<MemberDetail>>(`${BASE}/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  })
  return unwrapItem<MemberDetail>(payload)
}

export async function removeMember(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE", auth: true })
}

/**
 * Upload or replace a photo slot (`member` or `spouse`). The bytes go to object
 * storage; the answer carries the stored URL and the refreshed member record.
 */
export async function uploadMemberPhoto(
  id: string,
  role: "member" | "spouse",
  file: File
): Promise<{ photoUrl: string | null; member: MemberRecord | null }> {
  const form = new FormData()
  form.append("photo", file)
  const payload = await apiRequest<ApiEnvelope<{ photo_url?: string | null; member?: MemberRecord }>>(
    `${BASE}/${id}/photo/${role}`,
    { method: "POST", auth: true, body: form }
  )
  const data = unwrapItem<{ photo_url?: string | null; member?: MemberRecord }>(payload)
  return { photoUrl: data?.photo_url ?? null, member: data?.member ?? null }
}

/** Clears the stored photo for a slot and the URL carried on the member record. */
export async function deleteMemberPhoto(id: string, role: "member" | "spouse"): Promise<void> {
  await apiRequest(`${BASE}/${id}/photo/${role}`, { method: "DELETE", auth: true })
}

/** Distinct social-group names the members carry, for the directory's group filter. */
export async function getMemberSocialGroups(): Promise<string[]> {
  const payload = await apiRequest<ApiEnvelope<string[]>>(`${BASE}/social-groups`, { auth: true })
  return unwrapList<string>(payload)
}

export async function setMemberStatus(
  id: string,
  status: MembershipStatus,
  rejectionReason?: string
): Promise<MemberDetail> {
  const payload = await apiRequest<ApiEnvelope<MemberDetail>>(`${BASE}/${id}/approve`, {
    method: "POST",
    auth: true,
    body: { status, rejection_reason: rejectionReason?.trim() || null },
  })
  return unwrapItem<MemberDetail>(payload)
}

export async function getMembershipCounts(): Promise<MembershipCounts> {
  const count = async (status: MembershipStatus) => {
    const payload = await apiRequest<ApiEnvelope<MemberRecord[]>>(`${BASE}?status=${status}&page_size=1`, { auth: true })
    return payload?.pagination?.total ?? payload?.data?.length ?? 0
  }
  const [pending, approved] = await Promise.all([count("PENDING"), count("APPROVED")])
  return { pending, approved }
}

/** Groups a member can be assigned to: every group the panel can create/manage. */
export async function getMemberGroups(): Promise<MemberGroupOptions> {
  return getGroupOptions()
}

/** Locations a member can be assigned to. Empty until locations are created. */
export async function getMemberLocations(): Promise<MemberLocationOptions> {
  const payload = await apiRequest<ApiEnvelope<Record<string, unknown>[]>>("/locations?page_size=100", { auth: true })
  return unwrapList<Record<string, unknown>>(payload)
    .map(toOption)
    .filter((location) => location.id && location.name)
}

function toOption(record: Record<string, unknown>): MemberGroupOption {
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? record.location_name ?? record.city ?? record.code ?? record.id ?? ""),
  }
}
