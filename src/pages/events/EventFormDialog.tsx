import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react"
import { ApiError } from "@/lib/apiClient"
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
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import type { EventImageRecord, EventRecord, EventTypeOption } from "@/types"
import {
  MAX_EVENT_IMAGES,
  MAX_EVENT_IMAGE_BYTES,
  addMinutes,
  createEvent,
  endTimeOf,
  fromApiDate,
  fromStartsAt,
  getEvent,
  removeEventCover,
  removeEventImage,
  toApiDate,
  toEndsAt,
  toStartsAt,
  updateEvent,
  uploadEventCover,
  uploadEventImages,
} from "@/services/api/events"

interface EventFormDialogProps {
  open: boolean
  /** The event being edited; `null` while creating a new one. */
  editing: EventRecord | null
  /** The event types the backend offers, for the select. */
  eventTypes: EventTypeOption[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

interface FormState {
  title: string
  /** ISO `yyyy-mm-dd`; the API is sent `dd/mm/yyyy`. */
  eventDate: string
  /** 24-hour `HH:MM` — when the event starts. */
  startTime: string
  /** 24-hour `HH:MM` — when the event ends. */
  endTime: string
  venueName: string
  description: string
  eventType: string
  /** The free-text label that goes with the `OTHER` type. */
  eventTypeOther: string
  hostName: string
  hostContact: string
}

/** A picked file together with the object URL showing it. */
interface PickedImage {
  file: File
  preview: string
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function emptyForm(): FormState {
  return {
    title: "",
    eventDate: todayIso(),
    startTime: "10:00",
    endTime: "12:00",
    venueName: "",
    description: "",
    eventType: "",
    eventTypeOther: "",
    hostName: "",
    hostContact: "",
  }
}

function errorMessage(error: unknown, fallback: string): { message: string; description?: string } {
  if (error instanceof ApiError) return { message: error.message, description: error.detail ?? undefined }
  return { message: error instanceof Error ? error.message : fallback }
}

/** The API accepts 7 to 15 digits, with the usual separators left out. */
function isValidPhone(value: string): boolean {
  if (!value.trim()) return true
  return /^\+?[0-9]{7,15}$/.test(value.replace(/[\s\-()]+/g, ""))
}

export function EventFormDialog({ open, editing, eventTypes, onOpenChange, onSaved }: EventFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // The cover image: the picked file, its preview and the URL already stored.
  const [coverFile, setCoverFile] = useState<PickedImage | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  // The gallery: the images already on the event and the newly picked ones.
  const [images, setImages] = useState<EventImageRecord[]>([])
  const [picked, setPicked] = useState<PickedImage[]>([])

  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Every object URL still in use, so none of them leaks when the dialog goes.
  const previewsRef = useRef<string[]>([])
  const trackPreview = useCallback((url: string) => {
    previewsRef.current.push(url)
    return url
  }, [])
  const releasePreview = useCallback((url: string) => {
    previewsRef.current = previewsRef.current.filter((current) => current !== url)
    URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url))
      previewsRef.current = []
    }
  }, [])

  const usedSlots = images.length + picked.length
  const slotsLeft = Math.max(0, MAX_EVENT_IMAGES - usedSlots)

