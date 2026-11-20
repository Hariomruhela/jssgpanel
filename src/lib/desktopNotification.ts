/**
 * Browser Desktop Web Notification utility using native HTML5 Notification API.
 * Free, zero-cost, no third-party service required.
 */

export function isDesktopNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function getDesktopNotificationPermission(): NotificationPermission {
  if (!isDesktopNotificationSupported()) return "denied"
  return Notification.permission
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!isDesktopNotificationSupported()) return false
  try {
    const result = await Notification.requestPermission()
    return result === "granted"
  } catch {
    return false
  }
}

export function showDesktopNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    onClick?: () => void
  }
): void {
  if (!isDesktopNotificationSupported() || Notification.permission !== "granted") {
    return
  }

  try {
    const n = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/hand_icon.png",
      badge: "/hand_icon.png",
      tag: options?.tag,
      silent: true, // We already play our own pleasant Web Audio chime
    })

    if (options?.onClick) {
      n.onclick = () => {
        window.focus()
        options.onClick?.()
        n.close()
      }
    }

    // Auto-close after 6 seconds
    setTimeout(() => {
      try {
        n.close()
      } catch {
        // ignore
      }
    }, 6000)
  } catch {
    // Non-blocking
  }
}
