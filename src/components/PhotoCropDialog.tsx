import { useCallback, useEffect, useState } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/lib/language"
import { cropImageToFile } from "@/lib/cropImage"

interface PhotoCropDialogProps {
  open: boolean
  file: File | null
  title?: string
  aspect?: number
  onOpenChange: (open: boolean) => void
  onCropped: (file: File) => void
}

export function PhotoCropDialog({
  open,
  file,
  title,
  aspect = 1,
  onOpenChange,
  onCropped,
}: PhotoCropDialogProps) {
  const { t } = useLanguage()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!file) {
      setImageSrc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setArea(null)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setArea(pixels)
  }, [])

  const confirm = async () => {
    if (!imageSrc || !area || !file) return
    setBusy(true)
    try {
      const type = file.type === "image/png" ? "image/png" : "image/jpeg"
      const cropped = await cropImageToFile(imageSrc, area, file.name, type)
      onCropped(cropped)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not crop the image."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? t("Crop photo")}</DialogTitle>
          <DialogDescription>
            {t("Drag to reposition and use the slider to zoom, then confirm the crop.")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-black/90">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("Zoom")}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label={t("Zoom")}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-primary"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("Cancel")}
          </Button>
          <Button onClick={confirm} disabled={busy || !area}>
            {busy ? t("Cropping…") : t("Crop & use")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
