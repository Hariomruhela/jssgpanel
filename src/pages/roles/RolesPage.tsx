import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, ShieldCheck, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime, initials } from "@/lib/format"
import type { AdminUser, PermissionKey, Role } from "@/types"
import { getRoles, updateRolePermissions, getAdminUsers, createAdminUser, removeAdminUser } from "@/services/api/roles"

type RolePermissions = Record<PermissionKey, boolean>

export default function RolesPage() {
  const roles = useData(useCallback(() => getRoles(), []))
  const users = useData(useCallback(() => getAdminUsers(), []))
  const [selectedId, setSelectedId] = useState("role-super")
  const selected = (roles.data ?? []).find((r) => r.id === selectedId)

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Manage administrator roles and access levels" />

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Admin users ({users.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="pt-4">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-3">
              {(roles.data ?? []).map((r) => (
                <RoleCard
                  key={r.id}
                  role={r}
                  selected={r.id === selectedId}
                  onSelect={() => setSelectedId(r.id)}
                />
              ))}
            </div>
            <Card className="xl:col-span-2">
              {selected ? (
                <PermissionMatrix key={selected.id} role={selected} onChanged={() => roles.reload()} />
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">Select a role to view its permissions.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <AdminUsersTab roles={roles.data ?? []} onChanged={() => users.reload()} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RoleCard({ role, selected, onSelect }: { role: Role; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "hover:bg-muted/60"
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <ShieldCheck className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{role.name}</p>
          <StatusBadge status={role.type} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{role.description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{role.users} users</span>
    </button>
  )
}

const MODULES: { module: string; perms: [PermissionKey, string][] }[] = [
  { module: "Members", perms: [["members.view", "View member records"], ["members.manage", "Create & edit members"]] },
  { module: "Registrations", perms: [["registrations.approve", "Approve / reject registrations"]] },
  { module: "Post Holders", perms: [["postHolders.manage", "Manage post holders"]] },
  { module: "Groups", perms: [["groups.manage", "Create & edit social groups"]] },
  { module: "Locations", perms: [["locations.manage", "Manage city locations"]] },
  { module: "Community", perms: [["community.manage", "Manage community info"]] },
  { module: "Events", perms: [["events.manage", "Create & edit events"]] },
  { module: "News", perms: [["news.manage", "Publish news & announcements"]] },
  { module: "Notifications", perms: [["notifications.send", "Send push notifications"]] },
  { module: "Advertisements", perms: [["ads.approve", "Approve advertisements"]] },
  { module: "Administration", perms: [["roles.manage", "Manage roles & admins"], ["reports.view", "View reports & directory"]] },
  { module: "Finance", perms: [["fees.manage", "Configure annual fees"], ["payments.view", "View payments"], ["payments.refund", "Process refunds"]] },
]

function PermissionMatrix({ role, onChanged }: { role: Role; onChanged: () => void }) {
  const [local, setLocal] = useState<RolePermissions>(role.permissions)
  const [busy, setBusy] = useState(false)

  const toggle = async (key: PermissionKey) => {
    if (role.type === "System" && role.name === "Super Admin") return
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    setBusy(true)
    try {
      await updateRolePermissions(role.id, next)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const readOnly = role.type === "System" && role.name === "Super Admin"

  return (
    <div className={cn("gap-0", busy && "opacity-60 pointer-events-none")}>
      <CardHeader className="border-b">
        <CardTitle>Permission matrix — {role.name}</CardTitle>
        <CardDescription>
          {readOnly
            ? "Super Admin has full access and cannot be changed."
            : "Toggle module-level access for this role."}
        </CardDescription>
        <CardAction />
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {MODULES.map((mod) => (
          <div key={mod.module}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{mod.module}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {mod.perms.map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span className="text-sm">{label}</span>
                  <Checkbox
                    checked={Boolean(local[key])}
                    disabled={readOnly}
                    onCheckedChange={() => toggle(key)}
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </div>
  )
}

function AdminUsersTab({ roles, onChanged }: { roles: Role[]; onChanged: () => void }) {
  const users = useData(useCallback(() => getAdminUsers(), []))
  const roleMap = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r.name])), [roles])
  const [dialog, setDialog] = useState(false)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", roleId: "role-group", status: "active" as AdminUser["status"] })

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)
    try {
      await createAdminUser(form)
      toast.success(`${form.name} added`)
      setDialog(false)
      setForm({ name: "", email: "", roleId: "role-group", status: "active" })
      users.reload()
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await removeAdminUser(deleting.id)
    toast.success(`${deleting.name} removed`)
    users.reload()
    onChanged()
  }

  const columns: Column<AdminUser>[] = [
    {
      id: "user",
      header: "Admin user",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials(u.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { id: "role", header: "Role", cell: (u) => <Badge variant="secondary">{roleMap[u.roleId] ?? u.roleId}</Badge> },
    { id: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
    { id: "last", header: "Last login", cell: (u) => formatDateTime(u.lastLogin) },
    { id: "since", header: "Member since", cell: (u) => formatDate(u.memberSince) },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (u) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setDeleting(u)} aria-label="Remove">
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog(true)}>
          <Plus />
          Add Admin User
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={users.data ?? []}
        loading={users.loading}
        rowKey={(u) => u.id}
        searchKeys={(u) => `${u.name} ${u.email} ${roleMap[u.roleId] ?? ""}`}
        searchPlaceholder="Search admin users…"
        pageSize={6}
      />

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>Grant system access to a new administrator.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Full name" required>
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </FormField>
            <FormField label="Email" required>
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </FormField>
            <FormField label="Role">
              <Select value={form.roleId} onValueChange={(v) => setForm((s) => ({ ...s, roleId: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as AdminUser["status"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.email.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove admin user"
        description={`Revoke access for ${deleting?.name}?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}