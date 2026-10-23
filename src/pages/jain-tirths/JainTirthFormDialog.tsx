import { useCallback, useEffect, useRef, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/FormField"
import { DateInput } from "@/components/DateInput"
import type { JainTirthImageRecord, JainTirthRecord } from "@/types"
import {
  MAX_JAIN_TIRTH_IMAGES,
  MAX_JAIN_TIRTH_IMAGE_BYTES,
  createJainTirth,
  fromApiDate,
  getJainTirth,
  listJainTirthImages,
  removeJainTirthCover,
  removeJainTirthImage,
  updateJainTirth,
  uploadJainTirthCover,
  uploadJainTirthImages,
} from "@/services/api/jainTirths"

interface JainTirthFormDialogProps {
  open: boolean
  /** The Jain Tirth being edited; `null` while creating a new one. */
  editing: JainTirthRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

interface FormState {
  title: string
  /** ISO `yyyy-mm-dd`; the API is sent `dd/mm/yyyy`. */
  tirthDate: string
  location: string
  description: string
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
    tirthDate: todayIso(),
    location: "",
    description: "",
  }
}

function errorMessage(error: unknown, fallback: string): { message: string; description?: string } {
  if (error instanceof ApiError) return { message: error.message, description: error.detail ?? undefined }
  return { message: error instanceof Error ? error.message : fallback }
}

export function JainTirthFormDialog({
  open,
  editing,
  onOpenChange,
  onSaved,
}: JainTirthFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // The cover image: the picked file, its preview and the URL already stored.
  const [coverFile, setCoverFile] = useState<PickedImage | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  // The gallery: the images already on the Jain Tirth and the newly picked ones.
  const [images, setImages] = useState<JainTirthImageRecord[]>([])
  const [picked, setPicked] = useState<PickedImage[]>([])
  // The id of a Jain Tirth created here, kept so a failed upload can be retried
  // without creating a duplicate.
  const [savedId, setSavedId] = useState<string | null>(null)

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
  const slotsLeft = Math.max(0, MAX_JAIN_TIRTH_IMAGES - usedSlots)

  const change = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }))
  }, [])

  // Load the Jain Tirth and its gallery whenever the dialog opens for an edit.
  useEffect(() => {
    if (!open) return
    // The previews of the last round are of no use any more.
    previewsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewsRef.current = []
    setPicked([])
    setCoverFile(null)
    setSavedId(null)
    if (!editing) {
      setForm(emptyForm())
      setImages([])
      setCoverUrl(null)
      return
    }
    setLoading(true)
    // The detail carries the fields; the gallery comes from its own endpoint.
    Promise.allSettled([getJainTirth(editing.id), listJainTirthImages(editing.id)])
      .then(([detailResult, imagesResult]) => {
        if (detailResult.status === "rejected") {
          const { message, description } = errorMessage(
            detailResult.reason,
            "Could not load the Jain Tirth."
          )
          toast.error(message, { description })
          return
        }
        const detail = detailResult.value
        setForm({
          title: detail.title,
          tirthDate: fromApiDate(detail.tirth_date) || fromApiDate(editing.tirth_date),
          location: detail.location ?? "",
          description: detail.description ?? "",
        })
        setImages(
          imagesResult.status === "fulfilled" ? imagesResult.value : (detail.images ?? [])
        )
        setCoverUrl(detail.cover_image_url ?? null)
      })
      .finally(() => setLoading(false))
  }, [open, editing])

  const pickCover = (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("The cover image must be an image file.")
      return
    }
    if (file.size > MAX_JAIN_TIRTH_IMAGE_BYTES) {
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
    const tooBig = pickedFiles.find((file) => file.size > MAX_JAIN_TIRTH_IMAGE_BYTES)
    if (tooBig) {
      toast.error(`${tooBig.name} is larger than 10 MB.`)
      return
    }
    const accepted = pickedFiles.slice(0, slotsLeft)
    if (accepted.length < pickedFiles.length) {
      toast.error(`A Jain Tirth holds at most ${MAX_JAIN_TIRTH_IMAGES} images.`)
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

  const deleteImage = async (image: JainTirthImageRecord) => {
    if (!editing) return
    try {
      await removeJainTirthImage(editing.id, image.id)
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
        await removeJainTirthCover(editing.id)
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
    if (!form.title.trim()) return "The Jain Tirth name is required."
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
      // `tirth_date` is not part of the API's Jain Tirth model, so it is not sent.
      const payload = {
        title: form.title.trim(),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      }
      const targetId = editing?.id ?? savedId
      const isNew = !targetId
      const saved = targetId
        ? await updateJainTirth(targetId, payload)
        : await createJainTirth(payload)
      if (isNew) setSavedId(saved.id)

      // The images need the Jain Tirth's id, so they upload once it exists.
      const uploadFailures: string[] = []

      if (coverFile) {
        try {
          const updated = await uploadJainTirthCover(saved.id, coverFile.file)
          if (updated?.cover_image_url) setCoverUrl(updated.cover_image_url)
          releasePreview(coverFile.preview)
          setCoverFile(null)
        } catch (error) {
          const { message, description } = errorMessage(error, "Cover upload failed.")
          uploadFailures.push(description ? `${message} (${description})` : message)
        }
      }

      // One request per image: the API stores them all, and a single bad file
      // no longer takes the rest of the batch down with it.
      for (const image of picked) {
        try {
          const uploaded = await uploadJainTirthImages(saved.id, [image.file])
          setImages((current) => [...current, ...uploaded])
          releasePreview(image.preview)
          setPicked((current) => current.filter((item) => item !== image))
        } catch (error) {
          const { message, description } = errorMessage(error, "Image upload failed.")
          uploadFailures.push(
            `${image.file.name}: ${description ? `${message} (${description})` : message}`
          )
        }
      }

      if (uploadFailures.length) {
        toast.error("Jain Tirth saved, but some images failed to upload", {
          description: `${uploadFailures.join(" · ")} — save again to retry.`,
        })
      } else {
        toast.success(isNew ? "Jain Tirth created" : "Jain Tirth updated")
      }
      onSaved()
      if (!uploadFailures.length) onOpenChange(false)
    } catch (error) {
      const { message, description } = errorMessage(error, "Could not save the Jain Tirth.")
      toast.error(message, { description })
    } finally {
      setSaving(false)
    }
  }

  const coverPreview = coverFile?.preview ?? coverUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Jain Tirth" : "Add Jain Tirth"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the Jain Tirth details, its cover image and its gallery."
              : "Create a Jain Tirth, then add its cover image and gallery."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading the Jain Tirth…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Jain Tirth name" required className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="e.g. Shree Mahavirji Tirth"
              />
            </FormField>

            <FormField label="Date">
              <DateInput value={form.tirthDate} onChange={(v) => change("tirthDate", v)} />
            </FormField>

            <FormField label="Location">
              <Input
                value={form.location}
                onChange={(e) => change("location", e.target.value)}
                placeholder="e.g. Chandangaon, Rajasthan"
              />
            </FormField>

            <FormField label="Jain Tirth description" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
                rows={4}
                placeholder="What the Jain Tirth is about…"
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
              label="Jain Tirth images"
              className="sm:col-span-2"
              hint={`Up to ${MAX_JAIN_TIRTH_IMAGES} images in total — ${usedSlots} of ${MAX_JAIN_TIRTH_IMAGES} used.`}
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
            {saving ? "Saving…" : editing ? "Save changes" : "Create Jain Tirth"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
