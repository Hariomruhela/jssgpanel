import { useState, useEffect } from "react"
import { X, Heart, Plus, Loader2 } from "lucide-react"
import type { ContributionManualInput, ContributionRecord } from "@/types"
import { recordManualContribution } from "@/services/api/contributions"
import { listGroups } from "@/services/api/groups"

interface AddContributionModalProps {
  onClose: () => void
  onSuccess: (newRecord: ContributionRecord) => void
}

const COMMON_PURPOSES = [
  "General Welfare Contribution",
  "Sadarmik Sahayata Fund",
  "Jain Tirth Development & Care",
  "Youth & Educational Scholarship",
  "Medical & Relief Fund",
  "Federation Mahotsav Fund",
  "Other",
]

export function AddContributionModal({ onClose, onSuccess }: AddContributionModalProps) {
  const [donorName, setDonorName] = useState("")
  const [donorPhone, setDonorPhone] = useState("")
  const [groupId, setGroupId] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CHEQUE" | "UPI" | "BANK_TRANSFER">("ONLINE" as any)
  const [transactionId, setTransactionId] = useState("")
  const [purpose, setPurpose] = useState(COMMON_PURPOSES[0])
  const [customPurpose, setCustomPurpose] = useState("")
  const [notes, setNotes] = useState("")
  const [paidAt, setPaidAt] = useState(new Date().toISOString().substring(0, 16))

  const [groupOptions, setGroupOptions] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    listGroups({ pageSize: 100 })
      .then((res) => {
        if (mounted && res?.groups) {
          setGroupOptions(res.groups.map((g) => ({ id: g.id, name: g.name })))
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!donorName.trim()) {
      setErrorMsg("Please enter contributor/donor name")
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0")
      return
    }

    const finalPurpose = purpose === "Other" && customPurpose.trim() ? customPurpose.trim() : purpose

    setIsSubmitting(true)
    try {
      const payload: ContributionManualInput = {
        amount: numAmount,
        donor_name: donorName.trim(),
        donor_phone: donorPhone.trim() || undefined,
        group_id: groupId || undefined,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        purpose: finalPurpose,
        notes: notes.trim() || undefined,
        paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
      }

      const res = await recordManualContribution(payload)
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to record contribution. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[95vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Heart className="h-5 w-5 fill-emerald-600 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Record New Contribution / दान दर्ज करें
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Donor Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Contributor / Member Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Shri Ramesh Shah"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Mobile Number
              </label>
              <input
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+91 98250 XXXXX"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Group & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Social Group (Optional)
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">General / Direct to Federation</option>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-bold text-emerald-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Payment Mode & Transaction ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash (नकद)</option>
                <option value="CHEQUE">Cheque (चेक)</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Transaction ID / Cheque / UTR No.
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UTR1234567 or Chq 89201"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Purpose & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Contribution Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {COMMON_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {purpose === "Other" && (
                <input
                  type="text"
                  required
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Specify custom purpose"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                Date & Time Received
              </label>
              <input
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
              Remarks / Memorial Note (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In loving memory of..., or special instructions"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save & Issue Receipt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
