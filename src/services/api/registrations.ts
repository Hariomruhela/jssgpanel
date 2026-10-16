import type { Registration } from "@/types"
import { db, delay } from "@/services/mock/db"

export async function getRegistrations(): Promise<Registration[]> {
  return delay([...db.registrations])
}

export async function approveRegistration(id: string, reviewedBy: string, notes?: string): Promise<Registration | undefined> {
  const reg = db.registrations.find((r) => r.id === id)
  if (!reg) return delay(undefined)
  reg.status = "approved"
  reg.reviewedBy = reviewedBy
  reg.reviewedOn = new Date().toISOString().slice(0, 10)
  if (notes) reg.notes = notes
  db.members.unshift({
    id: `m-${Date.now()}`,
    regNo: `MEM-${String(1100 + db.members.length).padStart(4, "0")}`,
    name: reg.name,
    email: reg.email,
    phone: reg.phone,
    dob: reg.dob,
    gender: reg.gender,
    occupation: "Business",
    groupId: reg.groupId,
    city: reg.city,
    state: db.groups.find((g) => g.id === reg.groupId)?.state ?? "",
    address: reg.city,
    familySize: 1,
    joinedOn: new Date().toISOString().slice(0, 10),
    status: "active",
  })
  return delay(reg, 250)
}

export async function rejectRegistration(id: string, reviewedBy: string, notes: string): Promise<Registration | undefined> {
  const reg = db.registrations.find((r) => r.id === id)
  if (!reg) return delay(undefined)
  reg.status = "rejected"
  reg.reviewedBy = reviewedBy
  reg.reviewedOn = new Date().toISOString().slice(0, 10)
  reg.notes = notes
  return delay(reg, 250)
}