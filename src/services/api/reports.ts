import { db, delay } from "@/services/mock/db"
import type { Member } from "@/types"

export interface DirectoryRow {
  regNo: string
  name: string
  gender: string
  group: string
  city: string
  state: string
  phone: string
  email: string
  joinedOn: string
  status: string
}

export async function getDirectory(): Promise<DirectoryRow[]> {
  return delay(
    db.members.map((m) => ({
      regNo: m.regNo,
      name: m.name,
      gender: m.gender,
      group: db.groups.find((g) => g.id === m.groupId)?.name ?? m.groupId,
      city: m.city,
      state: m.state,
      phone: m.phone,
      email: m.email,
      joinedOn: m.joinedOn,
      status: m.status === "active" ? "Active" : "Inactive",
    }))
  )
}

export interface GroupSummaryRow {
  id: string
  code: string
  name: string
  city: string
  state: string
  members: number
  postHolders: number
  events: number
  collectionRate: number
  membershipStatus: string
}

export async function getGroupSummary(): Promise<GroupSummaryRow[]> {
  return delay(
    db.groups.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      city: g.city,
      state: g.state,
      members: g.memberCount,
      postHolders: db.postHolders.filter((t) => t.groupId === g.id).length,
      events: db.events.filter((e) => e.organizerId === g.id).length,
      collectionRate: db.feeConfigs.find((f) => f.groupId === g.id)?.collectionRate ?? 0,
      membershipStatus: g.status === "active" ? "Active" : "Inactive",
    }))
  )
}

export interface FeeOutstandingRow {
  group: string
  totalMembers: number
  feeAmount: number
  expected: number
  collected: number
  outstanding: number
  collectionRate: number
  membersPaid: number
  membersUnpaid: number
}

export async function getFeeOutstandingReport(): Promise<FeeOutstandingRow[]> {
  return delay(
    db.groups.map((g) => {
      const fee = db.feeConfigs.find((f) => f.groupId === g.id)
      const amount = fee?.amount ?? 15000
      const expected = g.memberCount * amount
      const collected = db.transactions
        .filter((t) => t.groupId === g.id && t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0)
      const membersPaid = Math.min(g.memberCount, Math.round(collected / amount))
      return {
        group: g.name,
        totalMembers: g.memberCount,
        feeAmount: amount,
        expected,
        collected,
        outstanding: Math.max(0, expected - collected),
        collectionRate: expected === 0 ? 0 : Math.round((collected / expected) * 100),
        membersPaid,
        membersUnpaid: Math.max(0, g.memberCount - membersPaid),
      }
    })
  )
}

export async function getMembersExport(): Promise<Member[]> {
  return delay([...db.members])
}