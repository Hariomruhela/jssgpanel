import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import type {
  ApiEnvelope,
  JainTirthCreateInput,
  JainTirthDetail,
  JainTirthImageRecord,
  JainTirthPatchInput,
  JainTirthRecord,
} from "@/types"

/** `/api/v1` is already part of `API_BASE_URL`, so the path starts at `/jain-tirths`. */
const BASE = "/jain-tirths"

/** The API holds at most this many gallery images per Jain Tirth. */
export const MAX_JAIN_TIRTH_IMAGES = 10

/** The API rejects an image larger than this. */
export const MAX_JAIN_TIRTH_IMAGE_BYTES = 10 * 1024 * 1024

export interface JainTirthListParams {
  page?: number
  pageSize?: number
  /** Free-text search over the title, location and description. */
  search?: string
  /** `DRAFT`, `PUBLISHED`, `CANCELLED` or `COMPLETED`. */
  status?: string
  order?: "asc" | "desc"
}

export interface JainTirthListResult {
  tirths: JainTirthRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** `2026-10-21` -> `21/10/2026`, the format the API shows and accepts. */
export function toApiDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso.trim()
}

/** `21/10/2026` -> `2026-10-21`, or `""` when the text is not a real date. */
export function fromApiDate(value: string | null | undefined): string {
  if (!value) return ""
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return ""
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const valid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  return valid ? `${year}-${month}-${day}` : ""
}

/** Paged, searchable Jain Tirth list for the table. */
export async function listJainTirths(
  params: JainTirthListParams = {}
): Promise<JainTirthListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const query = params.search?.trim()
  if (query) search.set("search", query)
  if (params.status) search.set("status", params.status)
  if (params.order) search.set("order", params.order)

  const payload = await apiRequest<ApiEnvelope<JainTirthRecord[]>>(`${BASE}?${search.toString()}`, {
    auth: true,
  })
  const tirths = unwrapList<JainTirthRecord>(payload)
  const pagination = payload?.pagination

  return {
    tirths,
    total: pagination?.total ?? tirths.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/** How many Jain Tirths sit in each status, read from the API's own totals. */
export async function getJainTirthCounts(): Promise<{
  total: number
  published: number
  draft: number
  cancelled: number
}> {
  const count = async (status?: string) => {
    const result = await listJainTirths({ pageSize: 1, status })
    return result.total
  }
  const [total, published, draft, cancelled] = await Promise.all([
    count(),
    count("PUBLISHED"),
    count("DRAFT"),
    count("CANCELLED"),
  ])
  return { total, published, draft, cancelled }
}

/** One Jain Tirth together with its gallery. */
export async function getJainTirth(id: string): Promise<JainTirthDetail> {
  const payload = await apiRequest<ApiEnvelope<JainTirthDetail>>(`${BASE}/${id}`, { auth: true })
  return unwrapItem<JainTirthDetail>(payload)
}

export async function createJainTirth(input: JainTirthCreateInput): Promise<JainTirthRecord> {
  const payload = await apiRequest<ApiEnvelope<JainTirthRecord>>(BASE, {
    method: "POST",
    auth: true,
    body: input,
  })
  return unwrapItem<JainTirthRecord>(payload)
}

export async function updateJainTirth(
  id: string,
  input: JainTirthPatchInput
): Promise<JainTirthRecord> {
  const payload = await apiRequest<ApiEnvelope<JainTirthRecord>>(`${BASE}/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  })
  return unwrapItem<JainTirthRecord>(payload)
}

export async function removeJainTirth(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE", auth: true })
}

/** Upload or replace the Jain Tirth's cover image. */
export async function uploadJainTirthCover(id: string, file: File): Promise<JainTirthRecord> {
  const form = new FormData()
  form.append("file", file)
  const payload = await apiRequest<ApiEnvelope<JainTirthRecord>>(`${BASE}/${id}/cover`, {
    method: "POST",
    auth: true,
    body: form,
  })
  return unwrapItem<JainTirthRecord>(payload)
}

/** Remove the Jain Tirth's cover image. */
export async function removeJainTirthCover(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/cover`, { method: "DELETE", auth: true })
}

/** The Jain Tirth's gallery, in upload order. */
export async function listJainTirthImages(id: string): Promise<JainTirthImageRecord[]> {
  const payload = await apiRequest<ApiEnvelope<JainTirthImageRecord[]>>(`${BASE}/${id}/images`, {
    auth: true,
  })
  return unwrapList<JainTirthImageRecord>(payload)
}

/** Add images to the Jain Tirth's gallery. */
export async function uploadJainTirthImages(
  id: string,
  files: File[]
): Promise<JainTirthImageRecord[]> {
  const form = new FormData()
  for (const file of files) form.append("files", file)
  const payload = await apiRequest<ApiEnvelope<JainTirthImageRecord[]>>(`${BASE}/${id}/images`, {
    method: "POST",
    auth: true,
    body: form,
  })
  return unwrapList<JainTirthImageRecord>(payload)
}

/** Remove one image from the Jain Tirth's gallery, freeing a slot. */
export async function removeJainTirthImage(id: string, imageId: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/images/${imageId}`, { method: "DELETE", auth: true })
}
