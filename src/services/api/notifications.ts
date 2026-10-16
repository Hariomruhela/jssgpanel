import type { Notification, NotificationType } from "@/types"
import { db, delay, nextId } from "@/services/mock/db"

export interface NotificationInput {
  title: string
  message: string
  type: NotificationType
  audience: string
  groups: string[]
  status: Notification["status"]
}

export async function getNotifications(): Promise<Notification[]> {
  return delay([...db.notifications].sort((a, b) => b.sentOn.localeCompare(a.sentOn)))
}

export async function sendNotification(input: NotificationInput, sentBy: string): Promise<Notification> {
  const delivered =
    input.groups.length > 0
      ? db.groups.filter((g) => input.groups.includes(g.id)).reduce((sum, g) => sum + g.memberCount, 0)
      : db.groups.reduce((sum, g) => sum + g.memberCount, 0)
  const item: Notification = {
    id: nextId(),
    ...input,
    sentBy,
    sentOn: new Date().toISOString().slice(0, 10),
    delivered: input.status === "sent" ? delivered : 0,
    opened: input.status === "sent" ? Math.round(delivered * 0.72) : 0,
  }
  db.notifications.unshift(item)
  return delay(item, 500)
}

export async function removeNotification(id: string): Promise<void> {
  const idx = db.notifications.findIndex((n) => n.id === id)
  if (idx !== -1) db.notifications.splice(idx, 1)
  return delay(undefined, 250)
}