  const change = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }))
  }, [])

  // Load the event and its gallery whenever the dialog opens for an edit.
  useEffect(() => {
    if (!open) return
    // The previews of the last round are of no use any more.
    previewsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewsRef.current = []
    setPicked([])
    setCoverFile(null)
    if (!editing) {
      setForm(emptyForm())
      setImages([])
      setCoverUrl(null)
      return
    }
    setLoading(true)
    getEvent(editing.id)
      .then((detail) => {
        // An API that only knows the instant still gives the date and time.
        const wallClock = fromStartsAt(detail.starts_at)
        const startTime = detail.event_time ?? wallClock.time ?? "10:00"
        setForm({
          title: detail.title,
          eventDate:
            fromApiDate(detail.event_date) || fromApiDate(editing.event_date) || wallClock.date,
          startTime,
          // An event without an end gets a sensible one, an hour after it starts.
          endTime: endTimeOf(detail) || addMinutes(startTime, 60) || "12:00",
          venueName: detail.venue_name ?? "",
          description: detail.description ?? "",
          eventType: detail.event_type ?? "",
          eventTypeOther: detail.event_type_other ?? "",
          hostName: detail.host_name ?? "",
          hostContact: detail.host_contact_number ?? "",
        })
        setImages(detail.images ?? [])
        setCoverUrl(detail.cover_image_url ?? null)
      })
      .catch((error) => {
        const { message, description } = errorMessage(error, "Could not load the event.")
        toast.error(message, { description })
      })
      .finally(() => setLoading(false))
  }, [open, editing])

  const pickCover = (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("The cover image must be an image file.")
      return
    }
    if (file.size > MAX_EVENT_IMAGE_BYTES) {
      toast.error("The cover image must be 10 MB or smaller.")
      return
    }
    setCoverFile((current) => {
      if (current) releasePreview(current.preview)
      return { file, preview: trackPreview(URL.createObjectURL(file)) }
    })
  }

  const pickGallery = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const pickedFiles = Array.from(files)
    const bad = pickedFiles.find((file) => !file.type.startsWith("image/"))
    if (bad) {
      toast.error(`${bad.name} is not an image.`)
      return
    }
    const tooBig = pickedFiles.find((file) => file.size > MAX_EVENT_IMAGE_BYTES)
    if (tooBig) {
      toast.error(`${tooBig.name} is larger than 10 MB.`)
      return
    }
    const accepted = pickedFiles.slice(0, slotsLeft)
    if (accepted.length < pickedFiles.length) {
      toast.error(`An event holds at most ${MAX_EVENT_IMAGES} images.`)
    }
    setPicked((current) => [
      ...current,
      ...accepted.map((file) => ({ file, preview: trackPreview(URL.createObjectURL(file)) })),
    ])
  }

  const dropPicked = (index: number) => {
    setPicked((current) => {
      const target = current[index]
      if (target) releasePreview(target.preview)
      return current.filter((_, i) => i !== index)
    })
  }

  const deleteImage = async (image: EventImageRecord) => {
    if (!editing) return
    try {
      await removeEventImage(editing.id, image.id)
      setImages((current) => current.filter((i) => i.id !== image.id))
      toast.success("Image removed")
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not remove the image.")
      toast.error(message, { description })
    }
  }

  const clearCover = async () => {
    if (editing && coverUrl) {
      try {
        await removeEventCover(editing.id)
        setCoverUrl(null)
        toast.success("Cover image removed")
      } catch (error) {
        const { message, description } = errorMessage(error, "Could not remove the cover image.")
        toast.error(message, { description })
        return
      }
    }
    setCoverFile((current) => {
      if (current) releasePreview(current.preview)
      return null
    })
    setCoverUrl(null)
  }

  const validate = (): string | null => {
    if (!form.title.trim()) return "The event title is required."
    if (!form.eventDate) return "The event date is required."
    if (!form.startTime) return "The start time is required."
    if (!form.endTime) return "The end time is required."
    if (form.endTime <= form.startTime) return "The end time must be after the start time."
    if (!form.eventType) return "The event type is required."
    if (form.eventType === "OTHER" && !form.eventTypeOther.trim()) {
      return "Please name the event type."
    }
    if (!isValidPhone(form.hostContact)) return "The host mobile number is not a valid phone number."
    return null
  }

  const save = async () => {
    const problem = validate()
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        event_date: toApiDate(form.eventDate),
        event_time: form.startTime,
        venue_name: form.venueName.trim() || null,
        description: form.description.trim() || null,
        event_type: form.eventType,
        event_type_other: form.eventType === "OTHER" ? form.eventTypeOther.trim() : null,
        host_name: form.hostName.trim() || null,
        host_contact_number: form.hostContact.trim() || null,
        starts_at: toStartsAt(form.eventDate, form.startTime),
        ends_at: toEndsAt(form.eventDate, form.endTime),
      }
      const saved = editing ? await updateEvent(editing.id, payload) : await createEvent(payload)

      // The images need the event's id, so they upload once the event exists.
      let uploadFailed = false
      if (coverFile) {
        try {
          await uploadEventCover(saved.id, coverFile.file)
        } catch {
          uploadFailed = true
        }
      }
      if (picked.length) {
        try {
          await uploadEventImages(saved.id, picked.map((image) => image.file))
        } catch {
          uploadFailed = true
        }
      }

      if (uploadFailed) {
        toast.error("Event saved, but the images failed to upload", {
          description: "Save again to retry the upload.",
        })
      } else {
        toast.success(editing ? "Event updated" : "Event created")
      }
      onSaved()
      if (!uploadFailed) onOpenChange(false)
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not save the event.")
      toast.error(message, { description })
    } finally {
      setSaving(false)
    }
  }

  const coverPreview = coverFile?.preview ?? coverUrl
  const typeOptions = useMemo(
    () => (eventTypes.length ? eventTypes : [{ value: "OTHER", label: "Other" }]),
    [eventTypes]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the event details, its cover image and its gallery."
              : "Create a community event, then add its cover image and gallery."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading the event…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Event title" required className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="e.g. Community Blood Donation Camp"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
              <FormField label="Event date" required>
                <DateInput value={form.eventDate} onChange={(v) => change("eventDate", v)} />
              </FormField>

              <FormField label="Start at" required>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => change("startTime", e.target.value)}
                />
              </FormField>

              <FormField label="End time" required>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => change("endTime", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Event venue" className="sm:col-span-2">
              <Input
                value={form.venueName}
                onChange={(e) => change("venueName", e.target.value)}
                placeholder="Venue name, e.g. Gandhi Seva Sangh Hall"
              />
            </FormField>

            <FormField label="Event type" required>
              <Select value={form.eventType} onValueChange={(v) => change("eventType", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the event type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {form.eventType === "OTHER" && (
              <FormField label="Other event type" required hint="The name of the programme.">
                <Input
                  value={form.eventTypeOther}
                  onChange={(e) => change("eventTypeOther", e.target.value)}
                  placeholder="e.g. Blood Donation Camp"
                />
              </FormField>
            )}

            <FormField label="Host name">
              <Input
                value={form.hostName}
                onChange={(e) => change("hostName", e.target.value)}
                placeholder="Who hosts the event"
              />
            </FormField>

            <FormField label="Host mobile number">
              <Input
                type="tel"
                inputMode="tel"
                value={form.hostContact}
                onChange={(e) => change("hostContact", e.target.value)}
                placeholder="9876543210"
              />
            </FormField>

            <FormField label="Event description" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
                rows={4}
                placeholder="What the event is about…"
              />
            </FormField>

            <FormField
              label="Cover image"
              className="sm:col-span-2"
              hint="JPG, PNG, WebP or GIF — up to 10 MB."
            >
              <div className="flex items-center gap-3">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {coverPreview ? (
                    <img src={coverPreview} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Upload />
                    {coverFile || coverUrl ? "Replace image" : "Upload image"}
                  </Button>
                  {(coverFile || coverUrl) && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearCover}>
                      Remove image
                    </Button>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    pickCover(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </div>
            </FormField>

            <FormField
              label="Event images"
              className="sm:col-span-2"
              hint={`Up to ${MAX_EVENT_IMAGES} images in total — ${usedSlots} of ${MAX_EVENT_IMAGES} used.`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={slotsLeft === 0}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <Upload />
                    Add images
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {slotsLeft} {slotsLeft === 1 ? "slot" : "slots"} left
                  </span>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      pickGallery(e.target.files)
                      e.target.value = ""
                    }}
                  />
                </div>

                {images.length + picked.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <img src={image.url} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => deleteImage(image)}
                          className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow-sm"
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {picked.map((image, index) => (
                      <div
                        key={image.preview}
                        className="relative aspect-square overflow-hidden rounded-lg border border-dashed bg-muted"
                      >
                        <img src={image.preview} alt="" className="size-full object-cover opacity-80" />
                        <button
                          type="button"
                          onClick={() => dropPicked(index)}
                          className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow-sm"
                          aria-label="Remove image"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {saving ? "Saving…" : editing ? "Save changes" : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
