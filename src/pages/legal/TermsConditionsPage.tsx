import { FileText, CreditCard, Scale, CheckCircle2, Calendar } from "lucide-react"
import { COMPANY_CONFIG } from "@/config/company"

export default function TermsConditionsPage() {
  return (
    <article className="bg-white rounded-2xl border border-[#e8e0ce] shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#123f24] to-[#1c5532] text-white p-6 sm:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#f1e6cb] mb-4">
          <FileText className="size-3.5 text-[#c5a84e]" />
          <span>User Agreement &amp; Operating Guidelines</span>
        </div>
        <h1 className="font-serif-display text-2xl sm:text-4xl font-bold tracking-tight text-[#fbf8f0]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#d4cbb8] max-w-2xl leading-relaxed">
          Please review these terms and conditions carefully before utilizing the {COMPANY_CONFIG.name} portal, services, and online payment facilities.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#c9bd9a]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Last Updated: {COMPANY_CONFIG.lastUpdated}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Scale className="size-3.5 text-emerald-400" />
            Governing Law: Republic of India
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-10 space-y-8 text-sm text-foreground/85 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">1</span>
            Acceptance of Terms
          </h2>
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Member&quot;, or &quot;Visitor&quot;) and <strong>{COMPANY_CONFIG.name}</strong> (&quot;Federation&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          </p>
          <p>
            By accessing or browsing this website, logging into the member/admin panel, applying for group registration, or initiating any monetary transaction (including membership dues, event registrations, or advertisement bookings), you acknowledge that you have read, understood, and agree to be bound by these Terms and our related policies.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">2</span>
            Eligibility &amp; User Account Responsibilities
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              You must be at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872.
            </li>
            <li>
              You agree to provide true, accurate, current, and complete details during member enrollment, registration forms, and directory updates.
            </li>
            <li>
              Users and administrators granted portal credentials are solely responsible for maintaining the confidentiality of their passwords and account security. Any activity occurring under your authenticated session is your responsibility.
            </li>
            <li>
              You must immediately notify {COMPANY_CONFIG.name} of any unauthorized use or security compromise of your login account.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">3</span>
            Online Fees, Payments &amp; Razorpay Gateway
          </h2>
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-4 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <CreditCard className="size-4 text-amber-700" />
              Payment Gateway Terms
            </div>
            <p>
              All online fee collections, subscriptions, registrations, and advertisement charges on this website are routed via our authorized online payment gateway partner, <strong>Razorpay</strong>.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              All tariffs, membership charges, and fees are stated in <strong>Indian National Rupees (INR ₹)</strong>. Applicable statutory taxes or banking surcharge (if any) will be shown prior to completing payment.
            </li>
            <li>
              You represent and warrant that you are legally authorized to utilize the payment method (Credit Card, Debit Card, Net Banking, UPI, or Wallets) chosen during transaction checkout.
            </li>
            <li>
              In the event of a transaction failure where funds are deducted from your bank account without receiving a registration or payment receipt, the debited sum is automatically reversed by the banking network / Razorpay as per standard banking turnaround cycles.
            </li>
            <li>
              Official digital receipts are generated instantly upon successful confirmation by the payment gateway and are sent to your registered email/mobile.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">4</span>
            Digital Service Delivery &amp; Fulfilment
          </h2>
          <p>
            {COMPANY_CONFIG.name} offers community administration, membership affiliation, event entry passes, and promotional banner slots.
          </p>
          <div className="p-4 rounded-xl bg-[#f8f5ed] border border-[#e5dcce] space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#123f24]">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Instant Electronic Delivery
            </div>
            <p>
              No physical goods are shipped. All services, membership recognitions, convention tickets, and digital invoices are delivered electronically via email, SMS, and are accessible directly from the portal dashboard immediately upon successful payment verification.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">5</span>
            Code of Conduct &amp; Prohibited Actions
          </h2>
          <p>When using this portal, users and group administrators explicitly agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Submit inaccurate, defamatory, offensive, or counterfeit membership and KYC details.</li>
            <li>Attempt unauthorized access, penetration testing, reverse engineering, or disruption of portal infrastructure.</li>
            <li>Use the community directory for unsolicited mass spamming, predatory commercial marketing, or fraudulent solicitations.</li>
            <li>Circumvent or tamper with security controls or payment gateway integration points.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">6</span>
            Intellectual Property Rights
          </h2>
          <p>
            All content, brand insignia, logos, graphical assets, directory layouts, and proprietary software comprising the {COMPANY_CONFIG.name} portal are the exclusive intellectual property of <strong>{COMPANY_CONFIG.name}</strong> or its licensors. Unauthorized copying, reproduction, or redistribution is strictly prohibited.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">7</span>
            Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            The portal and all associated tools are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, whether express or implied. While we strive to maintain uninterrupted uptime and data accuracy, {COMPANY_CONFIG.name} shall not be held liable for temporary interruptions, network delays, or banking communication lapses beyond our reasonable control.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">8</span>
            Governing Law &amp; Dispute Resolution
          </h2>
          <p>
            These Terms shall be governed, construed, and enforced exclusively in accordance with the laws of the <strong>Republic of India</strong>. In the event of any dispute, claim, or controversy arising out of or relating to these Terms or portal transactions, the competent courts situated in <strong>{COMPANY_CONFIG.jurisdiction}</strong> shall have exclusive legal jurisdiction.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">9</span>
            Contact &amp; Assistance
          </h2>
          <p>
            If you have questions or require clarifications regarding these Terms &amp; Conditions, please reach out to our official desk:
          </p>
          <div className="rounded-xl border border-[#e3d8be] bg-[#fbf9f4] p-4 text-xs space-y-1">
            <p className="font-semibold text-[#123f24]">{COMPANY_CONFIG.name}</p>
            <p className="text-muted-foreground">{COMPANY_CONFIG.address.full}</p>
            <p className="text-muted-foreground">
              Email:{" "}
              <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-[#123f24] font-medium underline">
                {COMPANY_CONFIG.email}
              </a>{" "}
              | Phone:{" "}
              <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="text-[#123f24] font-medium">
                {COMPANY_CONFIG.phone}
              </a>
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
