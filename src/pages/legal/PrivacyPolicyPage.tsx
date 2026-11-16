import { ShieldCheck, Mail, Phone, MapPin, Calendar, Lock } from "lucide-react"
import { COMPANY_CONFIG } from "@/config/company"

export default function PrivacyPolicyPage() {
  return (
    <article className="bg-white rounded-2xl border border-[#e8e0ce] shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-[#123f24] to-[#1c5532] text-white p-6 sm:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#f1e6cb] mb-4">
          <ShieldCheck className="size-3.5 text-[#c5a84e]" />
          <span>Official Legal Compliance Document</span>
        </div>
        <h1 className="font-serif-display text-2xl sm:text-4xl font-bold tracking-tight text-[#fbf8f0]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#d4cbb8] max-w-2xl leading-relaxed">
          How {COMPANY_CONFIG.name} collects, protects, uses, and processes your personal and transaction data when you use our portal and services.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#c9bd9a]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Last Updated: {COMPANY_CONFIG.lastUpdated}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-emerald-400" />
            PCI-DSS &amp; SSL Compliant
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-10 space-y-8 text-sm text-foreground/85 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">1</span>
            Introduction &amp; Scope
          </h2>
          <p>
            Welcome to the official portal of <strong>{COMPANY_CONFIG.name}</strong> (&quot;Federation&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting the privacy, security, and integrity of personal information entrusted to us by member groups, individual members, patrons, event participants, and portal visitors.
          </p>
          <p>
            This Privacy Policy explains how we collect, store, utilize, disclose, and safeguard your personal details when you interact with our platform, register for membership, attend conventions, place community advertisements, or make online fee payments.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">2</span>
            Information We Collect
          </h2>
          <p>We collect only such information as is reasonably necessary to provide community management, directory services, membership verification, and event administration:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Personal Identifiable Information:</strong> Full name, father&apos;s/spouse&apos;s name, date of birth, gender, residential and business addresses, contact numbers, email addresses, and group/mandal affiliation.
            </li>
            <li>
              <strong>Membership &amp; Directory Data:</strong> Membership numbers, post/designation held, community seva contributions, and voluntary profile photographs.
            </li>
            <li>
              <strong>Payment &amp; Transaction Details:</strong> Transaction identifiers, payment amounts, dates, payment status, and purpose of fee (e.g., membership renewal, convention pass, banner advertisement).
            </li>
            <li>
              <strong>Technical Logs:</strong> IP address, device specifications, browser type, operating system, and login session timestamps for fraud prevention and audit compliance.
            </li>
          </ul>

          <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="size-4 text-emerald-700" />
              Special Note on Payment Information Security
            </p>
            <p>
              All online fee collections, donations, and advertisement payments are processed via our authorized payment gateway partner, <strong>Razorpay (Razorpay Software Private Limited)</strong>. <strong>{COMPANY_CONFIG.name} does not collect, hold, or store your credit/debit card numbers, CVV codes, UPI PINs, or net banking passwords</strong> on its servers. All payment handling adheres to the highest global PCI-DSS Level 1 standards through Razorpay.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">3</span>
            How We Use Your Information
          </h2>
          <p>We process your data strictly for legitimate community operations and statutory compliance, including:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Processing membership enrollment, renewals, verification, and group administration.</li>
            <li>Generating official payment receipts, digital invoices, and registration confirmations.</li>
            <li>Publishing internal community directories accessible only to authorized members.</li>
            <li>Sending notices regarding upcoming conventions, seva programs, elections, or regulatory announcements via email, SMS, or WhatsApp.</li>
            <li>Maintaining audited accounting books in compliance with Indian laws and tax obligations.</li>
            <li>Resolving member queries, grievance redressal, and technical support.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">4</span>
            Data Sharing &amp; Third-Party Disclosure
          </h2>
          <p>
            <strong>We do not sell, rent, commercialize, or trade personal data to any external advertising agencies or marketing companies.</strong> Data is shared only under strict confidential obligations with:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Authorized Payment Aggregators (Razorpay):</strong> Solely for the purpose of completing online transactions and processing approved refunds.
            </li>
            <li>
              <strong>Infrastructure &amp; Communication Providers:</strong> Certified cloud servers, transaction alert SMS gateways, and secure email dispatchers.
            </li>
            <li>
              <strong>Government or Legal Authorities:</strong> Only when legally mandated by court orders, judicial warrants, or law enforcement authorities under prevailing Indian statutes.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">5</span>
            Data Security &amp; Storage
          </h2>
          <p>
            We implement industry-grade technical and organizational safeguards to prevent accidental loss, unauthorized access, alteration, or unlawful disclosure of your personal data. These include 256-bit SSL/TLS encrypted data transmission, restricted access credentials, firewall protections, and regular administrative security audits.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">6</span>
            Data Retention &amp; Member Rights
          </h2>
          <p>
            Personal data is retained as long as a member or group retains active association with {COMPANY_CONFIG.name}, or as necessary to satisfy statutory audit requirements. Members have the right to inspect, update, or rectify their profile details by logging into the member portal or by submitting an official written request to our support desk.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">7</span>
            Grievance Redressal Officer
          </h2>
          <p>
            In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Officer are provided below:
          </p>
          <div className="rounded-xl border border-[#e3d8be] bg-[#fbf9f4] p-5 space-y-2 text-xs">
            <p className="font-semibold text-sm text-[#123f24]">{COMPANY_CONFIG.grievanceOfficer.title}</p>
            <p className="font-medium text-foreground">{COMPANY_CONFIG.name}</p>
            <div className="pt-1 space-y-1.5 text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="size-3.5 text-[#123f24] shrink-0 mt-0.5" />
                <span>{COMPANY_CONFIG.address.full}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5 text-[#123f24] shrink-0" />
                <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-[#123f24] hover:underline font-medium">
                  {COMPANY_CONFIG.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-3.5 text-[#123f24] shrink-0" />
                <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="text-[#123f24] hover:underline font-medium">
                  {COMPANY_CONFIG.phone}
                </a>
              </p>
              <p>Working Hours: {COMPANY_CONFIG.operatingHours}</p>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#123f24] flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#123f24]/10 text-xs font-bold text-[#123f24]">8</span>
            Changes to this Privacy Policy
          </h2>
          <p>
            We may periodically review and update this Privacy Policy to reflect modifications in our community practices or changes in statutory regulations. Any revisions will become effective immediately upon being posted on this page with the updated revision date.
          </p>
        </section>
      </div>
    </article>
  )
}
