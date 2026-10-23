import { apiRequest, unwrapList } from "@/lib/apiClient"
import type { ApiEnvelope } from "@/types"

export interface GeoState {
  id: string
  lgd_code: number
  name: string
  code: string
  is_union_territory: boolean
  is_active: boolean
}

export interface GeoCity {
  id: string
  lgd_code: number
  name: string
  state_id: string
  district_id: string | null
  district_name: string | null
  ulb_type_code: number | null
  census_2011_code: string | null
  city_code: string
  prefix: string
  is_active: boolean
}

const STATE_PAGE_SIZE = 100
const CITY_PAGE_SIZE = 200

async function fetchAllPages<T>(path: (page: number) => string): Promise<T[]> {
  const first = await apiRequest<ApiEnvelope<T[]>>(path(1))
  const items = [...unwrapList<T>(first)]
  const totalPages = first.pagination?.total_pages ?? 1
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await apiRequest<ApiEnvelope<T[]>>(path(page))
    items.push(...unwrapList<T>(next))
  }
  return items
}

/** All RTO-covered States/UTs used by group city/state selects. */
export async function getGeoStates(): Promise<GeoState[]> {
  const states = await fetchAllPages<GeoState>(
    (page) => `/geo/states?page=${page}&page_size=${STATE_PAGE_SIZE}`
  )
  return states.filter((state) => state.is_active)
}

/** Every RTO-covered city/town of one State/UT, across all API pages. */
export async function getGeoStateCities(state: string): Promise<GeoCity[]> {
  const encoded = encodeURIComponent(state)
  const cities = await fetchAllPages<GeoCity>(
    (page) =>
      `/geo/states/${encoded}/cities?page=${page}&page_size=${CITY_PAGE_SIZE}`
  )
  return cities.filter((city) => city.is_active)
}
