import { Link, NavLink, Outlet } from "react-router-dom"
import { ShieldCheck, Mail, Phone, MapPin, Clock, ArrowRight, Lock, ExternalLink } from "lucide-react"
import { COMPANY_CONFIG } from "@/config/company"

const NAV_ITEMS = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms & Conditions", path: "/terms-and-conditions" },
  { label: "Refund & Cancellation", path: "/refund-policy" },
  { label: "Contact Us", path: "/contact-us" },
]

export function PublicLegalLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f2] text-foreground antialiased selection:bg-[#c5a84e]/30">
      {/* Top Notification / Trust Bar */}
      <div className="bg-[#0e351f] text-[#e3dcce] text-xs px-4 py-2 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              Official Compliance Portal — {COMPANY_CONFIG.name}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#c9bd9a]">
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3 text-emerald-400" />
              256-Bit SSL Encrypted
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="size-3 text-[#c5a84e]" />
              Razorpay Verified Merchant
            </span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e6decc] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/contact-us" className="flex items-center gap-3 group">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123f24] to-[#1e5833] font-serif-display text-base font-bold text-[#f7e7be] shadow-sm ring-1 ring-black/10 group-hover:scale-105 transition-transform">
              JSG
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#123f24] tracking-tight leading-none group-hover:text-[#1e5833] transition-colors">
                {COMPANY_CONFIG.name}
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-wide mt-0.5">
                Policies, Legal &amp; Compliance Center
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#123f24] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#f1ecd9]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Portal link */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#123f24] text-white hover:bg-[#1a4f2e] transition-colors shadow-xs"
            >
              <span>Admin Login</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="md:hidden border-t border-[#eee7d5] bg-[#f9f5eb] px-3 py-2 flex items-center gap-1 overflow-x-auto text-xs font-medium scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                  isActive
                    ? "bg-[#123f24] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Public Footer */}
      <footer className="mt-auto border-t border-[#e2d8c0] bg-[#0c2e1b] text-[#f4eee1] pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-white/10">
            {/* Col 1: Identity & Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c5a84e] to-[#997e30] font-serif-display text-sm font-bold text-[#0c2e1b]">
                  JSG
                </div>
                <span className="font-semibold text-sm text-white">
                  {COMPANY_CONFIG.name}
                </span>
              </div>
              <p className="text-xs text-[#c9bd9a] leading-relaxed">
                {COMPANY_CONFIG.tagline}
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-[#ded5bf]">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-[#c5a84e] shrink-0 mt-0.5" />
                  <span>{COMPANY_CONFIG.address.full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#c5a84e] shrink-0" />
                  <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="hover:underline">
                    {COMPANY_CONFIG.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#c5a84e] shrink-0" />
                  <a href={`mailto:${COMPANY_CONFIG.email}`} className="hover:underline break-all">
                    {COMPANY_CONFIG.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#c9bd9a]">
                  <Clock className="size-3.5 text-[#c5a84e] shrink-0" />
                  <span>{COMPANY_CONFIG.operatingHours}</span>
                </div>
              </div>
            </div>

            {/* Col 2: Compliance & Legal Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-[#c5a84e]">
                Legal &amp; Policy Pages
              </h4>
              <ul className="space-y-2 text-xs">
                {NAV_ITEMS.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-[#ded5bf] hover:text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="size-1 rounded-full bg-[#c5a84e]" />
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/refund-policy#shipping"
                    className="text-[#ded5bf] hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="size-1 rounded-full bg-[#c5a84e]" />
                    Shipping &amp; Delivery Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Payment Security & Gateway */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-[#c5a84e]">
                Payment Security Partner
              </h4>
              <p className="text-xs text-[#c9bd9a] leading-relaxed">
                All online transactions, membership fees, registrations, and renewals on this platform are processed securely via{" "}
                <span className="font-semibold text-white">Razorpay Payment Gateway</span>.
              </p>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1.5 text-[11px] text-[#ded5bf]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                  <span>PCI-DSS Level 1 Certified Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-emerald-400 shrink-0" />
                  <span>End-to-End Encrypted Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-4 text-[#c5a84e] shrink-0" />
                  <span>Supports UPI, Cards, Net Banking &amp; Wallets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#b3a47e]">
            <p>
              © {new Date().getFullYear()} {COMPANY_CONFIG.name}. All rights reserved.
            </p>
            <p>
              Jurisdiction: Courts of {COMPANY_CONFIG.jurisdiction}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
