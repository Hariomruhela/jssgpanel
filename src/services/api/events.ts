import { apiRequest, unwrapItem, unwrapList } from "@/lib/apiClient"
import type {
  ApiEnvelope,
  EventCreateInput,
  EventDetail,
  EventImageRecord,
  EventPatchInput,
  EventRecord,
  EventTypeOption,
} from "@/types"

const BASE = "/events"

/** The API holds at most this many gallery images per event. */
export const MAX_EVENT_IMAGES = 10

/** The API rejects an image larger than this. */
export const MAX_EVENT_IMAGE_BYTES = 10 * 1024 * 1024

/**
 * The event types the API knows, used until `GET /events/event-types` is live.
 * The labels are the ones that endpoint returns, so the select reads the same
 * either way.
 */
const FALLBACK_EVENT_TYPES: EventTypeOption[] = [
  { value: "ANNUAL", label: "Annual" },
  { value: "MONTHLY_PROGRAM", label: "Monthly Program" },
  { value: "CULTURAL_PROGRAM", label: "Cultural Program" },
  { value: "RELIGIOUS_PROGRAM", label: "Religious Program" },
  { value: "SOCIAL_PROGRAM", label: "Social Program" },
  { value: "SPORTS_PROGRAM", label: "Sports Program" },
  { value: "EDUCATIONAL_PROGRAM", label: "Educational Program" },
  { value: "NATIONAL_DAY_PROGRAM", label: "National Day Program" },
  { value: "FUNDRAISER", label: "Fundraiser" },
  { value: "OTHER", label: "Other" },
]

export interface EventListParams {
  page?: number
  pageSize?: number
  /** Free-text search over the title, venue and description. */
  search?: string
  /** `ANNUAL`, `FUNDRAISER`, … or `OTHER`. */
  eventType?: string
  /** `PAST`, `UPCOMING` (within 7 days) or `FUTURE`. */
  timeFrame?: string
  order?: "asc" | "desc"
}

