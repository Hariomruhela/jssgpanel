import type { FeeConfig } from "@/types"
import { db, delay } from "@/services/mock/db"

export async function getFeeConfigs(): Promise<FeeConfig[]> {
  return delay([...db.feeConfigs])
}

export async function updateFeeConfig(groupId: string, input: Partial<Pick<FeeConfig, "amount" | "dueDate" | "lateFee" | "status">>): Promise<FeeConfig | undefined> {
  const idx = db.feeConfigs.findIndex((f) => f.groupId === groupId)
  if (idx === -1) return delay(undefined)
  db.feeConfigs[idx] = { ...db.feeConfigs[idx], ...input }
  return delay(db.feeConfigs[idx], 300)
}

export async function applyFeeToAll(input: Partial<Pick<FeeConfig, "amount" | "dueDate" | "lateFee">>): Promise<FeeConfig[]> {
  db.feeConfigs.forEach((f) => {
    f.amount = input.amount ?? f.amount
    f.dueDate = input.dueDate ?? f.dueDate
    f.lateFee = input.lateFee ?? f.lateFee
  })
  return delay([...db.feeConfigs], 400)
}