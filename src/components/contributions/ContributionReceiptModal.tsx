import { useRef } from "react"
import { Printer, X, Heart, ShieldCheck } from "lucide-react"
import type { ContributionRecord } from "@/types"

interface ContributionReceiptModalProps {
  contribution: ContributionRecord | null
  onClose: () => void
}

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
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

const RECEIPT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }
  .rc-voucher-root {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .rc-voucher {
    width: 100%;
    max-width: 680px;
    background: #ffffff;
    border: 2px solid #047857;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    box-sizing: border-box;
    text-align: left;
  }
  .rc-top-stripe {
    height: 6px;
    background: linear-gradient(90deg, #047857 0%, #059669 65%, #d97706 100%);
    width: 100%;
  }
  .rc-body {
    padding: 22px 26px;
    position: relative;
    box-sizing: border-box;
  }
  .rc-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 56px;
    font-weight: 900;
    color: rgba(4, 120, 87, 0.035);
    text-transform: uppercase;
    letter-spacing: 5px;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    z-index: 0;
    font-family: inherit;
  }
  .rc-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 2px solid #047857;
  }
  .rc-logo-col {
    width: 58px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rc-logo-img {
    max-height: 58px;
    max-width: 58px;
    object-fit: contain;
  }
  .rc-hand-col {
    width: 50px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rc-hand-img {
    max-height: 50px;
    max-width: 44px;
    object-fit: contain;
    opacity: 0.9;
  }
  .rc-title-col {
    flex: 1;
    text-align: center;
  }
  .rc-org-title {
    font-size: 18px;
    font-weight: 800;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.25;
    margin: 0 0 2px 0;
  }
  .rc-org-hindi {
    font-size: 13px;
    font-weight: 600;
    color: #047857;
    margin: 0 0 2px 0;
  }
  .rc-org-tagline {
    font-size: 10.5px;
    color: #64748b;
    font-weight: 500;
    margin: 0;
  }
  .rc-badge-row {
    text-align: center;
    margin-top: 12px;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
  }
  .rc-badge-pill {
    display: inline-block;
    background: #047857;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 3.5px 18px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .rc-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
    font-size: 12px;
  }
  .rc-meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .rc-meta-label {
    color: #64748b;
    font-weight: 500;
  }
  .rc-meta-value {
    font-weight: 700;
    color: #0f172a;
  }
  .rc-meta-value.highlight {
    color: #047857;
  }
  .rc-meta-value.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
  }
  .rc-badge-mode {
    background: #dcfce7;
    color: #15803d;
    font-weight: 700;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    border: 1px solid #bbf7d0;
  }
  .rc-details-box {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 14px;
    background: #ffffff;
    position: relative;
    z-index: 1;
  }
  .rc-details-heading {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #047857;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 5px;
    margin-bottom: 8px;
  }
  .rc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }
  .rc-table tr {
    border-bottom: 1px dashed #f1f5f9;
  }
  .rc-table tr:last-child {
    border-bottom: none;
  }
  .rc-table td {
    padding: 5px 0;
    vertical-align: top;
  }
  .rc-td-key {
    width: 175px;
    color: #64748b;
    font-weight: 600;
    font-size: 12px;
  }
  .rc-td-sep {
    width: 14px;
    color: #94a3b8;
    font-weight: bold;
  }
  .rc-td-val {
    color: #1e293b;
    font-weight: 600;
  }
  .rc-donor-name {
    font-size: 14px;
    font-weight: 750;
    color: #0f172a;
  }
  .rc-group-val {
    color: #047857;
    font-weight: 700;
  }
  .rc-notes-val {
    font-style: italic;
    color: #475569;
    font-weight: normal;
  }
  .rc-amount-card {
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    border: 1.5px solid #059669;
    border-radius: 6px;
    padding: 10px 16px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .rc-amount-left {
    flex: 1;
    padding-right: 12px;
  }
  .rc-amount-lbl {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #047857;
    margin-bottom: 2px;
  }
  .rc-amount-words {
    font-size: 12px;
    font-weight: 600;
    color: #065f46;
    font-style: italic;
  }
  .rc-amount-num {
    font-size: 22px;
    font-weight: 800;
    color: #065f46;
    white-space: nowrap;
  }
  .rc-footer-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    position: relative;
    z-index: 1;
  }
  .rc-auth-left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .rc-auth-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #047857;
    font-weight: 700;
    font-size: 11px;
    margin-bottom: 4px;
  }
  .rc-auth-icon {
    width: 14px;
    height: 14px;
    display: inline-block;
    vertical-align: middle;
  }
  .rc-disclaimer {
    font-size: 9.5px;
    color: #64748b;
    line-height: 1.4;
    margin: 0;
  }
  .rc-sign-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: flex-end;
  }
  .rc-for-org {
    font-size: 9.5px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
  }
  .rc-seal-circle {
    width: 58px;
    height: 58px;
    border: 1.5px dashed #059669;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(4, 120, 87, 0.03);
    margin: 2px 0 4px 0;
  }
  .rc-seal-star {
    font-size: 6px;
    color: #d97706;
    line-height: 1;
  }
  .rc-seal-text {
    font-size: 6.5px;
    font-weight: 800;
    color: #047857;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    text-align: center;
  }
  .rc-sign-line {
    width: 150px;
    border-top: 1px dashed #94a3b8;
    padding-top: 3px;
    font-size: 10.5px;
    font-weight: 700;
    color: #334155;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .rc-voucher {
      max-width: 100% !important;
      width: 100% !important;
      box-shadow: none !important;
      border: 2px solid #047857 !important;
      border-radius: 4px !important;
      page-break-inside: avoid !important;
    }
  }
