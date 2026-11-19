import { useRef } from "react"
import { Printer, X, Building, ShieldCheck, Heart } from "lucide-react"
import type { ContributionRecord } from "@/types"

interface ContributionReceiptModalProps {
  contribution: ContributionRecord | null
  onClose: () => void
}

function convertNumberToWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only"

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen ",
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    const digit = n % 10
    return b[Math.floor(n / 10)] + (digit ? "-" + a[digit].trim() : "") + " "
  }

  let words = ""
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  const hundred = Math.floor(num / 100)
  num %= 100

  if (crore > 0) words += inWords(crore) + "Crore "
  if (lakh > 0) words += inWords(lakh) + "Lakh "
  if (thousand > 0) words += inWords(thousand) + "Thousand "
  if (hundred > 0) words += inWords(hundred) + "Hundred "
  if (num > 0) {
    if (words !== "") words += "and "
    words += inWords(num)
  }

  return words.trim() + " Rupees Only"
}

export function ContributionReceiptModal({
  contribution,
  onClose,
}: ContributionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!contribution) return null

  const handlePrint = () => {
    if (!receiptRef.current) return
    const content = receiptRef.current.innerHTML
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${contribution.receipt_no || contribution.id}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #111827;
              margin: 0;
              padding: 10px;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              max-width: 750px;
              margin: 0 auto;
              border: 2px solid #047857;
              border-radius: 8px;
              padding: 24px;
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 80px;
              font-weight: 900;
              color: rgba(4, 120, 87, 0.05);
              text-transform: uppercase;
              pointer-events: none;
              user-select: none;
              white-space: nowrap;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #047857;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #065f46;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 4px 0;
            }
            .subtitle {
              font-size: 13px;
              color: #4b5563;
              margin: 0 0 6px 0;
            }
            .receipt-badge {
              display: inline-block;
              background-color: #047857;
              color: #ffffff;
              font-size: 13px;
              font-weight: 700;
              padding: 4px 16px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
              padding: 12px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              font-size: 13px;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }
            .meta-label {
              color: #6b7280;
              font-weight: 500;
            }
            .meta-value {
              font-weight: 700;
              color: #111827;
            }
            .section-box {
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 16px;
              margin-bottom: 20px;
              background-color: #ffffff;
            }
            .row-item {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              line-height: 1.5;
            }
            .row-label {
              width: 170px;
              font-weight: 600;
              color: #4b5563;
            }
            .row-value {
              flex: 1;
              color: #111827;
              font-weight: 600;
            }
            .amount-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border: 2px dashed #059669;
              border-radius: 8px;
              padding: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .amount-number {
              font-size: 26px;
              font-weight: 800;
              color: #065f46;
            }
            .amount-words {
              font-size: 13px;
              font-weight: 600;
              color: #047857;
              font-style: italic;
              margin-top: 4px;
            }
            .footer-grid {
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 20px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .note {
              font-size: 11px;
              color: #6b7280;
              line-height: 1.4;
            }
            .sign-box {
              text-align: center;
            }
            .sign-line {
              border-top: 1px dashed #9ca3af;
              margin-top: 45px;
              padding-top: 6px;
              font-size: 12px;
              font-weight: 700;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="watermark">JSSG FEDERATION</div>
            ${content}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const formattedDate = contribution.paid_at
    ? new Date(contribution.paid_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A"

  const amountInWords = convertNumberToWords(contribution.amount)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-emerald-200 dark:bg-slate-900 dark:border-slate-800">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Heart className="h-5 w-5 fill-emerald-600 text-emerald-600" />
            <h3 className="font-semibold text-sm">Official Contribution Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="overflow-y-auto p-6 text-slate-800 dark:text-slate-200">
          <div
            ref={receiptRef}
            className="rounded-lg border-2 border-emerald-700/80 bg-white p-6 shadow-xs relative print:border-none print:shadow-none dark:bg-slate-900"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-emerald-700 pb-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                <h1 className="text-lg sm:text-xl font-extrabold text-emerald-900 tracking-wide uppercase dark:text-emerald-300">
                  Jain Shwetamber Social Groups Federation
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apex Body of Jain Social Groups | Registered Non-Profit Federation
              </p>
              <div className="mt-2.5">
                <span className="inline-block rounded-full bg-emerald-700 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  Contribution Acknowledgement Receipt
                </span>
              </div>
            </div>

            {/* Receipt & Transaction Meta */}
            <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/60 text-xs mb-4 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Receipt No:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {contribution.receipt_no || `REC-${contribution.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {contribution.transaction_id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                    {contribution.payment_method || "ONLINE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributor & Group Info */}
            <div className="rounded-lg border border-slate-200 p-4 mb-4 bg-slate-50/40 text-xs sm:text-sm space-y-2 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 font-semibold text-slate-500 dark:text-slate-400">
                  Received with thanks from:
                </span>
                <span className="font-bold text-slate-900 text-sm sm:text-base dark:text-slate-100">
                  {contribution.member_name || contribution.donor_name || "Respected Community Contributor"}
                </span>
              </div>

              {contribution.donor_phone && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-40 font-semibold text-slate-500 dark:text-slate-400">
                    Contact / Mobile:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {contribution.donor_phone}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 font-semibold text-slate-500 dark:text-slate-400">
                  Social Group:
                </span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {contribution.group_name || "Federation General"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 font-semibold text-slate-500 dark:text-slate-400">
                  Contribution Purpose:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {contribution.purpose || "General Community Welfare"}
                </span>
              </div>

              {contribution.notes && (
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <span className="w-40 font-semibold text-slate-500 dark:text-slate-400">
                    Remarks / Notes:
                  </span>
                  <span className="font-normal italic text-slate-600 dark:text-slate-300">
                    {contribution.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Highlighted Amount Box */}
            <div className="rounded-lg border-2 border-dashed border-emerald-600 bg-emerald-50/70 p-4 mb-4 dark:bg-emerald-950/20 dark:border-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-400">
                    Total Amount Received:
                  </span>
                  <div className="text-xs italic font-medium text-emerald-700 mt-1 dark:text-emerald-300">
                    {amountInWords}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200">
                  ₹{Number(contribution.amount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Signature & Note Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs dark:border-slate-800">
              <div className="space-y-1 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified & Authenticated</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Thank you for your noble support towards Jain Shwetamber Social Groups Federation initiatives.
                  This is a computer-generated voucher valid without physical signature.
                </p>
              </div>

              <div className="flex flex-col items-center justify-end text-center mt-4 sm:mt-0">
                <div className="h-10 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
                    [ JSSG FEDERATION ]
                  </span>
                </div>
                <div className="w-44 border-t border-dashed border-slate-400 pt-1 font-bold text-slate-700 text-xs dark:text-slate-300">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
