import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import { API_BASE_URL, AUTH_UNAUTHORIZED_EVENT, apiRequest, extractMessage, getStoredToken } from "@/lib/apiClient"
import type {
  Advertisement,
  AdvertisementCreateInput,
  AdvertisementListParams,
  AdvertisementListResponse,
  AdvertisementUpdateInput,
  ApiEnvelope,
  SubscriptionDurationOption,
  SubscriptionPriceUpdate,
} from "@/types"

/**
 * Axios instance configured for Advertisements API endpoints.
 * Base URL defaults to `/api/v1/advertisements` with Bearer token authorization.
 */
export const adsApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/advertisements`,
  headers: {
    Accept: "application/json",
  },
})

// Attach Bearer token on every request
adsApi.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

// Intercept responses for unified error messaging & 401 handling
adsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
      }
    }
    const serverPayload = error.response?.data
    const statusText = error.response?.status ? ` (Status ${error.response.status})` : ""
    const fallback = error.message ? `${error.message}${statusText}` : "Request failed"
    const parsedMessage = extractMessage(serverPayload, fallback)

    const enhancedError = new Error(parsedMessage)
    ;(enhancedError as unknown as { status?: number }).status = error.response?.status
    return Promise.reject(enhancedError)
  }
)

/**
 * Fetch active subscription plans. Prices are always read from the API — the
 * frontend never keeps its own price list, so a Super Admin update cannot be
 * bypassed by a stale bundle.
 * GET /api/v1/advertisements/subscription-durations
 */
export async function getSubscriptionDurations(): Promise<SubscriptionDurationOption[]> {
  const res = await adsApi.get<ApiEnvelope<SubscriptionDurationOption[]>>("/subscription-durations")
  return Array.isArray(res.data?.data) ? res.data.data : []
}

/**
 * Update database-backed plan prices. Super Admin only.
 * PUT /api/v1/advertisements/subscription-durations
 */
export async function updateSubscriptionPricing(
  plans: SubscriptionPriceUpdate[]
): Promise<SubscriptionDurationOption[]> {
  const res = await adsApi.put<ApiEnvelope<SubscriptionDurationOption[]>>(
    "/subscription-durations",
    { plans }
  )
  return Array.isArray(res.data?.data) ? res.data.data : []
}

/**
 * Fetch paginated list of advertisements:
 * GET /api/v1/advertisements
 */
export async function getAdvertisements(
  params: AdvertisementListParams = {}
): Promise<AdvertisementListResponse> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.page_size ?? 20))

  const queryParams: Record<string, string | number | boolean> = {
    page,
    page_size: pageSize,
  }

  if (params.group_id) queryParams.group_id = params.group_id
  if (params.status && params.status !== "ALL") queryParams.status = params.status
  if (params.placement) queryParams.placement = params.placement
  if (params.active_only) queryParams.active_only = true

  const res = await adsApi.get<ApiEnvelope<Advertisement[]>>("", {
    params: queryParams,
  })

  const rawItems = Array.isArray(res.data?.data) ? res.data.data : []
  const pagination = res.data?.pagination

  // Normalise items to ensure both snake_case and camelCase compatibility
  const items = rawItems.map((item) => ({
    ...item,
    advertiser: item.person_name || item.advertiser || "Advertiser",
    postBy: item.group_name || item.postBy || "General",
    startDate: item.start_date || item.startDate || "",
    endDate: item.end_date || item.endDate || "",
    spend: Number(item.amount ?? item.spend ?? 0),
    amount: Number(item.amount ?? item.spend ?? 0),
    coverImageUrl: item.cover_image_url || item.coverImageUrl,
    largeImageUrl: item.large_image_url || item.largeImageUrl,
    personName: item.person_name || item.personName,
    mobileNumber: item.mobile_number || item.mobileNumber,
  }))

  return {
    items,
    total: pagination?.total ?? items.length,
    page: pagination?.page ?? page,
    pageSize: pagination?.page_size ?? pageSize,
    totalPages:
      pagination?.total_pages ??
      (Math.ceil((pagination?.total ?? items.length) / pageSize) || 1),
  }
}

/**
 * Fetch a single advertisement by ID:
 * GET /api/v1/advertisements/{id}
 */
export async function getAdvertisement(id: string): Promise<Advertisement> {
  const res = await adsApi.get<ApiEnvelope<Advertisement>>(`/${id}`)
  const item = res.data?.data ?? (res.data as unknown as Advertisement)
  return {
    ...item,
    advertiser: item.person_name || item.advertiser || "Advertiser",
    postBy: item.group_name || item.postBy || "General",
    startDate: item.start_date || item.startDate || "",
    endDate: item.end_date || item.endDate || "",
    spend: Number(item.amount ?? item.spend ?? 0),
    amount: Number(item.amount ?? item.spend ?? 0),
    coverImageUrl: item.cover_image_url || item.coverImageUrl,
    largeImageUrl: item.large_image_url || item.largeImageUrl,
    personName: item.person_name || item.personName,
    mobileNumber: item.mobile_number || item.mobileNumber,
  }
}

/**
 * Create advertisement with JSON payload:
 * POST /api/v1/advertisements
 */
export async function createAdvertisement(
  input: AdvertisementCreateInput
): Promise<Advertisement> {
  const res = await adsApi.post<ApiEnvelope<Advertisement>>("", input)
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Create advertisement with multipart form (including images):
 * POST /api/v1/advertisements/form
 */
export async function createAdvertisementForm(
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<Advertisement> {
  const res = await adsApi.post<ApiEnvelope<Advertisement>>("/form", formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  })
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Upload cover image for an advertisement:
 * POST /api/v1/advertisements/{id}/cover-image
 */
export async function uploadAdvertisementCoverImage(
  id: string,
  file: File
): Promise<Advertisement> {
  const form = new FormData()
  form.append("file", file)
  const res = await adsApi.post<ApiEnvelope<Advertisement>>(`/${id}/cover-image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Upload large image for an advertisement:
 * POST /api/v1/advertisements/{id}/large-image
 */
