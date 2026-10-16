import type { City } from "@/types"
import { db, delay } from "@/services/mock/db"

export async function getCities(): Promise<City[]> {
  return delay([...db.cities])
}

export async function updateCity(id: string, input: Partial<Pick<City, "state" | "region" | "status">>): Promise<City | undefined> {
  const idx = db.cities.findIndex((c) => c.id === id)
  if (idx === -1) return delay(undefined)
  db.cities[idx] = { ...db.cities[idx], ...input }
  return delay(db.cities[idx])
}

export async function getGroupsByCity(cityId: string) {
  const city = db.cities.find((c) => c.id === cityId)
  if (!city) return delay([])
  return delay(db.groups.filter((g) => g.city === city.name))
}