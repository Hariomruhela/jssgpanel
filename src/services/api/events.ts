import type { CommunityEvent, EventStatus } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface EventInput {
  title: string
  category: string
  date: string
  time: string
  location: string
  city: string
  organizerId: string
  capacity: number
  status: EventStatus
  description: string
}

export async function getEvents(): Promise<CommunityEvent[]> {
  return delay([...db.events].sort((a, b) => b.date.localeCompare(a.date)))
}

export async function createEvent(input: EventInput): Promise<CommunityEvent> {
  const event: CommunityEvent = { id: nextId(), attendeeCount: 0, ...input }
  db.events.push(event)
  return delay(event, 250)
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<CommunityEvent | undefined> {
  const idx = db.events.findIndex((e) => e.id === id)
  if (idx === -1) return delay(undefined)
  db.events[idx] = { ...db.events[idx], ...input }
  return delay(db.events[idx])
}

export async function removeEvent(id: string): Promise<void> {
  const idx = db.events.findIndex((e) => e.id === id)
  if (idx !== -1) db.events.splice(idx, 1)
  return delay(undefined, 250)
}