export async function uploadAdvertisementLargeImage(
  id: string,
  file: File
): Promise<Advertisement> {
  const form = new FormData()
  form.append("file", file)
  const res = await adsApi.post<ApiEnvelope<Advertisement>>(`/${id}/large-image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Delete cover image for an advertisement:
 * DELETE /api/v1/advertisements/{id}/cover-image
 */
export async function deleteAdvertisementCoverImage(id: string): Promise<Advertisement> {
  const res = await adsApi.delete<ApiEnvelope<Advertisement>>(`/${id}/cover-image`)
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Delete large image for an advertisement:
 * DELETE /api/v1/advertisements/{id}/large-image
 */
export async function deleteAdvertisementLargeImage(id: string): Promise<Advertisement> {
  const res = await adsApi.delete<ApiEnvelope<Advertisement>>(`/${id}/large-image`)
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Update advertisement details:
 * PATCH /api/v1/advertisements/{id}
 */
export async function updateAdvertisement(
  id: string,
  input: AdvertisementUpdateInput
): Promise<Advertisement> {
  const res = await adsApi.patch<ApiEnvelope<Advertisement>>(`/${id}`, input)
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Approve or Reject advertisement:
 * POST /api/v1/advertisements/{id}/approve
 */
export async function approveAdvertisement(
  id: string,
  approve: boolean,
  rejectionReason?: string
): Promise<Advertisement> {
  const res = await adsApi.post<ApiEnvelope<Advertisement>>(`/${id}/approve`, {
    approve,
    rejection_reason: rejectionReason,
  })
  return res.data?.data ?? (res.data as unknown as Advertisement)
}

/**
 * Delete advertisement:
 * DELETE /api/v1/advertisements/{id}
 */
export async function deleteAdvertisement(id: string): Promise<void> {
  try {
    await apiRequest(`/advertisements/${id}`, { method: "DELETE", auth: true })
  } catch (err) {
    try {
      await adsApi.delete(`/${id}`)
    } catch {
      throw err
    }
  }
}

export interface AdvertisementCounts {
  total: number
  active: number
  pending: number
  expired: number
}

/**
 * Returns summary stats for the top summary cards
 */
export async function getAdvertisementCounts(): Promise<AdvertisementCounts> {
  try {
    const res = await getAdvertisements({ page: 1, page_size: 100 })
    const all = res.items
    const now = new Date()

    let activeCount = 0
    let pendingCount = 0
    let expiredCount = 0

    for (const ad of all) {
      const statusUpper = (ad.status || "").toUpperCase()
      const end = ad.end_date ? new Date(ad.end_date) : null
      const isPast = end && !isNaN(end.getTime()) && end < now

      if (isPast) {
        expiredCount++
      } else if (statusUpper === "PENDING") {
        pendingCount++
      } else if (statusUpper === "APPROVED" || ad.is_active) {
        activeCount++
      }
    }

    return {
      total: res.total,
      active: activeCount,
      pending: pendingCount,
      expired: expiredCount,
    }
  } catch {
    return { total: 0, active: 0, pending: 0, expired: 0 }
  }
}

/**
 * Robust helper to submit new advertisement with files.
 * Uses POST /form first; if that endpoint is not available, falls back to
 * POST /advertisements + dedicated upload endpoints.
 */
export async function submitAdvertisementWithFiles(params: {
  title: string
  groupId?: string | null
  startDate?: string
  endDate?: string
  personName?: string
  mobileNumber?: string
  subscriptionMonths?: number
  amount?: number | null
  coverImage?: File | null
  largeImage?: File | null
  description?: string
  placement?: string
  targetUrl?: string
}): Promise<Advertisement> {
  try {
    const form = new FormData()
    form.append("title", params.title.trim())
    if (params.personName) form.append("person_name", params.personName.trim())
    if (params.mobileNumber) form.append("mobile_number", params.mobileNumber.trim())
    if (params.groupId) form.append("group_id", params.groupId)
    if (params.startDate) form.append("start_date", params.startDate)
    if (params.endDate) form.append("end_date", params.endDate)
    if (params.subscriptionMonths) {
      form.append("subscription_months", String(params.subscriptionMonths))
    }
    if (params.amount !== undefined && params.amount !== null && !isNaN(params.amount)) {
      form.append("amount", String(params.amount))
    }
    if (params.description) form.append("description", params.description.trim())
    if (params.placement) form.append("placement", params.placement)
    if (params.targetUrl) form.append("target_url", params.targetUrl.trim())
    if (params.coverImage) form.append("cover_image", params.coverImage)
    if (params.largeImage) form.append("large_image", params.largeImage)

    return await createAdvertisementForm(form)
  } catch (err) {
    // If form endpoint returned 404/not supported, fallback to JSON create + dedicated uploads
    const isNotFound = (err as unknown as { status?: number }).status === 404
    if (!isNotFound) {
      throw err
    }

    const created = await createAdvertisement({
      title: params.title.trim(),
      person_name: params.personName?.trim(),
      mobile_number: params.mobileNumber?.trim(),
      group_id: params.groupId ?? null,
      start_date: params.startDate,
      end_date: params.endDate,
      subscription_months: params.subscriptionMonths ?? 1,
      amount: params.amount ?? 0,
      description: params.description?.trim(),
      placement: params.placement || "HOME_BANNER",
      target_url: params.targetUrl?.trim(),
    })

    let currentAd = created
    if (params.coverImage) {
      currentAd = await uploadAdvertisementCoverImage(created.id, params.coverImage)
    }
    if (params.largeImage) {
      currentAd = await uploadAdvertisementLargeImage(created.id, params.largeImage)
    }
    return currentAd
  }
}

// Backward-compatible alias exports
export type AdInput = AdvertisementCreateInput
export const getAds = async () => (await getAdvertisements({ page: 1, page_size: 100 })).items
export const createAd = async (input: AdvertisementCreateInput) => createAdvertisement(input)
export const updateAd = async (id: string, input: AdvertisementUpdateInput) => updateAdvertisement(id, input)
export const removeAd = async (id: string) => deleteAdvertisement(id)
export const updateAdStatus = async (id: string, status: string) =>
  approveAdvertisement(id, status === "approved" || status === "active")
