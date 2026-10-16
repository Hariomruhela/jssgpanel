import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import type { ApiEnvelope, GroupInput, GroupMember, GroupRecord } from "@/types"

const BASE = "/groups"

export interface GroupListParams {
  page?: number
  pageSize?: number
  /** Free-text search; the API answers without a `pagination` block for a search. */
  query?: string
  /** `SocialGroup.status`, e.g. `ACTIVE`. Ignored by the API while `query` is set. */
  status?: string
}

export interface GroupListResult {
  groups: GroupRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GroupOption {
  id: string
  name: string
}

export interface GroupMemberListResult {
  members: GroupMember[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Paged, searchable group list for the Group Management table. */
export async function listGroups(params: GroupListParams = {}): Promise<GroupListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const query = params.query?.trim()
  if (query) search.set("query", query)
  if (params.status) search.set("status", params.status)

  const payload = await apiRequest<ApiEnvelope<GroupRecord[]>>(`${BASE}?${search.toString()}`, {
    auth: true,
  })
  const groups = unwrapList<GroupRecord>(payload)
  const pagination = payload?.pagination

  return {
    groups,
    total: pagination?.total ?? groups.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/**
 * Every stored group (the API caps a page at 100). This is what every group
 * dropdown in the panel loads, so a new group shows up as soon as it is created.
 */
export async function getGroups(): Promise<GroupRecord[]> {
  const payload = await apiRequest<ApiEnvelope<GroupRecord[]>>(`${BASE}?page_size=100`, {
    auth: true,
  })
  return unwrapList<GroupRecord>(payload)
}

/** Every stored group, page by page, so the directory is not capped at 100. */
export async function getAllGroups(): Promise<GroupRecord[]> {
  const first = await listGroups({ page: 1, pageSize: 100 })
  const groups = [...first.groups]
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await listGroups({ page, pageSize: 100 })
    groups.push(...next.groups)
  }
  return groups
}

/** The `{id, name}` option list every group select renders. */
export async function getGroupOptions(): Promise<GroupOption[]> {
  return (await getGroups())
    .map((group) => ({ id: group.id, name: group.name }))
    .filter((group) => group.id && group.name)
}

export async function createGroup(input: GroupInput): Promise<GroupRecord> {
  const payload = await apiRequest<ApiEnvelope<GroupRecord>>(BASE, {
    method: "POST",
    auth: true,
    body: input,
  })
  return unwrapItem<GroupRecord>(payload)
}

export async function updateGroup(id: string, input: Partial<GroupInput>): Promise<GroupRecord> {
  const payload = await apiRequest<ApiEnvelope<GroupRecord>>(`${BASE}/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  })
  return unwrapItem<GroupRecord>(payload)
}

export async function removeGroup(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE", auth: true })
}

interface MediaRecord {
  id: string
  url: string
}

/**
 * Upload a group image through `POST /media/upload` (owner_type=group) and
 * return its stored URL, which the caller saves on the group as `logo_url`.
 * Images only, max 10 MB — the API rejects anything else.
 */
export async function uploadGroupImage(groupId: string, file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  form.append("owner_type", "group")
  form.append("owner_id", groupId)
  form.append("is_public", "true")
  const payload = await apiRequest<ApiEnvelope<MediaRecord>>("/media/upload", {
    method: "POST",
    auth: true,
    body: form,
  })
  return unwrapItem<MediaRecord>(payload).url
}

/** Members currently attached to a group. */
export async function getGroupMembers(
  groupId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<GroupMemberListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 100))
  const payload = await apiRequest<ApiEnvelope<GroupMember[]>>(
    `${BASE}/${groupId}/members?page=${page}&page_size=${pageSize}`,
    { auth: true }
  )
  const members = unwrapList<GroupMember>(payload)
  const pagination = payload?.pagination
  return {
    members,
    total: pagination?.total ?? members.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/** Move an existing member profile into the group. */
export async function addGroupMember(groupId: string, memberId: string): Promise<GroupMember> {
  const payload = await apiRequest<ApiEnvelope<GroupMember>>(`${BASE}/${groupId}/members`, {
    method: "POST",
    auth: true,
    body: { member_id: memberId },
  })
  return unwrapItem<GroupMember>(payload)
}

/** Clear the member's group link; the member record itself is kept. */
export async function removeGroupMember(groupId: string, memberId: string): Promise<void> {
  await apiRequest(`${BASE}/${groupId}/members/${memberId}`, { method: "DELETE", auth: true })
}

/**
 * `POST /groups/{id}/admins` — grant a login account the GROUP_ADMIN role for
 * this group. `user_id` is the account's user id, not the member id.
 */
export async function addGroupAdmin(
  groupId: string,
  userId: string,
  roleName = "GROUP_ADMIN"
): Promise<void> {
  await apiRequest(`${BASE}/${groupId}/admins`, {
    method: "POST",
    auth: true,
    body: { user_id: userId, role_name: roleName },
  })
}

/** `DELETE /groups/{id}/admins/{userId}` — revoke a group admin. */
export async function removeGroupAdmin(groupId: string, userId: string): Promise<void> {
  await apiRequest(`${BASE}/${groupId}/admins/${userId}`, { method: "DELETE", auth: true })
}
