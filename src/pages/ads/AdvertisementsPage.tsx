import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Phone,
  Plus,
  Settings,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/DataTable"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useData } from "@/lib/useData"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/format"
import { API_BASE_URL, getErrorMessage } from "@/lib/apiClient"
import type { Advertisement } from "@/types"
import {
  approveAdvertisement,
  getAdvertisementCounts,
  getAdvertisements,
  removeAd,
  updateAdvertisement,
} from "@/services/api/ads"
import { getGroupOptions, type GroupOption } from "@/services/api/groups"
import { isSuperAdminRole } from "@/services/api/session"
import { AdvertisementFormDialog } from "./AdvertisementFormDialog"
import { AdvertisementPricingSettingsDialog } from "./AdvertisementPricingSettingsDialog"

const PAGE_SIZE = 20

function resolveImageUrl(url?: string | null): string {
  if (!url) return ""
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url
  }
  const root = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  return `${root}${url.startsWith("/") ? "" : "/"}${url}`
}

function getEffectiveStatus(ad: Advertisement): string {
  if (ad.status?.toUpperCase() === "PENDING") return "pending"
  if (ad.status?.toUpperCase() === "REJECTED") return "rejected"
  if (ad.end_date) {
    const end = new Date(ad.end_date)
    if (!isNaN(end.getTime()) && end < new Date()) {
      return "expired"
    }
  }
  if (!ad.is_active) return "inactive"
  return "active"
}

interface SummaryMiniProps {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: string
}

