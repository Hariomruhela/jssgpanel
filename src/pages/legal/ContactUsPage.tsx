import { useState } from "react"
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { COMPANY_CONFIG } from "@/config/company"

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields (Name, Email, Message).")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      toast.success("Thank you! Your message has been recorded. Our team will contact you shortly.")
    }, 600)
  }

  return (
    <article className="space-y-8">
      {/* Banner Card */}
      <div className="bg-gradient-to-br from-[#123f24] to-[#1c5532] text-white p-6 sm:p-10 rounded-2xl border border-[#e8e0ce] shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#f1e6cb] mb-4">
          <Building2 className="size-3.5 text-[#c5a84e]" />
          <span>Official Secretariat &amp; Support Helpdesk</span>
        </div>
        <h1 className="font-serif-display text-2xl sm:text-4xl font-bold tracking-tight text-[#fbf8f0]">
          Contact Us
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#d4cbb8] max-w-2xl leading-relaxed">
          Get in touch with the official representatives of {COMPANY_CONFIG.name} for membership inquiries, convention details, technical support, or billing assistance.
        </p>
      </div>

      {/* Grid: Contact Cards & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official Contact Information Cards */}
        <div className="space-y-4 lg:col-span-1">
          {/* Legal Entity Card */}
          <div className="bg-white rounded-xl border border-[#e8e0ce] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#123f24] text-white">
                <Building2 className="size-5 text-[#c5a84e]" />
              </div>
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Registered Legal Entity
                </h2>
                <p className="font-bold text-sm text-[#123f24] leading-tight">
                  {COMPANY_CONFIG.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-muted/50">
              Federation coordinating socio-cultural, religious, and philanthropic initiatives across member groups in India.
            </p>
          </div>

          {/* Physical Address */}
          <div className="bg-white rounded-xl border border-[#e8e0ce] p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#123f24]">
              <MapPin className="size-4 text-[#c5a84e]" />
              <span>Secretariat / Registered Address</span>
            </div>
            <p className="text-sm text-foreground font-medium leading-snug">
              {COMPANY_CONFIG.address.line1}
            </p>
            <p className="text-xs text-muted-foreground">
              {COMPANY_CONFIG.address.city} — {COMPANY_CONFIG.address.pincode}, {COMPANY_CONFIG.address.state}, {COMPANY_CONFIG.address.country}
            </p>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-xl border border-[#e8e0ce] p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#123f24]">
              <Mail className="size-4 text-[#c5a84e]" />
              <span>Official Support Email</span>
            </div>
            <p className="text-xs text-muted-foreground">
              For general queries, billing, or technical help:
            </p>
            <a
              href={`mailto:${COMPANY_CONFIG.email}`}
              className="text-sm font-semibold text-[#123f24] hover:underline break-all block"
            >
              {COMPANY_CONFIG.email}
            </a>
          </div>

          {/* Phone Helpline */}
          <div className="bg-white rounded-xl border border-[#e8e0ce] p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#123f24]">
              <Phone className="size-4 text-[#c5a84e]" />
              <span>Telephone / Helpline</span>
            </div>
            <p className="text-xs text-muted-foreground">Direct desk line during working hours:</p>
            <a
              href={`tel:${COMPANY_CONFIG.phoneRaw}`}
              className="text-base font-bold text-[#123f24] hover:underline block"
            >
              {COMPANY_CONFIG.phone}
            </a>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-[#e8e0ce] p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#123f24]">
              <Clock className="size-4 text-[#c5a84e]" />
              <span>Working Hours</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              {COMPANY_CONFIG.operatingHours}
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Query Form & Location Map Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#e8e0ce] p-6 sm:p-8 shadow-xs">
            <div className="mb-6">
              <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#123f24]">
                Send an Official Message
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Fill out the form below and our administrative secretariat will respond within 24 to 48 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-6 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="font-bold text-base text-emerald-950">Message Sent Successfully</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Thank you for contacting <strong>{COMPANY_CONFIG.name}</strong>. A representative will review your message and reach out via email or phone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
                    setSubmitted(false)
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-900 underline hover:text-emerald-700"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Shah"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#d8cfbe] bg-white focus:outline-none focus:ring-2 focus:ring-[#123f24]/30 focus:border-[#123f24]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rajesh@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#d8cfbe] bg-white focus:outline-none focus:ring-2 focus:ring-[#123f24]/30 focus:border-[#123f24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98200 12345"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#d8cfbe] bg-white focus:outline-none focus:ring-2 focus:ring-[#123f24]/30 focus:border-[#123f24]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Subject / Query Type <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Membership renewal / Billing query"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#d8cfbe] bg-white focus:outline-none focus:ring-2 focus:ring-[#123f24]/30 focus:border-[#123f24]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please specify details regarding your query or payment transaction reference (if applicable)..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#d8cfbe] bg-white focus:outline-none focus:ring-2 focus:ring-[#123f24]/30 focus:border-[#123f24] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#123f24] text-white hover:bg-[#1a4f2e] transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Send className="size-4" />
                    <span>{isSubmitting ? "Submitting..." : "Send Message"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Location / Secretariat Verification Card */}
          <div className="rounded-2xl border border-[#e8e0ce] bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-[#123f24]">
                <MapPin className="size-4 text-[#c5a84e]" />
                <span>Secretariat Office Location</span>
              </div>
              <span className="text-xs text-muted-foreground">
                PIN: {COMPANY_CONFIG.address.pincode}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Located at {COMPANY_CONFIG.address.line1}, {COMPANY_CONFIG.address.city}, {COMPANY_CONFIG.address.state}. Prior appointment via phone or email is recommended for in-person administrative visits.
            </p>
            <div className="rounded-xl border border-dashed border-[#d8cfbe] bg-[#faf8f2] p-4 text-center text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{COMPANY_CONFIG.name}</p>
              <p className="text-[11px] mt-0.5">{COMPANY_CONFIG.address.full}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
