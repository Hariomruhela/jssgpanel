import type { CommunityInfo } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface CommunityInfoInput {
  title: string
  category: string
  content: string
  featured: boolean
  status: CommunityInfo["status"]
}

export async function getCommunityInfo(): Promise<CommunityInfo[]> {
  return delay([...db.communityInfo])
}

export async function createCommunityInfo(input: CommunityInfoInput, updatedBy: string): Promise<CommunityInfo> {
  const info: CommunityInfo = {
    id: nextId(),
    ...input,
    updatedBy,
    updatedOn: new Date().toISOString().slice(0, 10),
  }
  db.communityInfo.unshift(info)
  return delay(info, 250)
}

export async function updateCommunityInfo(id: string, input: Partial<CommunityInfoInput>, updatedBy: string): Promise<CommunityInfo | undefined> {
  const idx = db.communityInfo.findIndex((c) => c.id === id)
  if (idx === -1) return delay(undefined)
  db.communityInfo[idx] = {
    ...db.communityInfo[idx],
    ...input,
    updatedBy,
    updatedOn: new Date().toISOString().slice(0, 10),
  }
  return delay(db.communityInfo[idx])
}

export async function removeCommunityInfo(id: string): Promise<void> {
  const idx = db.communityInfo.findIndex((c) => c.id === id)
  if (idx !== -1) db.communityInfo.splice(idx, 1)
  return delay(undefined, 250)
}