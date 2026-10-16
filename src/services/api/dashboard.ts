import type {
  CollectionPoint,
  DashboardStats,
  GroupCollection,
  Member,
  MemberGrowthPoint,
  Registration,
  RegistrationTrendPoint,
  CommunityEvent,
} from "@/types"
import { db, delay } from "@/services/mock/db"

export async function getDashboardStats(): Promise<DashboardStats> {
  const activeGroups = db.groups.filter((g) => g.status === "active").length
  const pendingRegistrations = db.registrations.filter((r) => r.status === "pending").length
  const totalLocations = db.cities.filter((c) => c.status === "active").length
  const collectedThisYear = db.transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0)
  const expectedTotal = db.feeConfigs.reduce((sum, f) => sum + f.totalMembers * f.amount, 0)
  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const newMembersThisMonth = db.members.filter((m) => new Date(m.joinedOn) > monthAgo).length
  return delay({
    totalMembers: db.members.length,
    activeGroups,
    pendingRegistrations,
    totalLocations,
    collectedThisYear,
    outstandingFees: Math.max(0, expectedTotal - collectedThisYear),
    upcomingEvents: db.events.filter((e) => e.status === "upcoming" || e.status === "ongoing").length,
    activeAds: db.ads.filter((a) => a.status === "active").length,
    newMembersThisMonth,
  })
}

export async function getMemberGrowth(): Promise<MemberGrowthPoint[]> {
  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]
  return delay(
    months.map((m) => ({
      month: new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" }),
      members: db.members.filter((mem) => mem.joinedOn.slice(0, 7) <= m).length,
    }))
  )
}

export async function getCollections(): Promise<CollectionPoint[]> {
  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]
  const expectedPerMonth = db.feeConfigs.reduce((sum, f) => sum + f.totalMembers * f.amount, 0) / 9
  return delay(
    months.map((m) => ({
      month: new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" }),
      collected: db.transactions
        .filter((t) => t.paidOn.startsWith(m) && t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0),
      target: Math.round(expectedPerMonth * (months.indexOf(m) + 1)),
    }))
  )
}

export async function getGroupCollections(): Promise<GroupCollection[]> {
  const rows = db.groups.map((g) => {
    const fee = db.feeConfigs.find((f) => f.groupId === g.id)
    const amount = fee?.amount ?? 15000
    const collected = db.transactions
      .filter((t) => t.groupId === g.id && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0)
    return {
      groupId: g.id,
      name: g.name.length > 22 ? `${g.name.slice(0, 20)}…` : g.name,
      collected,
      outstanding: Math.max(0, g.memberCount * amount - collected),
    }
  })
  return delay(rows)
}

export async function getRegistrationTrend(): Promise<RegistrationTrendPoint[]> {
  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
  return delay(
    months.map((m) => {
      const applied = db.registrations.filter((r) => r.appliedOn.startsWith(m)).length + 4
      return {
        month: new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" }),
        applied,
        approved: Math.round(applied * 0.7),
        rejected: applied - Math.round(applied * 0.7),
      }
    })
  )
}

export async function getUpcomingEvents(): Promise<CommunityEvent[]> {
  return delay(
    db.events
      .filter((e) => e.status === "upcoming" || e.status === "ongoing")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  )
}

export async function getRecentRegistrations(): Promise<Registration[]> {
  return delay(
    [...db.registrations]
      .filter((r) => r.status === "pending")
      .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))
      .slice(0, 5)
  )
}

export async function getRecentMembers(): Promise<Member[]> {
  return delay(
    [...db.members].sort((a, b) => b.joinedOn.localeCompare(a.joinedOn)).slice(0, 5)
  )
}