import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Bell, CheckCheck, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { formatDate, safePercent } from "@/lib/format"
import type { Notification } from "@/types"
import { getNotifications, removeNotification, sendNotification, type NotificationInput } from "@/services/api/notifications"
import { getGroups } from "@/services/api/groups"

const NOTIFICATION_TYPES = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "emergency", label: "Emergency" },
] as const

export default function NotificationsPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const notifications = useData(useCallback(() => getNotifications(), []))

  const [deleting, setDeleting] = useState<Notification | null>(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState<NotificationInput>({
    title: "",
    message: "",
    type: "info",
    audience: "All Groups",
    groups: [],
    status: "sent",
  })

  const toggleGroup = (id: string) => {
    setForm((s) => ({
      ...s,
      groups: s.groups.includes(id) ? s.groups.filter((g) => g !== id) : [...s.groups, id],
    }))
  }

  const clearGroups = () => setForm((s) => ({ ...s, groups: [] }))
  const selectAllGroups = () => setForm((s) => ({ ...s, groups: (groups.data ?? []).map((g) => g.id) }))

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    setSending(true)
    try {
      await sendNotification(form, "Rohit Shah")
      toast.success("Notification sent")
      setForm({ title: "", message: "", type: "info", audience: "All Groups", groups: [], status: "sent" })
      notifications.reload()
    } finally {
      setSending(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await removeNotification(deleting.id)
    toast.success("Notification removed")
  }

  const columns: Column<Notification>[] = [
    {
      id: "message",
      header: "Notification",
      cell: (n) => (
        <div className="max-w-96">
          <p className="truncate font-medium">{n.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
        </div>
      ),
    },
    { id: "type", header: "Type", cell: (n) => <StatusBadge status={n.type} /> },
    { id: "audience", header: "Audience", cell: (n) => n.audience },
    { id: "sentBy", header: "Sent by", cell: (n) => n.sentBy },
    { id: "sentOn", header: "Sent on", cell: (n) => formatDate(n.sentOn) },
    {
      id: "delivery",
      header: "Delivery",
      cell: (n) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {n.delivered.toLocaleString()} sent
            </span>
            <span className="flex items-center gap-1 font-medium">
              <CheckCheck className="size-3" />
              {safePercent(n.opened, n.delivered)}%
            </span>
          </div>
          <Progress value={safePercent(n.delivered, n.delivered || 1)} className="mt-1 h-1.5" />
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (n) => <StatusBadge status={n.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (n) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(n)} aria-label="Delete">
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Compose and send push notifications to community members"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-4" />
              Compose Notification
            </CardTitle>
            <CardDescription>Send a push notification to selected groups or the whole community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="e.g. Paryushan Mahaparva begins"
              />
            </FormField>
            <FormField label="Message" required>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                rows={4}
                placeholder="Notification body…"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type">
                <Select value={form.type} onValueChange={(v) => setForm((s) => ({ ...s, type: v as Notification["type"] }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Audience">
                <Select
                  value={form.groups.length === 0 ? "all" : "selected"}
                  onValueChange={(v) => {
                    if (v === "all") clearGroups()
                    else selectAllGroups()
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    <SelectItem value="selected">Selected groups</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {form.groups.length === 0
                    ? "All groups"
                    : `${form.groups.length} group${form.groups.length > 1 ? "s" : ""} selected`}
                  <Bell className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
                <DropdownMenuLabel>Select groups</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); clearGroups() }}>
                  All groups
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(groups.data ?? []).map((g) => (
                  <DropdownMenuItem key={g.id} onSelect={(e) => { e.preventDefault(); toggleGroup(g.id) }}>
                    <span className="flex flex-1 items-center gap-2">
                      <Checkbox checked={form.groups.includes(g.id)} className="data-[state=checked]:bg-primary" />
                      {g.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="w-full" onClick={send} disabled={sending || !form.title.trim() || !form.message.trim()}>
              <Send />
              {sending ? "Sending…" : "Send now"}
            </Button>
          </CardContent>
        </Card>

        <div className="xl:col-span-2">
          <DataTable
            columns={columns}
            data={notifications.data ?? []}
            loading={notifications.loading}
            rowKey={(n) => n.id}
            searchKeys={(n) => `${n.title} ${n.message} ${n.audience} ${n.sentBy}`}
            searchPlaceholder="Search sent notifications…"
            pageSize={6}
            emptyTitle="No notifications sent yet"
            emptyDescription="Use the composer to send your first notification."
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete notification"
        description={`Remove "${deleting?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}