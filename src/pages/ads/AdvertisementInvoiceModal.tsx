import { useRef } from "react"
import { Printer, X, Building, ShieldCheck, Megaphone } from "lucide-react"
import type { Advertisement } from "@/types"
import { formatCurrency, formatDate } from "@/lib/format"

interface AdvertisementInvoiceModalProps {
  ad: Advertisement | null
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

export function AdvertisementInvoiceModal({ ad, onClose }: AdvertisementInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  if (!ad) return null

  const amountVal = Number(ad.amount ?? ad.spend ?? 0)
  const isWaived = (ad.payment_status || "").toUpperCase() === "WAIVED" || amountVal === 0
  const amountInWords = isWaived ? "Fee Waived / Complimentary" : convertNumberToWords(amountVal)

  const handlePrint = () => {
    if (!invoiceRef.current) return
    const content = invoiceRef.current.innerHTML
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ad_Invoice_${ad.id.substring(0, 8)}</title>
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
              border: 2px solid #2563eb;
              border-radius: 8px;
              padding: 24px;
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 70px;
              font-weight: 900;
              color: rgba(37, 99, 235, 0.05);
              text-transform: uppercase;
              pointer-events: none;
              user-select: none;
              white-space: nowrap;
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

  const invoiceNo = `INV-AD-${ad.id.substring(0, 8).toUpperCase()}`
  const invoiceDate = ad.purchased_at
    ? formatDate(ad.purchased_at)
    : ad.created_at
    ? formatDate(ad.created_at)
    : formatDate(new Date().toISOString())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-blue-200 dark:bg-slate-900 dark:border-slate-800">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Advertisement Subscription Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
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
            ref={invoiceRef}
            className="rounded-lg border-2 border-blue-600/80 bg-white p-6 shadow-xs relative print:border-none print:shadow-none dark:bg-slate-900"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                <h1 className="text-lg sm:text-xl font-extrabold text-blue-900 tracking-wide uppercase dark:text-blue-300">
                  Jain Shwetamber Social Groups Federation
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Federation Media & Digital Advertisement Services
              </p>
              <div className="mt-2.5">
                <span className="inline-block rounded-full bg-blue-700 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  Advertisement Tax Invoice / Receipt
                </span>
              </div>
            </div>

            {/* Invoice & Transaction Meta */}
            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-200/60 text-xs mb-4 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice No:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-300 font-mono">
                    {invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice Date:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {invoiceDate}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Status:</span>
                  <span className={`font-bold uppercase ${isWaived ? "text-slate-600" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {isWaived ? "WAIVED (COMPLIMENTARY)" : "PAID (VERIFIED)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transaction Ref:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {ad.transaction_id || ad.payment_id || (isWaived ? "WAIVED" : "ONLINE-PAID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Advertiser & Campaign Info */}
            <div className="rounded-lg border border-slate-200 p-4 mb-4 bg-slate-50/40 text-xs sm:text-sm space-y-2.5 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Advertiser / Sponsor:
                </span>
                <span className="font-bold text-slate-900 text-sm sm:text-base dark:text-slate-100">
                  {ad.person_name || ad.personName || "Valued Advertiser"}
                </span>
              </div>

              {(ad.mobile_number || ad.mobileNumber) && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                    Contact Phone:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                    {ad.mobile_number || ad.mobileNumber}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Associated Group:
                </span>
                <span className="font-semibold text-blue-800 dark:text-blue-400">
                  {ad.group_name || ad.postBy || "General / Central Federation"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Advertisement Title:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {ad.title}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Placement & Category:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                  {ad.placement || "HOME_BANNER"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Subscription Duration:
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {ad.subscription_months || 1} Month(s) Campaign
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-44 font-semibold text-slate-500 dark:text-slate-400">
                  Active Campaign Period:
                </span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {formatDate(ad.start_date || ad.startDate || "")} &nbsp;to&nbsp; {formatDate(ad.end_date || ad.endDate || "")}
                </span>
              </div>
            </div>

            {/* Highlighted Amount Box */}
            <div className="rounded-lg border-2 border-dashed border-blue-600 bg-blue-50/70 p-4 mb-4 dark:bg-blue-950/20 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-800 dark:text-blue-400">
                    Total Amount:
                  </span>
                  <div className="text-xs italic font-medium text-blue-700 mt-1 dark:text-blue-300">
                    {amountInWords}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-200">
                  {isWaived ? "WAIVED" : formatCurrency(amountVal)}
                </div>
              </div>
            </div>

            {/* Signature & Note Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs dark:border-slate-800">
              <div className="space-y-1 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-blue-700 font-semibold dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified Commercial Voucher</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Thank you for promoting your business with Jain Shwetamber Social Groups Federation.
                  This digital invoice is computer-generated and valid for accounting and audit purposes.
                </p>
              </div>

              <div className="flex flex-col items-center justify-end text-center mt-4 sm:mt-0">
                <div className="h-10 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
                    [ JSSG MEDIA DIVISION ]
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
