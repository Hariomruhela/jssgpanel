import type { Announcement, PublishStatus } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface AnnouncementInput {
  title: string
  category: string
  summary: string
  author: string
  publishedOn: string
  publishStatus: PublishStatus
  pinned: boolean
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return delay([...db.announcements].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)))
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const item: Announcement = { id: nextId(), ...input }
  db.announcements.unshift(item)
  return delay(item, 250)
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>): Promise<Announcement | undefined> {
  const idx = db.announcements.findIndex((a) => a.id === id)
  if (idx === -1) return delay(undefined)
  db.announcements[idx] = { ...db.announcements[idx], ...input }
  return delay(db.announcements[idx])
}

export async function removeAnnouncement(id: string): Promise<void> {
  const idx = db.announcements.findIndex((a) => a.id === id)
  if (idx !== -1) db.announcements.splice(idx, 1)
  return delay(undefined, 250)
}