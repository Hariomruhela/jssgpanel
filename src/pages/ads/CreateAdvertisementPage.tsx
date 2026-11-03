import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import { useAuth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/apiClient"
import type { SubscriptionDurationOption } from "@/types"
import {
  getSubscriptionDurations,
  submitAdvertisementWithFiles,
} from "@/services/api/ads"
import { getGroupOptions, type GroupOption } from "@/services/api/groups"
import { isGroupAdminRole } from "@/services/api/session"
import { SubscriptionPlanSelector } from "./SubscriptionPlanSelector"

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

interface ImageUploadItem {
  file: File | null
  preview: string | null
  fileName?: string
}

export default function CreateAdvertisementPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const groupLocked = isGroupAdminRole(user)

  // Form states
  const [title, setTitle] = useState("")
  const [groupId, setGroupId] = useState(user?.group_id || "")
  const [personName, setPersonName] = useState(user?.full_name ?? "")
  const [mobileNumber, setMobileNumber] = useState(
    user?.phone_number ? user.phone_number.replace(/\D/g, "").slice(-10) : ""
  )
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [subscriptionMonths, setSubscriptionMonths] = useState(2)

  // Options
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([])
  const [durations, setDurations] = useState<SubscriptionDurationOption[]>([])

  // Images
  const [coverImage, setCoverImage] = useState<ImageUploadItem>({ file: null, preview: null })
  const [largeImage, setLargeImage] = useState<ImageUploadItem>({ file: null, preview: null })

  const coverInputRef = useRef<HTMLInputElement>(null)
  const largeInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)

  // Load groups reliably
  const loadGroups = useCallback(async () => {
    try {
      const opts = await getGroupOptions()
      if (opts && opts.length > 0) {
        setGroupOptions(opts)
        if (!groupId) {
          setGroupId(user?.group_id || opts[0].id)
        }
        return opts
      }
    } catch {
      // fallback
    }
    return []
  }, [groupId, user?.group_id])

  useEffect(() => {
    loadGroups()
    getSubscriptionDurations()
      .then(setDurations)
      .catch(() => toast.error("Could not load subscription plans. Please try again."))
  }, [loadGroups])

  const handleStartDateChange = (val: string) => {
    setStartDate(val)
  }

  const handleDurationChange = (months: number) => {
    setSubscriptionMonths(months)
  }

  const selectedPlan =
    durations.find((plan) => plan.months === subscriptionMonths) ??
    durations.find((plan) => plan.is_default) ??
    durations[0] ??
    null

  // Cover image select
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG file for Cover Image.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Cover image exceeds 2MB limit.")
      return
    }
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
      toast.error("Please upload a JPG or PNG file for Large Image.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Large image exceeds 5MB limit.")
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
    if (!selectedPlan) return "Subscription plans are unavailable. Please refresh and try again."
    if (!coverImage.file) return "Please upload a Cover Image (Max 2MB)."
    if (!largeImage.file) return "Please upload a Large Image (Max 5MB)."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errorMsg = validate()
    if (errorMsg) {
      toast.error(errorMsg)
      return
    }

    setSubmitting(true)
    try {
      const cleanPhone = mobileNumber.replace(/\D/g, "")

      await submitAdvertisementWithFiles({
        title: title.trim(),
        groupId: groupId || null,
        startDate,
        endDate,
        personName: personName.trim(),
        mobileNumber: cleanPhone,
        subscriptionMonths: selectedPlan?.months ?? subscriptionMonths,
        amount: selectedPlan ? Number(selectedPlan.price) : null,
        coverImage: coverImage.file,
        largeImage: largeImage.file,
      })

      toast.success("Advertisement created successfully!")
      navigate("/admin/advertisements")
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create advertisement."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => navigate("/admin/advertisements")}
          aria-label="Back to advertisements"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Subscribe Advertisement</h1>
          <p className="text-xs text-muted-foreground">
            Choose a subscription plan and publish an advertisement on the JSSG app.
          </p>
        </div>
      </div>

      {/* Main Card Form */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Information</CardTitle>
          <CardDescription>
            Enter details and banner media for this advertisement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              label="Subscription Plan"
              required
              hint="Expiry is calculated and stored separately by the server."
            >
              <SubscriptionPlanSelector
                plans={durations}
                value={subscriptionMonths}
                onChange={handleDurationChange}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Title */}
              <FormField label="Advertise Title" required className="sm:col-span-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shop Offer, Business Promotion, Event"
                />
              </FormField>

              {/* Group */}
              <FormField
                label="Post By (Group)"
                required
                hint={groupLocked ? "Your group is selected automatically." : undefined}
              >
                <Select value={groupId} onValueChange={setGroupId} disabled={groupLocked}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
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

              {/* Start Date */}
              <FormField label="Start Date" required>
                <DateInput value={startDate} onChange={handleStartDateChange} />
              </FormField>

              {/* End Date */}
              <FormField
                label="End Date"
                required
                hint="Choose the advertisement end date."
              >
                <DateInput value={endDate} onChange={setEndDate} />
              </FormField>

              {/* Person Name */}
              <FormField label="Contact Person" required>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter your name"
                />
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

            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cover Image Upload */}
              <FormField
                label="Cover Image"
                required
                hint="Recommended: 1200 × 628 px, Max 2MB (JPG, PNG)"
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
                          <CheckCircle2 className="size-3" /> Ready to upload
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
                    <p className="text-[11px] text-muted-foreground">1200 × 628 px · Max 2MB</p>
                  </div>
                )}
              </FormField>

              {/* Large Image Upload */}
              <FormField
                label="Large Image"
                required
                hint="Recommended: 1200 × 1800 px, Max 5MB (JPG, PNG)"
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
                          <CheckCircle2 className="size-3" /> Ready to upload
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
                    <p className="text-[11px] text-muted-foreground">1200 × 1800 px · Max 5MB</p>
                  </div>
                )}
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => navigate("/admin/advertisements")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Subscribe & Publish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
