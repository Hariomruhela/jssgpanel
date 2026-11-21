import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { AppNotificationCategory, AppNotificationItem } from "@/types"
import { formatCurrency } from "@/lib/format"
import {
  isNotificationSoundEnabled,
  playNotificationChime,
  setNotificationSoundEnabled,
} from "@/lib/notificationSound"
import { showDesktopNotification } from "@/lib/desktopNotification"
import { listContributions } from "@/services/api/contributions"
import { listPayments } from "@/services/api/payments"
import { isSignedIn } from "@/services/api/session"

const STORAGE_KEY = "jssg_received_payments_store_v2"
const SEEN_IDS_KEY = "jssg_seen_payment_ids_v2"
const MAX_NOTIFICATIONS = 100

export type NewNotificationInput = {
  id?: string | null
  orderId?: string | null
  category: AppNotificationCategory
  title: string
  message: string
  amount?: number | null
  donorName?: string | null
  groupName?: string | null
  receiptNo?: string | null
  transactionId?: string | null
  link?: string | null
}

interface NotificationContextValue {
  notifications: AppNotificationItem[]
  unreadCount: number
  soundEnabled: boolean
  toggleSound: () => void
  addNotification: (input: NewNotificationInput) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

/** Seed notifications (Only received payments/contributions, zero due/reminder alerts) */
const INITIAL_SEEDS: AppNotificationItem[] = [
  {
    id: "notif-seed-1",
    category: "contribution",
    title: "Contribution Received",
    message: "₹11,000 received from Shri Mahendra Shah for Sadarmik Sahayata Fund",
    amount: 11000,
    donorName: "Shri Mahendra Shah",
    groupName: "JSSG Central Ahmedabad",
    receiptNo: "REC-2026-0012",
    transactionId: "pay_Q8vK9w2Z0p1LmX",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
    link: "/admin/contributions",
  },
  {
    id: "notif-seed-2",
    category: "group_payment",
    title: "Group Payment Received",
    message: "₹25,000 payment received from JSSG Mumbai Metro",
    amount: 25000,
    groupName: "JSSG Mumbai Metro",
    receiptNo: "REC-2026-0013",
    transactionId: "pay_R1aL2b3C4d5EfG",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: true,
    link: "/admin/payments",
  },
  {
    id: "notif-seed-3",
    category: "ad_payment",
    title: "Ad Payment Received",
    message: "₹18,500 received for advertisement: Navkarshi Jewellers",
    amount: 18500,
    groupName: "Navkarshi Jewellers",
    receiptNo: "REC-2026-0014",
    transactionId: "pay_K9mN8b7V6c5X4z",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    link: "/admin/advertisements",
  },
]

function getStoredNotifications(): AppNotificationItem[] {
  try {
    // Purge legacy storage key containing old unformatted seeds
    localStorage.removeItem("jssg_app_notifications")
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strictly filter out any due payment or reminder notifications
        const filtered = parsed.filter(
          (item) =>
            !item.title?.toLowerCase().includes("due") &&
            !item.title?.toLowerCase().includes("reminder") &&
            !item.message?.toLowerCase().includes("reminder") &&
            !item.message?.toLowerCase().includes("due")
        )
        if (filtered.length > 0) return filtered
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_SEEDS
}

function saveStoredNotifications(items: AppNotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)))
  } catch {
    // ignore
  }
}

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return new Set(arr)
    }
  } catch {
    // ignore
  }
  return new Set()
}

function saveSeenIds(ids: Set<string>): void {
  try {
    // Keep max 500 ids
    const arr = Array.from(ids).slice(-500)
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(arr))
  } catch {
    // ignore
  }
}

/** Global event name to trigger instant payment notification from anywhere in the app */
export const NOTIFICATION_TRIGGER_EVENT = "jssg:payment-notification"

