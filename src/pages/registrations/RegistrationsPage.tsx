import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Check, Eye, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormField } from "@/components/FormField"
import { useData } from "@/lib/useData"
import { formatDate, initials } from "@/lib/format"
import type { Registration } from "@/types"
import { approveRegistration, getRegistrations, rejectRegistration } from "@/services/api/registrations"
import { getGroups } from "@/services/api/groups"

export default function RegistrationsPage() {
  const groups = useData(useCallback(() => getGroups(), []))
  const regs = useData(useCallback(() => getRegistrations(), []))
  const groupMap = useMemo(
    () => Object.fromEntries((groups.data ?? []).map((g) => [g.id, g.name])),
    [groups.data]
  )

  const [viewing, setViewing] = useState<Registration | null>(null)
  const [approving, setApproving] = useState<Registration | null>(null)
  const [rejecting, setRejecting] = useState<Registration | null>(null)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const all = regs.data ?? []
    return {
      pending: all.filter((r) => r.status === "pending").length,
      approved: all.filter((r) => r.status === "approved").length,
      rejected: all.filter((r) => r.status === "rejected").length,
    }
  }, [regs.data])

  const doApprove = async () => {
    if (!approving) return
    setBusy(true)
    try {
      await approveRegistration(approving.id, "Rohit Shah")
      toast.success(`${approving.name} approved`)
      regs.reload()
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejecting) return
    setBusy(true)
    try {
      await rejectRegistration(rejecting.id, "Rohit Shah", notes || "Application not approved.")
      toast.success(`${rejecting.name} rejected`)
      setNotes("")
      regs.reload()
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<Registration>[] = [
    {
      id: "applicant",
      header: "Applicant",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials(r.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.regNo}</p>
          </div>
        </div>
      ),
    },
    { id: "contact", header: "Contact", cell: (r) => `${r.phone} · ${r.email}` },
    { id: "group", header: "Applying to", cell: (r) => groupMap[r.groupId] ?? r.groupId },
    { id: "city", header: "City", cell: (r) => r.city },
    { id: "applied", header: "Applied on", cell: (r) => formatDate(r.appliedOn) },
    {
      id: "reviewed",
      header: "Reviewed by",
      cell: (r) =>
        r.status === "pending" ? <span className="text-xs text-muted-foreground">—</span> : (
          <div className="leading-tight">
            <p>{r.reviewedBy ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{r.reviewedOn ? formatDate(r.reviewedOn) : ""}</p>
          </div>
        ),
    },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => setViewing(r)} aria-label="View">
            <Eye />
          </Button>
          {r.status === "pending" && (
            <>
              <Button variant="ghost" size="icon-xs" className="text-emerald-600 hover:text-emerald-600" onClick={() => setApproving(r)} aria-label="Approve">
                <Check />
              </Button>
              <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => setRejecting(r)} aria-label="Reject">
                <X />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Approval"
        description="Review and approve new member registrations"
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="all">All ({counts.pending + counts.approved + counts.rejected})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="pt-4">
          <DataTable
            columns={columns.filter((c) => c.id !== "reviewed")}
            data={(regs.data ?? []).filter((r) => r.status === "pending")}
            loading={regs.loading}
            rowKey={(r) => r.id}
            searchKeys={(r) => `${r.name} ${r.regNo} ${r.email} ${r.phone} ${r.city}`}
            searchPlaceholder="Search applicants…"
            emptyTitle="All caught up"
            emptyDescription="No pending registrations right now."
          />
        </TabsContent>
        <TabsContent value="all" className="pt-4">
          <DataTable
            columns={columns}
            data={regs.data ?? []}
            loading={regs.loading}
            rowKey={(r) => r.id}
            searchKeys={(r) => `${r.name} ${r.regNo} ${r.email} ${r.phone} ${r.city}`}
            searchPlaceholder="Search applicants…"
            filters={[
              { key: "status", label: "Status", options: [
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]},
            ]}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>
              {viewing?.regNo} · applied {viewing ? formatDate(viewing.appliedOn) : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{viewing.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{viewing.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DOB</p>
                <p className="font-medium">{formatDate(viewing.dob)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{viewing.gender}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Group</p>
                <p className="font-medium">{groupMap[viewing.groupId]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-medium">{viewing.city}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Proposal</p>
                <p className="font-medium">{viewing.proposal}</p>
              </div>
              {viewing.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Review notes</p>
                  <p className="font-medium">{viewing.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve registration"
        description={`Approve ${approving?.name} as a member? A member record will be created automatically.`}
        confirmLabel="Approve"
        loading={busy}
        onConfirm={doApprove}
      />

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject registration</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {rejecting?.name}'s application.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Reason" required>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Incomplete verification documents." />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!notes.trim() || busy} onClick={doReject}>
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}