function SummaryMini({ icon, label, value, tone }: SummaryMiniProps) {
  return (
    <Card className="overflow-hidden border-border/80">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdvertisementsPage() {
  const { user } = useAuth()
  const canManagePricing = isSuperAdminRole(user)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [version, setVersion] = useState(0)

  // Dialog states
  const [dialog, setDialog] = useState<{ open: boolean; editing: Advertisement | null }>({
    open: false,
    editing: null,
  })
  const [deleting, setDeleting] = useState<Advertisement | null>(null)
  const [imagePreviewAd, setImagePreviewAd] = useState<Advertisement | null>(null)
  const [previewTab, setPreviewTab] = useState<"cover" | "large">("cover")
  const [pricingOpen, setPricingOpen] = useState(false)

  const refresh = () => setVersion((v) => v + 1)

  // Search input debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setQuery(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch groups for filter
  const groups = useData(useCallback(() => getGroupOptions().catch(() => [] as GroupOption[]), []), version)

  // Fetch advertisements
  const adsData = useData(
    useCallback(
      () =>
        getAdvertisements({
          page,
          page_size: PAGE_SIZE,
          group_id: selectedGroup || undefined,
          status: selectedStatus || undefined,
        }),
      [page, selectedGroup, selectedStatus]
    ),
    version
  )

  // Fetch summary counts
  const counts = useData(useCallback(() => getAdvertisementCounts(), []), version)

  // Quick Approve
  const handleApprove = async (ad: Advertisement) => {
    try {
      await approveAdvertisement(ad.id, true)
      toast.success(`"${ad.title}" approved!`)
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not approve advertisement."))
    }
  }

  // Quick Active toggle
  const handleToggleActive = async (ad: Advertisement) => {
    try {
      await updateAdvertisement(ad.id, { is_active: !ad.is_active })
      toast.success(ad.is_active ? `"${ad.title}" deactivated.` : `"${ad.title}" activated!`)
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update status."))
    }
  }

  // Delete advertisement
  const confirmDelete = async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    try {
      await removeAd(target.id)
      toast.success("Advertisement removed")
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete the advertisement."))
    }
  }

  const openCreate = () => setDialog({ open: true, editing: null })
  const openEdit = (ad: Advertisement) => setDialog({ open: true, editing: ad })

  // Client-side search fallback if server query filter is partial
  const displayedItems = useMemo(() => {
    const items = adsData.data?.items ?? []
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.person_name?.toLowerCase().includes(q) ||
        a.personName?.toLowerCase().includes(q) ||
        a.mobile_number?.includes(q) ||
        a.group_name?.toLowerCase().includes(q)
    )
  }, [adsData.data?.items, query])

  // Table Columns matching other management pages
  const columns: Column<Advertisement>[] = [
    {
      id: "ad",
      header: "Advertisement",
      className: "whitespace-normal",
      cell: (a) => {
        const coverSrc = resolveImageUrl(a.cover_image_url || a.coverImageUrl)
        return (
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => {
                setImagePreviewAd(a)
                setPreviewTab("cover")
              }}
              className="group relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted cursor-pointer transition-transform hover:scale-105"
              title="Click to view full preview"
            >
              {coverSrc ? (
                <img src={coverSrc} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-4 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0 max-w-72 leading-tight">
              <p className="break-words font-medium text-foreground">{a.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="truncate text-xs text-muted-foreground font-mono">
                  {a.placement || "HOME_BANNER"}
                </span>
                {a.subscription_months && (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                    {a.subscription_months} mo
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: "postBy",
      header: "Post By",
      cell: (a) => (
        <div className="flex max-w-48 items-center gap-1.5">
          <Users className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-xs">{a.group_name || a.postBy || "General"}</span>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact Person",
      cell: (a) => {
        const phone = a.mobile_number || a.mobileNumber
        return (
          <div className="flex max-w-48 items-center gap-1.5">
            <User className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium">{a.person_name || a.personName || "—"}</p>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="truncate text-[11px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1"
                >
                  <Phone className="size-2.5" /> {phone}
                </a>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "dates",
      header: "Campaign Dates",
      cell: (a) => {
        const s = a.start_date || a.startDate || ""
        const e = a.end_date || a.endDate || ""
        return (
          <div className="leading-tight text-xs">
            <p className="font-medium">{formatDate(s)}</p>
            <p className="text-[11px] text-muted-foreground">to {formatDate(e)}</p>
          </div>
        )
      },
    },
    {
      id: "amount",
      header: "Amount",
      cell: (a) => {
        const val = Number(a.amount ?? a.spend ?? 0)
        return (
          <span className="text-xs font-semibold">
            {val > 0 ? formatCurrency(val) : "Waived"}
          </span>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (a) => <StatusBadge status={getEffectiveStatus(a)} />,
    },
    {
      id: "actions",
      header: "",
      headClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end items-center gap-1">
          {a.status?.toUpperCase() === "PENDING" ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleApprove(a)}
              title="Approve Advertisement"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <Check className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleToggleActive(a)}
              title={a.is_active ? "Deactivate" : "Activate"}
              className={a.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground"}
            >
              {a.is_active ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => openEdit(a)}
            aria-label="Edit"
          >
            <Pencil className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(a)}
            aria-label="Delete"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Advertisement Management"
        description="Create and manage advertisement campaigns, group banners, and sponsorships."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManagePricing && (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setPricingOpen(true)}
              >
                <Settings className="size-4" />
                Settings
              </Button>
            )}
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="size-4" />
              Subscribe Advertisement
            </Button>
          </div>
        }
      />

      {/* Summary Mini Cards Row matching other management pages */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryMini
          icon={<Megaphone className="size-4" />}
          label="Total ads"
          value={counts.data ? counts.data.total : "…"}
          tone="text-primary bg-primary/10"
        />
        <SummaryMini
          icon={<CheckCircle2 className="size-4" />}
          label="Active / Approved"
          value={counts.data ? counts.data.active : "…"}
          tone="text-emerald-600 bg-emerald-500/10"
        />
        <SummaryMini
          icon={<Clock className="size-4" />}
          label="Pending"
          value={counts.data ? counts.data.pending : "…"}
          tone="text-amber-600 bg-amber-500/10"
        />
        <SummaryMini
          icon={<Calendar className="size-4" />}
          label="Expired"
          value={counts.data ? counts.data.expired : "…"}
          tone="text-muted-foreground bg-muted"
        />
      </div>

      {/* Standard DataTable matching other pages */}
      <DataTable
        columns={columns}
        data={displayedItems}
        loading={adsData.loading}
        rowKey={(a) => a.id}
        searchPlaceholder="Search advertisements…"
        filters={[
          {
            key: "group_id",
            label: "Group",
            options: (groups.data ?? []).map((g) => ({ label: g.name, value: g.id })),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Approved / Active", value: "APPROVED" },
              { label: "Pending", value: "PENDING" },
              { label: "Rejected", value: "REJECTED" },
            ],
          },
        ]}
        pageSize={PAGE_SIZE}
        currentPage={page}
        total={adsData.data?.total}
        onPageChange={setPage}
        onSearchChange={setSearchInput}
        onFilterChange={(key, value) => {
          setPage(1)
          if (key === "group_id") setSelectedGroup(value === "all" ? "" : value)
          if (key === "status") setSelectedStatus(value === "all" ? "" : value)
        }}
      />

      {/* Standard Form Dialog for Add / Edit */}
      <AdvertisementFormDialog
        open={dialog.open}
        editing={dialog.editing}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSaved={refresh}
      />

      {canManagePricing && (
        <AdvertisementPricingSettingsDialog
          open={pricingOpen}
          onOpenChange={setPricingOpen}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={Boolean(imagePreviewAd)}
        onOpenChange={(open) => {
          if (!open) setImagePreviewAd(null)
        }}
      >
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{imagePreviewAd?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preview cover and large banner assets for this advertisement.
            </DialogDescription>
          </DialogHeader>

          {imagePreviewAd && (
            <Tabs
              value={previewTab}
              onValueChange={(val) => setPreviewTab(val as "cover" | "large")}
              className="mt-2"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="cover">Cover Image (1200 × 628)</TabsTrigger>
                <TabsTrigger value="large">Large Image (1200 × 1800)</TabsTrigger>
              </TabsList>

              <TabsContent value="cover">
                <div className="rounded-lg border bg-muted/20 p-2 flex items-center justify-center min-h-[240px] max-h-[420px] overflow-hidden">
                  {imagePreviewAd.cover_image_url || imagePreviewAd.coverImageUrl ? (
                    <img
                      src={resolveImageUrl(imagePreviewAd.cover_image_url || imagePreviewAd.coverImageUrl)}
                      alt="Cover preview"
                      className="max-h-[400px] max-w-full rounded object-contain shadow-xs"
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <ImageIcon className="size-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No cover image uploaded.</p>
                    </div>
                  )}
                </div>
                {(imagePreviewAd.cover_image_url || imagePreviewAd.coverImageUrl) && (
                  <div className="mt-2 flex justify-end">
                    <a
                      href={resolveImageUrl(imagePreviewAd.cover_image_url || imagePreviewAd.coverImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="size-3.5" /> Open original
                    </a>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="large">
                <div className="rounded-lg border bg-muted/20 p-2 flex items-center justify-center min-h-[260px] max-h-[440px] overflow-hidden">
                  {imagePreviewAd.large_image_url || imagePreviewAd.largeImageUrl ? (
                    <img
                      src={resolveImageUrl(imagePreviewAd.large_image_url || imagePreviewAd.largeImageUrl)}
                      alt="Large image preview"
                      className="max-h-[420px] max-w-full rounded object-contain shadow-xs"
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <ImageIcon className="size-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No large image uploaded.</p>
                    </div>
                  )}
                </div>
                {(imagePreviewAd.large_image_url || imagePreviewAd.largeImageUrl) && (
                  <div className="mt-2 flex justify-end">
                    <a
                      href={resolveImageUrl(imagePreviewAd.large_image_url || imagePreviewAd.largeImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="size-3.5" /> Open original
                    </a>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImagePreviewAd(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standard ConfirmDialog matching EventsPage / JainTirthsPage */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Delete Advertisement"
        description={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Advertisement"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
