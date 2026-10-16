import type { AdminUser, PermissionKey, Role } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export async function getRoles(): Promise<Role[]> {
  return delay([...db.roles])
}

export async function updateRolePermissions(id: string, permissions: Record<PermissionKey, boolean>): Promise<Role | undefined> {
  const idx = db.roles.findIndex((r) => r.id === id)
  if (idx === -1) return delay(undefined)
  db.roles[idx] = { ...db.roles[idx], permissions }
  return delay(db.roles[idx], 300)
}

export async function createRole(input: Omit<Role, "id" | "users">): Promise<Role> {
  const role: Role = { id: nextId(), users: 0, ...input }
  db.roles.push(role)
  return delay(role, 250)
}

export async function removeRole(id: string): Promise<void> {
  const idx = db.roles.findIndex((r) => r.id === id)
  if (idx !== -1) db.roles.splice(idx, 1)
  return delay(undefined, 250)
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return delay([...db.adminUsers])
}

export interface AdminUserInput {
  name: string
  email: string
  roleId: string
  status: AdminUser["status"]
}

export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  const user: AdminUser = {
    id: nextId(),
    ...input,
    lastLogin: "Never",
    memberSince: new Date().toISOString().slice(0, 10),
  }
  db.adminUsers.push(user)
  const role = db.roles.find((r) => r.id === input.roleId)
  if (role) role.users += 1
  return delay(user, 250)
}

export async function updateAdminUser(id: string, input: Partial<AdminUserInput>): Promise<AdminUser | undefined> {
  const idx = db.adminUsers.findIndex((u) => u.id === id)
  if (idx === -1) return delay(undefined)
  db.adminUsers[idx] = { ...db.adminUsers[idx], ...input }
  return delay(db.adminUsers[idx])
}

export async function removeAdminUser(id: string): Promise<void> {
  const idx = db.adminUsers.findIndex((u) => u.id === id)
  if (idx !== -1) db.adminUsers.splice(idx, 1)
  return delay(undefined, 250)
}