`

function generateReceiptHtml(
  contribution: ContributionRecord,
  formattedDate: string,
  amountInWords: string,
  logoUrl: string,
  handIconUrl: string
): string {
  const receiptNo =
    contribution.receipt_no ||
    contribution.order_id ||
    (contribution.id ? `REC-${contribution.id.substring(0, 8).toUpperCase()}` : "REC-JSSG-001")

  const donorName =
    contribution.member_name ||
    contribution.donor_name ||
    "Respected Community Contributor"

  return `
    <div class="rc-voucher-root">
      <div class="rc-voucher">
        <div class="rc-top-stripe"></div>
        <div class="rc-body">
          <div class="rc-watermark">JSSG FEDERATION</div>

          <!-- Letterhead Header -->
          <div class="rc-header">
            <div class="rc-logo-col">
              <img src="${logoUrl}" alt="JSSG Logo" class="rc-logo-img" onerror="this.style.display='none'" />
            </div>
            <div class="rc-title-col">
              <h1 class="rc-org-title">Jain Shwetamber Social Groups Federation</h1>
              <div class="rc-org-hindi">जैन श्वेतांबर सोशल ग्रुप्स फेडरेशन</div>
              <p class="rc-org-tagline">Apex Body of Jain Social Groups | Registered Non-Profit Federation</p>
            </div>
            <div class="rc-hand-col">
              <img src="${handIconUrl}" alt="Ahimsa" class="rc-hand-img" onerror="this.style.display='none'" />
            </div>
          </div>

          <!-- Receipt Badge -->
          <div class="rc-badge-row">
            <span class="rc-badge-pill">Contribution Acknowledgement Receipt</span>
          </div>

          <!-- Receipt & Transaction Meta -->
          <div class="rc-meta-grid">
            <div class="rc-meta-item">
              <span class="rc-meta-label">Receipt No:</span>
              <span class="rc-meta-value highlight mono">${escapeHtml(receiptNo)}</span>
            </div>
            <div class="rc-meta-item">
              <span class="rc-meta-label">Date &amp; Time:</span>
              <span class="rc-meta-value">${escapeHtml(formattedDate)}</span>
            </div>
            <div class="rc-meta-item">
              <span class="rc-meta-label">Transaction ID:</span>
              <span class="rc-meta-value mono">${escapeHtml(contribution.transaction_id || "N/A")}</span>
            </div>
            <div class="rc-meta-item">
              <span class="rc-meta-label">Payment Mode:</span>
              <span class="rc-meta-value">
                <span class="rc-badge-mode">${escapeHtml(contribution.payment_method || "ONLINE")}</span>
              </span>
            </div>
          </div>

          <!-- Contributor Details Table -->
          <div class="rc-details-box">
            <div class="rc-details-heading">Donor &amp; Contribution Details</div>
            <table class="rc-table">
              <tbody>
                <tr>
                  <td class="rc-td-key">Received with thanks from</td>
                  <td class="rc-td-sep">:</td>
                  <td class="rc-td-val rc-donor-name">${escapeHtml(donorName)}</td>
                </tr>
                ${
                  contribution.donor_phone
                    ? `<tr>
                        <td class="rc-td-key">Contact / Mobile</td>
                        <td class="rc-td-sep">:</td>
                        <td class="rc-td-val">${escapeHtml(contribution.donor_phone)}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td class="rc-td-key">Social Group</td>
                  <td class="rc-td-sep">:</td>
                  <td class="rc-td-val rc-group-val">${escapeHtml(contribution.group_name || "JSSG Federation General")}</td>
                </tr>
                <tr>
                  <td class="rc-td-key">Contribution Purpose</td>
                  <td class="rc-td-sep">:</td>
                  <td class="rc-td-val">${escapeHtml(contribution.purpose || "Federation Contribution")}</td>
                </tr>
                ${
                  contribution.notes
                    ? `<tr>
                        <td class="rc-td-key">Remarks / Notes</td>
                        <td class="rc-td-sep">:</td>
                        <td class="rc-td-val rc-notes-val">${escapeHtml(contribution.notes)}</td>
                      </tr>`
                    : ""
                }
              </tbody>
            </table>
          </div>

          <!-- Amount Highlight Box -->
          <div class="rc-amount-card">
            <div class="rc-amount-left">
              <div class="rc-amount-lbl">Total Amount Received</div>
              <div class="rc-amount-words">${escapeHtml(amountInWords)}</div>
            </div>
            <div class="rc-amount-num">&#8377; ${Number(contribution.amount).toLocaleString("en-IN")}/-</div>
          </div>

          <!-- Footer & Authentication -->
          <div class="rc-footer-row">
            <div class="rc-auth-left">
              <div class="rc-auth-pill">
                <svg class="rc-auth-icon" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Verified &amp; Authenticated</span>
              </div>
              <p class="rc-disclaimer">
                Thank you for your noble support towards Jain Shwetamber Social Groups Federation initiatives.
                This is an official computer-generated receipt issued by the Federation and valid without physical signature.
              </p>
            </div>

            <div class="rc-sign-right">
              <div class="rc-for-org">For JSSG FEDERATION</div>
              <div class="rc-seal-circle">
                <span class="rc-seal-star">&#9733; &#9733; &#9733;</span>
                <span class="rc-seal-text">OFFICIAL<br/>DIGITAL SEAL</span>
                <span class="rc-seal-star">&#9733; JSSG &#9733;</span>
              </div>
              <div class="rc-sign-line">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
}

export function ContributionReceiptModal({
  contribution,
  onClose,
}: ContributionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!contribution) return null

  const formattedDate = contribution.paid_at
    ? new Date(contribution.paid_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : contribution.created_at
    ? new Date(contribution.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A"

  const amountInWords = convertNumberToWords(contribution.amount)

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) {
      window.print()
      return
    }

    const origin = window.location.origin
    const logoUrl = `${origin}/jssg_logo.png`
    const handIconUrl = `${origin}/hand_icon.png`
    const receiptHtml = generateReceiptHtml(contribution, formattedDate, amountInWords, logoUrl, handIconUrl)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Receipt_${contribution.receipt_no || contribution.id}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            ${RECEIPT_STYLES}
          </style>
        </head>
        <body>
          ${receiptHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <style>{RECEIPT_STYLES}</style>

      <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col rounded-xl bg-slate-100 shadow-2xl overflow-hidden border border-slate-300 dark:bg-slate-900 dark:border-slate-800">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-emerald-200/60 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Heart className="h-5 w-5 fill-emerald-600 text-emerald-600" />
            <h3 className="font-semibold text-sm">Official Contribution Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/70 dark:bg-slate-950/80">
          <div
            ref={receiptRef}
            className="w-full flex justify-center"
            dangerouslySetInnerHTML={{
              __html: generateReceiptHtml(
                contribution,
                formattedDate,
                amountInWords,
                "/jssg_logo.png",
                "/hand_icon.png"
              ),
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Computer-generated valid receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
