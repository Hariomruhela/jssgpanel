import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { PhotoCropDialog } from "@/components/PhotoCropDialog"
import { useAuth } from "@/lib/auth"
import { API_BASE_URL, getErrorMessage } from "@/lib/apiClient"
import type { Advertisement, SubscriptionDurationOption } from "@/types"
import {
  getSubscriptionDurations,
  submitAdvertisementWithFiles,
  updateAdvertisement,
  uploadAdvertisementCoverImage,
  uploadAdvertisementLargeImage,
} from "@/services/api/ads"
import { getGroupOptions, type GroupOption } from "@/services/api/groups"
import { isGroupAdminRole } from "@/services/api/session"
import { SubscriptionPlanSelector } from "./SubscriptionPlanSelector"

interface AdvertisementFormDialogProps {
  open: boolean
  editing: Advertisement | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

const COVER_IMAGE_WIDTH = 1200
const COVER_IMAGE_HEIGHT = 628
const COVER_IMAGE_ASPECT = COVER_IMAGE_WIDTH / COVER_IMAGE_HEIGHT

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

interface ImageUploadItem {
  file: File | null
  preview: string | null
  fileName?: string
}

export function AdvertisementFormDialog({
  open,
  editing,
  onOpenChange,
  onSaved,
}: AdvertisementFormDialogProps) {
  const { user } = useAuth()
  const groupLocked = isGroupAdminRole(user)

  // Form states
  const [title, setTitle] = useState("")
  const [groupId, setGroupId] = useState("")
  const [personName, setPersonName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [subscriptionMonths, setSubscriptionMonths] = useState(2)

  // Options
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([])
  const [durations, setDurations] = useState<SubscriptionDurationOption[]>([])

  // Images
  const [coverImage, setCoverImage] = useState<ImageUploadItem>({ file: null, preview: null })
  const [coverCropFile, setCoverCropFile] = useState<File | null>(null)
  const [largeImage, setLargeImage] = useState<ImageUploadItem>({ file: null, preview: null })

  const coverInputRef = useRef<HTMLInputElement>(null)
  const largeInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)

  // Fetch groups
  const loadGroups = useCallback(async () => {
    try {
      const opts = await getGroupOptions()
      if (opts && opts.length > 0) {
        setGroupOptions(opts)
        return opts
      }
    } catch {
      // fallback
    }
    return []
  }, [])

  useEffect(() => {
    loadGroups()
    getSubscriptionDurations()
      .then(setDurations)
      .catch(() => toast.error("Could not load subscription plans. Please try again."))
  }, [loadGroups])

  // Populate form on open/editing
  useEffect(() => {
    if (!open) return
    setCoverCropFile(null)

    loadGroups().then((opts) => {
      if (editing) {
        setTitle(editing.title || "")
        setGroupId(editing.group_id || (opts[0]?.id ?? ""))
        setPersonName(editing.person_name || editing.personName || "")
        setMobileNumber(editing.mobile_number || editing.mobileNumber || "")
        const sDate = editing.start_date?.slice(0, 10) || editing.startDate?.slice(0, 10) || todayIso()
        const eDate = editing.end_date?.slice(0, 10) || editing.endDate?.slice(0, 10) || todayIso()
        setStartDate(sDate)
        setEndDate(eDate)
        setSubscriptionMonths(editing.subscription_months || 2)
        setCoverImage({
          file: null,
          preview: resolveImageUrl(editing.cover_image_url || editing.coverImageUrl) || null,
        })
        setLargeImage({
          file: null,
          preview: resolveImageUrl(editing.large_image_url || editing.largeImageUrl) || null,
        })
      } else {
        setTitle("")
        const defaultGid = user?.group_id || opts[0]?.id || ""
        setGroupId(defaultGid)
        setPersonName(user?.full_name ?? "")
        setMobileNumber(user?.phone_number ? user.phone_number.replace(/\D/g, "").slice(-10) : "")
        setStartDate(todayIso())
        setEndDate(todayIso())
        setSubscriptionMonths(2)
        setCoverImage({ file: null, preview: null })
        setLargeImage({ file: null, preview: null })
      }
    })
  }, [open, editing, user, loadGroups])

  const handleStartDateChange = (val: string) => {
    setStartDate(val)
  }

  const handleDurationChange = (months: number) => {
    setSubscriptionMonths(months)
  }

  const snapshotPlan: SubscriptionDurationOption | null =
    editing && editing.subscription_months
      ? {
          months: editing.subscription_months,
          label: `${editing.subscription_months} Month Subscription`,
          description: "Purchased plan — pricing is locked for this advertisement.",
          price: Number(editing.amount ?? editing.spend ?? 0),
          currency: editing.currency || "INR",
          is_default: false,
        }
      : null
  const planOptions = durations.length > 0 ? durations : snapshotPlan ? [snapshotPlan] : []
  const selectedPlan =
    planOptions.find((plan) => plan.months === subscriptionMonths) ??
    durations.find((plan) => plan.is_default) ??
    planOptions[0] ??
    null

  // Cover image select
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Please upload JPG or PNG for Cover Image.")
      return
    }
    setCoverCropFile(file)
  }

  const handleCoverCropped = (file: File) => {
    setCoverImage({
      file,
      preview: URL.createObjectURL(file),
      fileName: file.name,
    })
  }

  // Large image select
  const handleLargeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Please upload JPG or PNG for Large Image.")
      return
    }
    setLargeImage({
      file,
      preview: URL.createObjectURL(file),
      fileName: file.name,
    })
  }

  const validate = (): string | null => {
    if (!title.trim()) return "Advertise title is required."
    if (!groupId) return "Please select a group."
    if (!startDate) return "Start date is required."
    if (!endDate) return "End date is required."
    if (new Date(startDate) > new Date(endDate)) return "End date must be on or after start date."
    if (!personName.trim()) return "Contact person name is required."
    const cleanPhone = mobileNumber.replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length !== 10) return "Please enter a valid 10-digit mobile number."
    if (!editing && !selectedPlan) {
      return "Subscription plans are unavailable. Please refresh and try again."
    }
    if (!editing && !coverImage.file) return "Please upload a Cover Image."
    if (!editing && !largeImage.file) return "Please upload a Large Image."
    return null
  }

  const handleSave = async () => {
    const errorMsg = validate()
    if (errorMsg) {
      toast.error(errorMsg)
      return
    }

    setSaving(true)
    try {
      const cleanPhone = mobileNumber.replace(/\D/g, "")

      if (editing) {
        // Subscription price/duration are a purchase snapshot and must never be
        // rewritten by an edit; the API rejects tampering as well.
        await updateAdvertisement(editing.id, {
          title: title.trim(),
          group_id: groupId || null,
          person_name: personName.trim(),
          mobile_number: cleanPhone,
          start_date: startDate,
          end_date: endDate,
        })

        if (coverImage.file) {
          await uploadAdvertisementCoverImage(editing.id, coverImage.file)
        }
        if (largeImage.file) {
          await uploadAdvertisementLargeImage(editing.id, largeImage.file)
        }

        toast.success("Advertisement updated successfully")
      } else {
        // Create new ad with images
        await submitAdvertisementWithFiles({
          title: title.trim(),
          groupId: groupId || null,
          startDate,
          endDate,
          personName: personName.trim(),
          mobileNumber: cleanPhone,
          subscriptionMonths,
          amount: selectedPlan ? Number(selectedPlan.price) : null,
          coverImage: coverImage.file,
          largeImage: largeImage.file,
        })

        toast.success("Advertisement created successfully")
      }

      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save advertisement."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Advertisement" : "Subscribe Advertisement"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update campaign details, dates, or banner media assets. The purchased subscription plan and amount stay locked."
              : "Choose a subscription plan, then fill in the campaign details below."}
          </DialogDescription>
        </DialogHeader>

        {/* Plan prices are shown in the cards; the selected amount is submitted
            for payment processing but is no longer a separate editable field. */}
        <div className="pt-1">
          <FormField
            label="Subscription Plan"
            required
            hint={
              editing
                ? "Purchased duration is locked."
                : "Expiry is calculated and stored separately by the server."
            }
          >
            <SubscriptionPlanSelector
              plans={planOptions}
              value={subscriptionMonths}
              onChange={handleDurationChange}
              disabled={Boolean(editing)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Title */}
          <FormField label="Advertise Title" required className="sm:col-span-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shop Offer, Business Promotion, Event"
            />
          </FormField>

          {/* Group dropdown */}
          <FormField
            label="Post By (Group)"
            required
            hint={groupLocked ? "Your group is selected automatically." : undefined}
          >
            <Select value={groupId} onValueChange={setGroupId} disabled={groupLocked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {groupOptions.length > 0 ? (
                  groupOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Loading groups...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormField>

          {/* Mobile Number */}
          <FormField label="Mobile Number" required>
            <Input
              type="tel"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
              className="font-mono"
            />
          </FormField>

          {/* Start Date */}
          <FormField label="Start Date" required>
            <DateInput value={startDate} onChange={handleStartDateChange} />
          </FormField>

          {/* End Date */}
          <FormField
            label="End Date"
            required
            hint={editing ? "Advertisement end date is preserved." : "Choose the advertisement end date."}
          >
            <DateInput value={endDate} onChange={setEndDate} />
          </FormField>

          {/* Contact Person Name */}
          <FormField label="Contact Person" required>
            <Input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter your name"
            />
          </FormField>

        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Cover Image Upload */}
          <FormField
            label="Cover Image"
            required={!editing}
            hint="Auto-cropped to 1200 × 628 px"
            className="min-w-0"
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleCoverSelect}
              className="hidden"
            />
            {coverImage.preview ? (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <img
                    src={coverImage.preview}
                    alt="Cover preview"
                    className="size-12 shrink-0 rounded-md border bg-background object-cover sm:size-14"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{coverImage.fileName || "Cover Image"}</p>
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="size-3" /> Ready
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:gap-2 sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    className="h-8 text-xs"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setCoverImage({ file: null, preview: null })}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="cursor-pointer rounded-lg border border-dashed p-3 text-center transition-colors hover:bg-muted/30 sm:p-5"
              >
                <ImageIcon className="size-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Click to upload Cover Image</p>
                <p className="text-[11px] text-muted-foreground">1200 × 628 px · Auto-crop</p>
              </div>
            )}
          </FormField>

          {/* Large Image Upload */}
          <FormField
            label="Large Image"
            required={!editing}
            hint="1200 × 1800 px"
            className="min-w-0"
          >
            <input
              ref={largeInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleLargeSelect}
              className="hidden"
            />
            {largeImage.preview ? (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <img
                    src={largeImage.preview}
                    alt="Large preview"
                    className="size-12 shrink-0 rounded-md border bg-background object-cover sm:size-14"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{largeImage.fileName || "Large Banner Image"}</p>
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="size-3" /> Ready
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:gap-2 sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => largeInputRef.current?.click()}
                    className="h-8 text-xs"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setLargeImage({ file: null, preview: null })}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => largeInputRef.current?.click()}
                className="cursor-pointer rounded-lg border border-dashed p-3 text-center transition-colors hover:bg-muted/30 sm:p-5"
              >
                <ImageIcon className="size-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Click to upload Large Banner Image</p>
                <p className="text-[11px] text-muted-foreground">1200 × 1800 px</p>
              </div>
            )}
          </FormField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {editing ? "Save Changes" : "Subscribe & Publish"}
          </Button>
        </DialogFooter>

        <PhotoCropDialog
          open={coverCropFile !== null}
          file={coverCropFile}
          title="Crop cover image"
          aspect={COVER_IMAGE_ASPECT}
          outputWidth={COVER_IMAGE_WIDTH}
          outputHeight={COVER_IMAGE_HEIGHT}
          onOpenChange={(open) => !open && setCoverCropFile(null)}
          onCropped={handleCoverCropped}
        />
      </DialogContent>
    </Dialog>
  )
}
