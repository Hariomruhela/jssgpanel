import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import type { ApiEnvelope, UserAccount, UserCreateInput } from "@/types"

export interface UserListParams {
  page?: number
  pageSize?: number
}

export async function getUsers(params: UserListParams = {}): Promise<UserAccount[]> {
  const search = new URLSearchParams({
    page: String(Math.max(1, params.page ?? 1)),
    page_size: String(Math.min(100, Math.max(1, params.pageSize ?? 100))),
  })
  const payload = await apiRequest<ApiEnvelope<UserAccount[]>>(`/users?${search.toString()}`, { auth: true })
  return unwrapList<UserAccount>(payload)
}

export async function createUser(input: UserCreateInput): Promise<UserAccount> {
  const payload = await apiRequest("/users", { method: "POST", auth: true, body: input })
  return unwrapItem<UserAccount>(payload)
}

/**
 * `PATCH /users/{id}/role` — role changes are only allowed with `role.manage`
 * (a Super Admin), and a GROUP_ADMIN must name the group it administers.
 * The panel offers exactly three roles: SUPER_ADMIN, GROUP_ADMIN, MEMBER.
 */
export async function changeUserRole(
  userId: string,
  roleName: string,
  groupId?: string | null
): Promise<UserAccount> {
  const payload = await apiRequest<ApiEnvelope<UserAccount>>(`/users/${userId}/role`, {
    method: "PATCH",
    auth: true,
    body: { role_name: roleName, group_id: groupId ?? null },
  })
  return unwrapItem<UserAccount>(payload)
}
