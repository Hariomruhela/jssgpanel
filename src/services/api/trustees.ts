import type { Trustee } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface TrusteeInput {
  name: string
  designation: Trustee["designation"]
  groupId: string
  city: string
  phone: string
  email: string
  tenureFrom: string
  tenureTo: string
  status: Trustee["status"]
}

export async function getTrustees(): Promise<Trustee[]> {
  return delay([...db.trustees].sort((a, b) => a.groupId.localeCompare(b.groupId)))
}

export async function createTrustee(input: TrusteeInput): Promise<Trustee> {
  const trustee: Trustee = { id: nextId(), ...input }
  db.trustees.push(trustee)
  return delay(trustee, 250)
}

export async function updateTrustee(id: string, input: Partial<TrusteeInput>): Promise<Trustee | undefined> {
  const idx = db.trustees.findIndex((t) => t.id === id)
  if (idx === -1) return delay(undefined)
  db.trustees[idx] = { ...db.trustees[idx], ...input }
  return delay(db.trustees[idx])
}

export async function removeTrustee(id: string): Promise<void> {
  const idx = db.trustees.findIndex((t) => t.id === id)
  if (idx !== -1) db.trustees.splice(idx, 1)
  return delay(undefined, 250)
}