export interface EventListResult {
  events: EventRecord[]
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

/**
 * The instant a local date and time refer to, as the browser sees it. The
 * current API derives the instant from the date and the time and ignores
 * this, but an older one only knows the instant.
 */
export function toStartsAt(isoDate: string, time: string): string | null {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const moment = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(moment.getTime())) return null
  const offset = -moment.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const absolute = Math.abs(offset)
  const zone = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`
  return `${isoDate}T${time.length === 5 ? time : "00:00"}${zone}`
}

/**
 * The instant the event ends. The end sits on the same day as the start, so
 * it is the same moment builder with the end time.
 */
export function toEndsAt(isoDate: string, time: string): string | null {
  return toStartsAt(isoDate, time)
}

/**
 * The local date and time an instant falls on. Used when the API answers with
 * the instant only.
 */
export function fromStartsAt(startsAt: string | null | undefined): { date: string; time: string } {
  if (!startsAt) return { date: "", time: "" }
  const moment = new Date(startsAt)
  if (Number.isNaN(moment.getTime())) return { date: "", time: "" }
  const date = `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, "0")}-${String(moment.getDate()).padStart(2, "0")}`
  const time = `${String(moment.getHours()).padStart(2, "0")}:${String(moment.getMinutes()).padStart(2, "0")}`
  return { date, time }
}

/**
 * A `HH:MM` time some minutes later, wrapping around midnight.
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, rest] = time.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(rest)) return ""
  const total = (hours * 60 + rest + minutes + 24 * 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

/**
 * The end of an event as a wall-clock `HH:MM`. The gap between the two
 * instants is the length of the event, so the end is read in the event's own
 * clock and does not drift with the reader's timezone. Empty when the event
 * has no end.
 */
export function endTimeOf(event: {
  event_time?: string | null
  starts_at?: string | null
  ends_at?: string | null
}): string {
  const end = fromStartsAt(event.ends_at).time
  if (!end) return ""
  const start = event.event_time ?? ""
  if (!start) return end
  const startInstant = Date.parse(event.starts_at ?? "")
  const endInstant = Date.parse(event.ends_at ?? "")
  if (Number.isNaN(startInstant) || Number.isNaN(endInstant)) return end
  return addMinutes(start, Math.round((endInstant - startInstant) / 60000))
}

/**
 * The event types a host can choose from. The API owns the list; the built-in
 * one only fills the gap while that endpoint is not deployed yet.
 */
export async function getEventTypes(): Promise<EventTypeOption[]> {
  try {
    const payload = await apiRequest<ApiEnvelope<EventTypeOption[]>>(`${BASE}/event-types`, {
      auth: true,
    })
    const types = unwrapList<EventTypeOption>(payload).filter((t) => t?.value)
    if (types.length) return types
  } catch {
    // The endpoint is not live yet - the built-in list keeps the select usable.
  }
  return FALLBACK_EVENT_TYPES
}

/** Paged, searchable event list for the events table. */
export async function listEvents(params: EventListParams = {}): Promise<EventListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const query = params.search?.trim()
  if (query) search.set("search", query)
  if (params.eventType) search.set("event_type", params.eventType)
  if (params.timeFrame) search.set("time_frame", params.timeFrame)
  if (params.order) search.set("order", params.order)

  const payload = await apiRequest<ApiEnvelope<EventRecord[]>>(`${BASE}?${search.toString()}`, {
    auth: true,
  })
  const events = unwrapList<EventRecord>(payload)
  const pagination = payload?.pagination

  return {
    events,
    total: pagination?.total ?? events.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages: pagination?.total_pages ?? 1,
  }
}

/**
 * How many events sit in each bucket, read from the API's own totals so the
 * cards never disagree with the table.
 */
export async function getEventCounts(): Promise<{
  total: number
  upcoming: number
  future: number
  past: number
}> {
  const count = async (timeFrame?: string) => {
    const result = await listEvents({ pageSize: 1, timeFrame })
    return result.total
  }
  const [total, upcoming, future, past] = await Promise.all([
    count(),
    count("UPCOMING"),
    count("FUTURE"),
    count("PAST"),
  ])
  return { total, upcoming, future, past }
}

/** One event together with its gallery. */
export async function getEvent(id: string): Promise<EventDetail> {
  const payload = await apiRequest<ApiEnvelope<EventDetail>>(`${BASE}/${id}`, { auth: true })
  return unwrapItem<EventDetail>(payload)
}

export async function createEvent(input: EventCreateInput): Promise<EventRecord> {
  const payload = await apiRequest<ApiEnvelope<EventRecord>>(BASE, {
    method: "POST",
    auth: true,
    body: input,
  })
  return unwrapItem<EventRecord>(payload)
}

export async function updateEvent(id: string, input: EventPatchInput): Promise<EventRecord> {
  const payload = await apiRequest<ApiEnvelope<EventRecord>>(`${BASE}/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  })
  return unwrapItem<EventRecord>(payload)
}

export async function removeEvent(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE", auth: true })
}

/** Upload or replace the event's cover image (the event's profile picture). */
export async function uploadEventCover(id: string, file: File): Promise<EventRecord> {
  const form = new FormData()
  form.append("file", file)
  const payload = await apiRequest<ApiEnvelope<EventRecord>>(`${BASE}/${id}/cover`, {
    method: "POST",
    auth: true,
    body: form,
  })
  return unwrapItem<EventRecord>(payload)
}

/** Remove the event's cover image. */
export async function removeEventCover(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/cover`, { method: "DELETE", auth: true })
}

/** The event's gallery, in upload order. */
export async function listEventImages(id: string): Promise<EventImageRecord[]> {
  const payload = await apiRequest<ApiEnvelope<EventImageRecord[]>>(`${BASE}/${id}/images`, {
    auth: true,
  })
  return unwrapList<EventImageRecord>(payload)
}

/**
 * Add images to the event's gallery. The API accepts at most
 * `MAX_EVENT_IMAGES` per event in total, so the caller keeps the running
 * count in mind.
 */
export async function uploadEventImages(id: string, files: File[]): Promise<EventImageRecord[]> {
  const form = new FormData()
  for (const file of files) form.append("files", file)
  const payload = await apiRequest<ApiEnvelope<EventImageRecord[]>>(`${BASE}/${id}/images`, {
    method: "POST",
    auth: true,
    body: form,
  })
  return unwrapList<EventImageRecord>(payload)
}

/** Remove one image from the event's gallery, freeing a slot. */
export async function removeEventImage(id: string, imageId: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/images/${imageId}`, { method: "DELETE", auth: true })
}
