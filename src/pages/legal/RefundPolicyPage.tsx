import { RotateCcw, AlertCircle, CheckCircle2, Clock, PackageCheck, Calendar } from "lucide-react"
import { COMPANY_CONFIG } from "@/config/company"

export default function RefundPolicyPage() {
  return (
    <article className="bg-white rounded-2xl border border-[#e8e0ce] shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-[#123f24] to-[#1c5532] text-white p-6 sm:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#f1e6cb] mb-4">
          <RotateCcw className="size-3.5 text-[#c5a84e]" />
          <span>Transparent Cancellation &amp; Settlement Terms</span>
        </div>
        <h1 className="font-serif-display text-2xl sm:text-4xl font-bold tracking-tight text-[#fbf8f0]">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#d4cbb8] max-w-2xl leading-relaxed">
          Clear guidelines on transaction cancellations, return of duplicate debits, and processing timelines for {COMPANY_CONFIG.name}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#c9bd9a]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Last Updated: {COMPANY_CONFIG.lastUpdated}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-emerald-400" />
            Refund Settlement Window: 5–7 Working Days
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-10 space-y-8 text-sm text-foreground/85 leading-relaxed">
        {/* Highlight Card for Razorpay Reviewer */}
        <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/70 p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-base">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            Key Policy Summary at a Glance
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-emerald-900">
            <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
              <p className="font-semibold text-emerald-950">Refund Processing Time</p>
              <p className="mt-1">5 to 7 Working Days to the original payment source.</p>
            </div>
            <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
              <p className="font-semibold text-emerald-950">Cancellation Request Window</p>
              <p className="mt-1">Within 7 days of transaction for eligible queries.</p>
            </div>
            <div className="rounded-lg bg-white/80 p-3 border border-emerald-200">
              <p className="font-semibold text-emerald-950">Delivery Mode</p>
              <p className="mt-1">Instant electronic delivery via email and portal.</p>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">1</span>
            General Policy Overview
          </h2>
          <p>
            <strong>{COMPANY_CONFIG.name}</strong> (&quot;Federation&quot;) operates as a social community umbrella organization. All monetary transactions conducted on this portal—including annual member affiliations, convention delegate registrations, group levies, and portal advertisement postings—are utilized to support community governance, seva programs, and technical operations.
          </p>
          <p>
            We strive to provide complete transparency and fair resolution for all financial contributions and payments made through our integrated Razorpay payment gateway.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">2</span>
            Eligibility for Refunds &amp; Cancellation
          </h2>
          <p>Refunds and cancellations are entertained under the following specific circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Duplicate or Multiple Deductions:</strong> If due to a technical glitch, network delay, or browser timeout, your bank account or card is charged more than once for the same membership, registration, or advertisement order.
            </li>
            <li>
              <strong>Failed Registration / Transaction Mismatch:</strong> Where the payment is debited from your account via Razorpay, but the corresponding membership renewal or event registration could not be generated on our portal system.
            </li>
            <li>
              <strong>Event / Convention Cancellation by Federation:</strong> In the rare event that an official federation event or convention is cancelled or called off by the organizing committee, eligible registered attendees will receive a full refund of entry registration fees.
            </li>
            <li>
              <strong>Unapproved / Rejected Group Application:</strong> If a new group or member affiliation application is rejected by the review board during verification, any pre-deposited affiliation dues will be refunded in full.
            </li>
          </ul>

          <div className="rounded-xl border border-amber-600/20 bg-amber-50/60 p-4 text-xs text-amber-950 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-amber-900">
              <AlertCircle className="size-4 text-amber-700" />
              Non-Refundable Circumstances
            </p>
            <p>
              Voluntary membership resignations after official approval, voluntary non-attendance of scheduled events without prior written notice, voluntary charitable donations (seva fund), and banner advertisements once reviewed, approved, and published live on the portal are non-refundable.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">3</span>
            How to Request a Refund / Cancellation
          </h2>
          <p>
            To initiate a cancellation or claim a refund for an eligible transaction, please notify our accounts desk within <strong>7 calendar days</strong> from the date of the transaction:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Send an email to{" "}
              <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-[#123f24] font-semibold underline">
                {COMPANY_CONFIG.email}
              </a>{" "}
              with the subject line: <code>&quot;Refund Request - [Your Name / Group Name] - [Razorpay Payment ID]&quot;</code>.
            </li>
            <li>
              Attach proof of payment, including the bank debited statement snapshot or Razorpay transaction receipt showing the Transaction ID, Date, and Amount.
            </li>
            <li>Provide a concise explanation of the reason for the refund request.</li>
          </ol>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">4</span>
            Refund Processing Mode &amp; Timeline
          </h2>
          <div className="p-4 rounded-xl border border-[#e3d8be] bg-[#fbf9f4] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#123f24]">
              <Clock className="size-4 text-[#123f24]" />
              Standard Settlement Timeline: 5 to 7 Working Days
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <strong>Verification:</strong> Our finance team reviews submitted claims within <strong>2 business days</strong> of receipt.
              </li>
              <li>
                <strong>Settlement Mode:</strong> All approved refunds are processed directly back to the <strong>original source of payment</strong> (Credit Card, Debit Card, Net Banking, UPI, or Wallet) through the Razorpay payment gateway API.
              </li>
              <li>
                <strong>Credit to Account:</strong> Once initiated, the refunded amount typically reflects in the customer&apos;s bank account or card balance within <strong>5 to 7 working days</strong>, subject to the card issuing bank&apos;s settlement schedule.
              </li>
              <li>No cash or bearer cheque refunds are issued under any circumstances.</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Shipping & Delivery Policy */}
        <section id="shipping" className="space-y-3 scroll-mt-24 pt-4 border-t border-[#ede5d4]">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">5</span>
            Shipping, Delivery &amp; Digital Fulfillment Policy
          </h2>
          <div className="rounded-xl border border-blue-500/20 bg-blue-50/60 p-4 text-xs text-blue-950 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-900">
              <PackageCheck className="size-4 text-blue-700" />
              Digital Delivery Commitment
            </div>
            <p>
              {COMPANY_CONFIG.name} is a socio-cultural non-profit federation that provides digital platform services, annual memberships, convention registrations, and community notices.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>No Physical Goods:</strong> We do not sell or deliver physical merchandise, couriered products, or tangible inventory. Hence, physical courier transit times and shipping freight charges are not applicable.
            </li>
            <li>
              <strong>Instant Digital Delivery:</strong> All membership acknowledgements, payment receipts, event badges, and advertisement placements are delivered electronically to the user&apos;s verified email address and are instantly accessible inside their authenticated portal dashboard.
            </li>
            <li>
              <strong>Delivery Timeline:</strong> Electronic confirmations are dispatched immediately upon receipt of successful payment confirmation from Razorpay (typically within 1 to 5 minutes).
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 pt-4 border-t border-[#ede5d4]">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">6</span>
            Contact Accounts &amp; Refund Desk
          </h2>
          <p>
            For any queries, escalations, or follow-ups regarding your pending refunds or cancellations, please contact:
          </p>
          <div className="rounded-xl border border-[#e3d8be] bg-[#fbf9f4] p-4 text-xs space-y-1">
            <p className="font-semibold text-[#123f24]">Accounts &amp; Settlement Team — {COMPANY_CONFIG.name}</p>
            <p className="text-muted-foreground">{COMPANY_CONFIG.address.full}</p>
            <p className="text-muted-foreground">
              Email:{" "}
              <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-[#123f24] font-medium underline">
                {COMPANY_CONFIG.email}
              </a>{" "}
              | Helpline:{" "}
              <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="text-[#123f24] font-medium">
                {COMPANY_CONFIG.phone}
              </a>
            </p>
            <p className="text-muted-foreground">Operating Hours: {COMPANY_CONFIG.operatingHours}</p>
          </div>
        </section>
      </div>
    </article>
  )
}