export function triggerPaymentNotification(input: NewNotificationInput): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_TRIGGER_EVENT, { detail: input }))
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotificationItem[]>(getStoredNotifications)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isNotificationSoundEnabled)
  const seenIdsRef = useRef<Set<string>>(getSeenIds())
  const isInitialSyncRef = useRef<boolean>(seenIdsRef.current.size === 0)
  const recentAlertsRef = useRef<Map<string, number>>(new Map())

  // Keep localStorage updated when notifications change
  useEffect(() => {
    saveStoredNotifications(notifications)
  }, [notifications])

  // Proactively purge legacy duplicates and "due" text from state
  useEffect(() => {
    setNotifications((prev) => {
      // Find amounts of all actual contributions
      const contributionAmounts = new Set(
        prev.filter((n) => n.category === "contribution" && n.amount).map((n) => n.amount)
      )

      return prev
        .filter((item) => {
          // If a generic "Group Payment" was generated via OFFLINE matching a contribution, remove it
          if (
            item.category === "group_payment" &&
            item.message?.includes("via OFFLINE") &&
            item.amount &&
            contributionAmounts.has(item.amount)
          ) {
            return false
          }
          return true
        })
        .map((item) => {
          if (
            item.title?.toLowerCase().includes("due") ||
            item.message?.toLowerCase().includes("due")
          ) {
            return {
              ...item,
              title: "Group Payment Received",
              message: item.message.replace(/federation dues/gi, "payment").replace(/due[s]?/gi, "payment"),
            }
          }
          return item
        })
    })
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      setNotificationSoundEnabled(next)
      if (next) {
        // Quick preview chime when user enables sound
        playNotificationChime()
        toast.info("Notification sound enabled")
      } else {
        toast.info("Notification sound muted")
      }
      return next
    })
  }, [])

  const addNotification = useCallback((input: NewNotificationInput) => {
    // Unique deduplication key for this notification event
    const alertKey =
      input.transactionId ||
      input.receiptNo ||
      input.id ||
      input.orderId ||
      `${input.category}:${input.title}:${input.amount || 0}:${input.message}`

    // Deduplicate rapid triggers (within 5 seconds) to prevent multiple identical alerts
    const now = Date.now()
    const lastAlertTime = recentAlertsRef.current.get(alertKey)
    if (lastAlertTime && now - lastAlertTime < 5000) {
      return
    }
    recentAlertsRef.current.set(alertKey, now)

    // Clean up memory if recentAlertsRef grows
    if (recentAlertsRef.current.size > 200) {
      for (const [k, time] of recentAlertsRef.current.entries()) {
        if (now - time > 60000) {
          recentAlertsRef.current.delete(k)
        }
      }
    }

    // Lock IDs immediately to block duplicate polling
    if (input.transactionId) seenIdsRef.current.add(input.transactionId)
    if (input.receiptNo) seenIdsRef.current.add(input.receiptNo)
    if (input.id) seenIdsRef.current.add(input.id)
    if (input.orderId) seenIdsRef.current.add(input.orderId)
    saveSeenIds(seenIdsRef.current)

    const notifId = `notif-${now}-${Math.random().toString(36).substring(2, 7)}`
    const newItem: AppNotificationItem = {
      id: notifId,
      category: input.category,
      title: input.title,
      message: input.message,
      amount: input.amount,
      donorName: input.donorName,
      groupName: input.groupName,
      receiptNo: input.receiptNo,
      transactionId: input.transactionId,
      timestamp: new Date(now).toISOString(),
      read: false,
      link: input.link,
    }

    // --- SIDE EFFECTS EXECUTED OUTSIDE STATE UPDATER (Runs exactly once!) ---
    // 1. Play soft audio chime
    playNotificationChime()

    // 2. Show Sonner Toast Alert with dedicated id to prevent stacking duplicates
    const toastId = `toast-notif-${alertKey}`
    const amountStr = input.amount ? ` • ${formatCurrency(input.amount)}` : ""
    toast.success(`${input.title}${amountStr}`, {
      id: toastId,
      description: input.message,
      action: input.link
        ? {
            label: "View",
            onClick: () => {
              if (input.link) window.location.href = input.link
            },
          }
        : undefined,
      duration: 6000,
    })

    // 3. Show Desktop Notification if permitted
    showDesktopNotification(input.title, {
      body: input.message,
      onClick: () => {
        if (input.link) window.location.href = input.link
      },
    })

    // --- PURE STATE UPDATE ---
    setNotifications((prev) => {
      // Check if duplicate already exists in state
      const isDuplicate = prev.some((n) => {
        if (input.transactionId && n.transactionId && input.transactionId === n.transactionId) return true
        if (input.receiptNo && n.receiptNo && input.receiptNo === n.receiptNo) return true
        if (
          input.amount &&
          n.amount === input.amount &&
          Math.abs(now - new Date(n.timestamp).getTime()) < 180000 &&
          (n.category === input.category || n.message?.includes("via OFFLINE"))
        ) {
          return true
        }
        return false
      })

      if (isDuplicate) return prev
      return [newItem, ...prev]
    })
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Listen to custom window events for instant notifications from payment forms
  useEffect(() => {
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<NewNotificationInput>
      if (customEvent.detail) {
        // Track the ID to avoid duplicate alert if background polling fetches it later
        if (customEvent.detail.transactionId) {
          seenIdsRef.current.add(customEvent.detail.transactionId)
        }
        if (customEvent.detail.receiptNo) {
          seenIdsRef.current.add(customEvent.detail.receiptNo)
        }
        if (customEvent.detail.id) {
          seenIdsRef.current.add(customEvent.detail.id)
        }
        if (customEvent.detail.orderId) {
          seenIdsRef.current.add(customEvent.detail.orderId)
        }
        saveSeenIds(seenIdsRef.current)
        addNotification(customEvent.detail)
      }
    }

    window.addEventListener(NOTIFICATION_TRIGGER_EVENT, handleCustomEvent)
    return () => window.removeEventListener(NOTIFICATION_TRIGGER_EVENT, handleCustomEvent)
  }, [addNotification])

  // Background Polling: Checks backend every 45s for remote payments/contributions
  useEffect(() => {
    let timer: any = null
    let isCancelled = false

    const checkNewPayments = async () => {
      if (!isSignedIn()) return

      try {
        // 1. Fetch recent contributions
        const contribRes = await listContributions({ pageSize: 10 }).catch(() => null)
        if (contribRes?.items && !isCancelled) {
          const isFirstRun = isInitialSyncRef.current

          for (const item of contribRes.items) {
            // Strictly only successful/paid contributions
            if (item.status && item.status.toUpperCase() !== "SUCCESS") continue

            const trackKeys = [item.transaction_id, item.receipt_no, item.id, item.order_id].filter(Boolean) as string[]
            const alreadySeen = trackKeys.some((k) => seenIdsRef.current.has(k))
            if (alreadySeen) continue

            trackKeys.forEach((k) => seenIdsRef.current.add(k))

            // Only trigger active notification if this isn't the initial page cold start
            if (!isFirstRun) {
              addNotification({
                id: item.id,
                orderId: item.order_id,
                category: "contribution",
                title: "Contribution Received",
                message: `Contribution of ${formatCurrency(item.amount)} received from ${item.donor_name || item.member_name} (${item.purpose})`,
                amount: item.amount,
                donorName: item.donor_name || item.member_name,
                groupName: item.group_name,
                receiptNo: item.receipt_no,
                transactionId: item.transaction_id,
                link: "/admin/contributions",
              })
            }
          }
        }

        // 2. Fetch recent group obligation payments only (fee_id must exist)
        const paymentRes = await listPayments({ pageSize: 10 }).catch(() => null)
        if (paymentRes?.payments && !isCancelled) {
          const isFirstRun = isInitialSyncRef.current

          for (const pay of paymentRes.payments) {
            // Strictly ignore pending, unpaid, overdue, or failed
            const isPaid = pay.status === "paid" || pay.status === "SUCCESS"
            if (!isPaid) continue

            // Crucial: Only payments with fee_id are group fee payments.
            // Contributions stored in backend payments table have fee_id = null!
            if (!pay.fee_id) continue

            const trackKeys = [pay.id, pay.order_id, pay.provider_reference].filter(Boolean) as string[]
            const alreadySeen = trackKeys.some((k) => seenIdsRef.current.has(k))
            if (alreadySeen) continue

            trackKeys.forEach((k) => seenIdsRef.current.add(k))

            if (!isFirstRun) {
              const numAmount =
                typeof pay.amount === "number"
                  ? pay.amount
                  : parseFloat(String(pay.amount)) || 0
              addNotification({
                id: pay.id,
                orderId: pay.order_id,
                category: "group_payment",
                title: "Group Payment Received",
                message: `Payment of ${formatCurrency(numAmount)} received via ${pay.provider || "Online"}`,
                amount: numAmount,
                receiptNo: pay.provider_reference || pay.order_id || undefined,
                transactionId: pay.id,
                link: "/admin/payments",
              })
            }
          }
        }

        if (isInitialSyncRef.current) {
          isInitialSyncRef.current = false
        }
        saveSeenIds(seenIdsRef.current)
      } catch (err) {
        console.debug("Background notification sync error:", err)
      }
    }

    // Run initial check after 2 seconds
    const initialTimer = setTimeout(checkNewPayments, 2000)

    // Then poll every 45 seconds
    timer = setInterval(checkNewPayments, 45000)

    return () => {
      isCancelled = true
      clearTimeout(initialTimer)
      clearInterval(timer)
    }
  }, [addNotification])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      soundEnabled,
      toggleSound,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }),
    [
      notifications,
      unreadCount,
      soundEnabled,
      toggleSound,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    ]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useAppNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useAppNotifications must be used within a NotificationProvider")
  }
  return context
}
