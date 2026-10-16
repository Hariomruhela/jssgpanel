import type { Advertisement, AdStatus } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface AdInput {
  title: string
  advertiser: string
  type: Advertisement["type"]
  placement: string
  mediaLabel: string
  startDate: string
  endDate: string
  spend: number
}

export async function getAds(): Promise<Advertisement[]> {
  return delay([...db.ads].sort((a, b) => b.submittedOn.localeCompare(a.submittedOn)))
}

export async function createAd(input: AdInput, submittedBy: string): Promise<Advertisement> {
  const ad: Advertisement = {
    id: nextId(),
    ...input,
    status: "pending",
    impressions: 0,
    clicks: 0,
    submittedBy,
    submittedOn: new Date().toISOString().slice(0, 10),
  }
  db.ads.unshift(ad)
  return delay(ad, 250)
}

export async function updateAdStatus(id: string, status: AdStatus, approvedBy?: string): Promise<Advertisement | undefined> {
  const idx = db.ads.findIndex((a) => a.id === id)
  if (idx === -1) return delay(undefined)
  const nextStatus = status === "approved" ? "active" : status
  db.ads[idx] = {
    ...db.ads[idx],
    status: nextStatus,
    approvedBy: nextStatus === "active" || nextStatus === "rejected" ? approvedBy : db.ads[idx].approvedBy,
  }
  return delay(db.ads[idx], 300)
}

export async function updateAd(id: string, input: Partial<AdInput>): Promise<Advertisement | undefined> {
  const idx = db.ads.findIndex((a) => a.id === id)
  if (idx === -1) return delay(undefined)
  db.ads[idx] = { ...db.ads[idx], ...input }
  return delay(db.ads[idx])
}

export async function removeAd(id: string): Promise<void> {
  const idx = db.ads.findIndex((a) => a.id === id)
  if (idx !== -1) db.ads.splice(idx, 1)
  return delay(undefined, 250)
}