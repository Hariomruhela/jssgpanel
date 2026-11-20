import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  HeartHandshake,
  IndianRupee,
  Megaphone,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppNotifications } from "@/lib/notifications"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AppNotificationCategory, AppNotificationItem } from "@/types"
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
} from "@/lib/desktopNotification"

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 45) return "Just now"
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  } catch {
    return "Recently"
  }
}

export function NotificationPopover() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | AppNotificationCategory>("all")
  const [desktopPerm, setDesktopPerm] = useState(getDesktopNotificationPermission)

  const {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useAppNotifications()

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "all") return true
    return item.category === filter
  })

  const handleItemClick = (item: AppNotificationItem) => {
    markAsRead(item.id)
    if (item.link) {
      setOpen(false)
      navigate(item.link)
    }
  }

  const handleEnableDesktop = async () => {
    const granted = await requestDesktopNotificationPermission()
    setDesktopPerm(granted ? "granted" : "denied")
  }

  const getCategoryIcon = (category: AppNotificationCategory) => {
    switch (category) {
      case "contribution":
        return (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <HeartHandshake className="size-4" />
          </div>
        )
      case "group_payment":
        return (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <IndianRupee className="size-4" />
          </div>
        )
      case "ad_payment":
        return (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Megaphone className="size-4" />
          </div>
        )
      default:
        return (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FAF6EE] text-[#8C6D46]">
            <Bell className="size-4" />
          </div>
        )
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative flex size-10 items-center justify-center rounded-xl bg-[#FAF6EE] hover:bg-[#F3EAD8] text-[#2B1E16] border border-[#E8DFD1] shadow-xs transition-all duration-150 active:scale-95 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="size-5.5 sm:size-6 text-[#2B1E16]" strokeWidth={2.2} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-[#E53935] text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-in zoom-in-50 duration-200">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-[#E53935]/40 pointer-events-none" />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[400px] p-0 border-[#E8DFD1] bg-white shadow-2xl rounded-2xl overflow-hidden z-50 text-[#2B1E16]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE5D8] bg-[#FAF8F5] px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#2B1E16]">Received Payments</h3>
            {unreadCount > 0 ? (
              <Badge className="bg-[#E53935] hover:bg-[#E53935] text-white text-[10px] h-5 px-1.5 font-bold">
                {unreadCount} new
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground font-normal">All caught up</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Audio chime toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7 rounded-md transition-colors",
                soundEnabled
                  ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-muted-foreground hover:bg-slate-100"
              )}
              onClick={toggleSound}
              title={soundEnabled ? "Mute payment sound" : "Enable payment sound"}
            >
              {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </Button>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#8C6D46] hover:text-[#5F462B] hover:bg-[#FAF6EE] px-2 font-medium"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5 mr-1" />
                Read all
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills - Only Received Payments */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#F0EAE1] bg-white text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors",
              filter === "all"
                ? "bg-[#3D2B1F] text-white shadow-xs"
                : "text-muted-foreground hover:bg-[#FAF6EE] hover:text-[#2B1E16]"
            )}
          >
            All Received ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("contribution")}
            className={cn(
              "px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors",
              filter === "contribution"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Contributions
          </button>
          <button
            type="button"
            onClick={() => setFilter("group_payment")}
            className={cn(
              "px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors",
              filter === "group_payment"
                ? "bg-amber-800 text-white shadow-xs"
                : "text-muted-foreground hover:bg-amber-50 hover:text-amber-900"
            )}
          >
            Group Payments
          </button>
          <button
            type="button"
            onClick={() => setFilter("ad_payment")}
            className={cn(
              "px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors",
              filter === "ad_payment"
                ? "bg-sky-700 text-white shadow-xs"
                : "text-muted-foreground hover:bg-sky-50 hover:text-sky-800"
            )}
          >
            Ads
          </button>
        </div>

        {/* Browser permission banner if not granted */}
        {desktopPerm === "default" && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900">
            <span>Get desktop alerts when payments arrive?</span>
            <button
              onClick={handleEnableDesktop}
              className="font-semibold text-amber-950 underline hover:no-underline ml-2"
            >
              Enable
            </button>
          </div>
        )}

        {/* Notification List Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F4EFE8]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground">
              <div className="size-12 rounded-full bg-[#FAF6EE] flex items-center justify-center text-[#C5A059] mb-2">
                <BellOff className="size-5" />
              </div>
              <p className="font-medium text-sm text-[#2B1E16]">No received payments yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Incoming contribution, group, and advertisement payment alerts will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "group relative flex items-start gap-3 p-3 transition-colors cursor-pointer select-none",
                  item.read ? "bg-white hover:bg-[#FAF8F5]" : "bg-[#FAF6EE]/70 hover:bg-[#FAF6EE]"
                )}
              >
                {/* Category Icon */}
                {getCategoryIcon(item.category)}

                {/* Main Text Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={cn(
                        "text-xs truncate",
                        item.read ? "font-medium text-[#2B1E16]" : "font-semibold text-[#2B1E16]"
                      )}
                    >
                      {item.title}
                    </p>
                    {item.amount ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                        +{formatCurrency(item.amount)}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-[#6E5D4F] line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    {item.groupName && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[130px] font-medium text-[#8C6D46]">
                          {item.groupName}
                        </span>
                      </>
                    )}
                    {item.receiptNo && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[9px]">{item.receiptNo}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action: Read indicator or Delete Button */}
                <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                  {!item.read && (
                    <span className="size-2 rounded-full bg-[#E53935] shadow-xs" title="Unread" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(item.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-600 transition-opacity rounded mt-auto"
                    title="Remove notification"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#ECE5D8] bg-[#FAF8F5] px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOpen(false)
                navigate("/admin/contributions")
              }}
              className="text-[#8C6D46] hover:text-[#5F462B] font-medium flex items-center gap-0.5 hover:underline"
            >
              Contributions
              <ChevronRight className="size-3" />
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setOpen(false)
                navigate("/admin/payments")
              }}
              className="text-[#8C6D46] hover:text-[#5F462B] font-medium flex items-center gap-0.5 hover:underline"
            >
              Payments
              <ChevronRight className="size-3" />
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-muted-foreground hover:text-rose-600 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
