import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, X } from "lucide-react"
import { ApiError } from "@/lib/apiClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PhotoCropDialog } from "@/components/PhotoCropDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberFieldGrid } from "./MemberFieldGrid"
import {
  CREATE_SECTIONS,
  emptyMemberForm,
  memberToFormState,
  resolveSections,
  toCreateInput,
  toPatchInput,
  type MemberFormState,
  type MemberOption,
} from "./memberFormFields"
import {
  createMember,
  deleteMemberPhoto,
  setMemberStatus,
  updateMember,
  uploadMemberPhoto,
  type MemberGroupOptions,
  type MemberLocationOptions,
} from "@/services/api/members"
import { createUser } from "@/services/api/users"
import type { MemberRecord } from "@/types"

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

function generatePassword(): string {
  const bytes = new Uint32Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]).join("")
}

interface PhotoPickerProps {
  label: string
  currentUrl: string
  file: File | null
  previewUrl: string | null
  disabled?: boolean
  /** Shown only when a photo is stored on the server (edit mode). */
  canRemove?: boolean
  removing?: boolean
  onPick: (file: File | null) => void
  onRemove?: () => void
}

function PhotoPicker({ label, currentUrl, file, previewUrl, disabled, canRemove, removing, onPick, onRemove }: PhotoPickerProps) {
  const shown = previewUrl || currentUrl || null
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Avatar size="sm">
        {shown && <AvatarImage src={shown} alt={label} />}
        <AvatarFallback>{label.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {file ? file.name : shown ? "Photo on file" : "No photo yet"}
        </p>
      </div>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        id={`photo-${label}`}
        disabled={disabled}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />
      <Button asChild size="xs" variant="outline" disabled={disabled}>
        <label htmlFor={`photo-${label}`} className="cursor-pointer">
          {file ? "Change" : shown ? "Replace" : "Upload"}
        </label>
      </Button>
      {canRemove && !file && onRemove && (
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={disabled || removing}
          aria-label={`Remove stored ${label}`}
          onClick={onRemove}
        >
          {removing ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      )}
      {file && (
        <Button
          size="icon-xs"
          variant="ghost"
          disabled={disabled}
          aria-label={`Clear selected ${label}`}
          onClick={() => onPick(null)}
        >
          <X />
        </Button>
      )}
    </div>
  )
}

interface MemberFormDialogProps {
  open: boolean
  editing: MemberRecord | null
  signedIn: boolean
  groups: MemberGroupOptions
  locations: MemberLocationOptions
  onOpenChange: (open: boolean) => void
  onSaved: (member: MemberRecord, mode: "created" | "updated") => void
  onRequireSignIn: () => void
}

export function MemberFormDialog({
  open,
  editing,
  signedIn,
  groups,
  locations,
  onOpenChange,
  onSaved,
  onRequireSignIn,
}: MemberFormDialogProps) {
  const [form, setForm] = useState<MemberFormState>(() =>
    editing ? memberToFormState(editing) : emptyMemberForm()
  )
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<{ member?: File; spouse?: File }>({})
  const [previews, setPreviews] = useState<{ member?: string; spouse?: string }>({})
  const [cropTarget, setCropTarget] = useState<{ slot: "member" | "spouse"; file: File } | null>(null)
  const [photoToRemove, setPhotoToRemove] = useState<"member" | "spouse" | null>(null)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [tab, setTab] = useState(CREATE_SECTIONS[0].id)

  const isEditing = !!editing
  const optionSets = useMemo(
    () => ({
      groups: groups.map<MemberOption>((group) => ({ label: group.name, value: group.id })),
      locations: locations.map<MemberOption>((location) => ({ label: location.name, value: location.id })),
    }),
    [groups, locations]
  )

  const sections = useMemo(
    () => resolveSections(CREATE_SECTIONS, optionSets, form),
    [optionSets, form]
  )

  const change = (key: string, value: string) => setForm((state) => ({ ...state, [key]: value }))

  const pickPhoto = (slot: "member" | "spouse", file: File | null) => {
    const previous = previews[slot]
    if (previous) URL.revokeObjectURL(previous)
    const objectUrl = file ? URL.createObjectURL(file) : undefined
    setPhotos((current) => ({ ...current, [slot]: file ?? undefined }))
    setPreviews((current) => ({ ...current, [slot]: objectUrl }))
  }

  /** Deletes the stored photo for a slot, then clears it from the form. */
  const confirmRemovePhoto = async () => {
    const slot = photoToRemove
    if (!slot || !editing) return
    setRemovingPhoto(true)
    try {
      await deleteMemberPhoto(editing.id, slot)
      const linkKey = slot === "member" ? "member_photo_link" : "spouse_photo_link"
      change(linkKey, "")
      if (slot === "member") change("profile_photo_url", "")
      const previous = previews[slot]
      if (previous) URL.revokeObjectURL(previous)
      setPhotos((current) => ({ ...current, [slot]: undefined }))
      setPreviews((current) => ({ ...current, [slot]: undefined }))
      setPhotoToRemove(null)
      toast.success(`${slot === "member" ? "Member" : "Spouse"} photo removed`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the photo.", {
        description: error instanceof ApiError ? error.detail ?? undefined : undefined,
      })
    } finally {
      setRemovingPhoto(false)
    }
  }

  const uploadSelectedPhotos = async (memberId: string): Promise<string | null> => {
    const failures: string[] = []
    for (const slot of ["member", "spouse"] as const) {
      const file = photos[slot]
      if (!file) continue
      try {
        const result = await uploadMemberPhoto(memberId, slot, file)
        if (result.photoUrl) {
          change(slot === "member" ? "member_photo_link" : "spouse_photo_link", result.photoUrl)
        }
      } catch (error) {
        failures.push(`${slot === "member" ? "Member" : "Spouse"} photo: ${error instanceof Error ? error.message : "upload failed"}`)
      }
    }
    return failures.length > 0 ? failures.join(" · ") : null
  }

  const save = async () => {
    if (!signedIn) {
      onRequireSignIn()
      return
    }
    if (!form.group_id.trim()) {
      toast.error("Social group is required")
      return
    }
    if (!form.full_name.trim()) {
      toast.error("Full name is required")
      return
    }
    if (!isEditing) {
      if (!form.phone_number.trim()) {
        toast.error("Phone number is required")
        return
      }
      if (!form.email.trim()) {
        toast.error("Email is required to create the member login")
        return
      }
    }

    setSaving(true)
    try {
      let saved: MemberRecord
      if (editing) {
        const updated = await updateMember(editing.id, toPatchInput(form))
        saved = { ...editing, ...updated }
        toast.success("Member updated successfully")
      } else {
        // Every member gets a login: a MEMBER account is created first, then the
        // member record is linked to it.
        const password = generatePassword()
        const account = await createUser({
          email: form.email.trim(),
          password,
          full_name: form.full_name.trim(),
          phone_number: form.phone_number.trim() || null,
          role_name: "MEMBER",
        })
        saved = await createMember(toCreateInput(form, account.id))
        // The API creates members as PENDING; approve straight away so a member
        // added from the panel never sits in the group list with a pending status.
        try {
          const approved = await setMemberStatus(saved.id, "APPROVED")
          saved = { ...saved, ...approved }
          toast.success("Member created with a MEMBER login", {
            description: `Login: ${account.email} · Temporary password: ${password}`,
            duration: 15000,
          })
        } catch (approveError) {
          toast.warning("Member created, but it could not be approved automatically", {
            description:
              (approveError instanceof ApiError ? approveError.detail : null) ??
              (approveError instanceof Error ? approveError.message : null) ??
              undefined,
          })
        }
      }
      const photoFailure = await uploadSelectedPhotos(saved.id)
      if (photoFailure) {
        toast.error("The member was saved, but a photo could not be uploaded", {
          description: photoFailure,
        })
      }
      onSaved(saved, editing ? "updated" : "created")
      onOpenChange(false)
    } catch (error) {
      // the form keeps its values so the admin can correct the failure
      const detail = error instanceof ApiError ? error.detail : null
      toast.error(error instanceof Error ? error.message : "Could not save the member.", {
        description: detail ?? undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit member" : "Add member"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edits the full member record and profile, including photos, in one save."
              : "Creates the member record together with a MEMBER login account."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          {!signedIn && (
            <Card size="sm" className="border-amber-500/40 bg-amber-50 dark:bg-amber-500/10">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You are signed out of the JSSG API, so this member cannot be saved.
                </p>
                <Button size="sm" variant="outline" onClick={onRequireSignIn}>
                  Sign in
                </Button>
              </CardContent>
            </Card>
          )}

          <Card size="sm">
            <CardContent className="space-y-3 py-3">
              <p className="text-sm font-medium">Photos</p>
              <p className="text-xs text-muted-foreground">
                A chosen file is uploaded right after the member is saved, and replaces the current photo for that
                slot.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <PhotoPicker
                  label="Member photo"
                  currentUrl={form.member_photo_link}
                  file={photos.member ?? null}
                  previewUrl={previews.member ?? null}
                  disabled={!signedIn || saving}
                  canRemove={isEditing && !!(editing?.member_photo_link || editing?.profile_photo_url)}
                  removing={removingPhoto && photoToRemove === "member"}
                  onPick={(file) => (file ? setCropTarget({ slot: "member", file }) : pickPhoto("member", null))}
                  onRemove={() => setPhotoToRemove("member")}
                />
                <PhotoPicker
                  label="Spouse photo"
                  currentUrl={form.spouse_photo_link}
                  file={photos.spouse ?? null}
                  previewUrl={previews.spouse ?? null}
                  disabled={!signedIn || saving}
                  canRemove={isEditing && !!editing?.spouse_photo_link}
                  removing={removingPhoto && photoToRemove === "spouse"}
                  onPick={(file) => (file ? setCropTarget({ slot: "spouse", file }) : pickPhoto("spouse", null))}
                  onRemove={() => setPhotoToRemove("spouse")}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full flex-wrap justify-start">
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="pt-4">
                <MemberFieldGrid sections={[section]} values={form} onChange={change} disabled={!signedIn} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !signedIn}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create member"}
          </Button>
        </DialogFooter>

        <ConfirmDialog
          open={photoToRemove !== null}
          onOpenChange={(open) => !open && setPhotoToRemove(null)}
          title={`Remove ${photoToRemove === "spouse" ? "spouse" : "member"} photo`}
          description="This deletes the stored photo from the server. You can upload a replacement afterwards."
          confirmLabel="Remove photo"
          variant="destructive"
          loading={removingPhoto}
          onConfirm={confirmRemovePhoto}
        />

        <PhotoCropDialog
          open={cropTarget !== null}
          file={cropTarget?.file ?? null}
          title={cropTarget?.slot === "spouse" ? "Crop spouse photo" : "Crop member photo"}
          onOpenChange={(open) => !open && setCropTarget(null)}
          onCropped={(cropped) => {
            if (cropTarget) pickPhoto(cropTarget.slot, cropped)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
