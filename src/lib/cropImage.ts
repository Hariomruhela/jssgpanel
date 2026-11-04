import type { Area } from "react-easy-crop"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load the selected image."))
    image.src = src
  })
}

export interface CropImageOptions {
  outputWidth?: number
  outputHeight?: number
}

/**
 * Draws the selected crop area of an image onto a canvas and returns it as a
 * `File`, so the cropped bytes can be uploaded exactly like the original pick.
 */
export async function cropImageToFile(
  imageSrc: string,
  area: Area,
  fileName: string,
  type = "image/jpeg",
  quality = 0.92,
  options: CropImageOptions = {}
): Promise<File> {
  const image = await loadImage(imageSrc)
  const cropWidth = Math.max(1, Math.round(area.width))
  const cropHeight = Math.max(1, Math.round(area.height))
  const width = Math.max(1, Math.round(options.outputWidth ?? cropWidth))
  const height = Math.max(1, Math.round(options.outputHeight ?? cropHeight))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not process the image.")

  context.drawImage(
    image,
    Math.round(area.x),
    Math.round(area.y),
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  )

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error("Could not crop the image.")

  const base = fileName.replace(/\.[^.]+$/, "") || "photo"
  const extension = type === "image/png" ? "png" : "jpg"
  return new File([blob], `${base}-cropped.${extension}`, { type })
}
